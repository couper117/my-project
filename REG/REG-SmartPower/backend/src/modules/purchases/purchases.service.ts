/**
 * Vending state machine: pending -> paid -> vending -> completed
 *                                   \-> failed -> refunded
 *
 * Invariant: money captured <=> exactly one valid STS token delivered,
 * or a refund is issued. Enforced via idempotency keys, DB transactions,
 * and a compensating refund queue.
 */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { Purchase, PurchaseStatus } from './purchase.entity';
import { PaymentsService } from '../payments/payments.service';
import { RegVendingAdapter } from '../../integration/reg-vending.adapter';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class PurchasesService {
  private readonly log = new Logger(PurchasesService.name);

  constructor(
    @InjectRepository(Purchase) private purchases: Repository<Purchase>,
    private payments: PaymentsService,
    private vending: RegVendingAdapter,
    private notifications: NotificationsService,
    private audit: AuditService,
    @InjectQueue('refunds') private refundQueue: Queue,
  ) {}

  /** Create purchase — safe to retry with the same idempotency key. */
  async create(userId: string, dto: CreatePurchaseDto, idempotencyKey: string) {
    // 1. Idempotency: return existing purchase for a repeated key.
    const existing = await this.purchases.findOneBy({ idempotencyKey });
    if (existing) return this.toDto(existing);

    if (dto.amountRwf < 100) {
      throw new BadRequestException('minimum purchase is 100 RWF');
    }

    // 2. Persist PENDING before touching any external system.
    const purchase = await this.purchases.save(
      this.purchases.create({
        idempotencyKey,
        userId,
        meterId: dto.meterId,
        amountRwf: dto.amountRwf,
        method: dto.method,
        status: PurchaseStatus.PENDING,
      }),
    );

    // 3. Kick off payment (MoMo push / card checkout). Non-blocking:
    //    confirmation arrives via PSP webhook -> onPaymentConfirmed().
    const action = await this.payments.initiate(purchase, dto.paymentMethodId);

    await this.audit.log('user', userId, 'purchase.create', 'purchase', purchase.id);
    return { ...this.toDto(purchase), payment_action: action };
  }

  /** Called by PaymentsService when the PSP webhook confirms capture. */
  async onPaymentConfirmed(purchaseId: string, pspRef: string) {
    // Row lock prevents double-processing on duplicate webhooks.
    await this.purchases.manager.transaction(async (em) => {
      const p = await em.findOne(Purchase, {
        where: { id: purchaseId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!p) throw new NotFoundException();
      if (p.status !== PurchaseStatus.PENDING) return; // already handled

      p.status = PurchaseStatus.PAID;
      p.pspRef = pspRef;
      await em.save(p);
    });

    await this.vend(purchaseId);
  }

  /** Calls REG vending API; on failure schedules an automatic refund. */
  private async vend(purchaseId: string) {
    const p = await this.purchases.findOneByOrFail({ id: purchaseId });

    await this.purchases.update(p.id, { status: PurchaseStatus.VENDING });
    try {
      const result = await this.vending.vendToken({
        meterNumber: p.meter.meterNumber,
        amountRwf: p.amountRwf,
        externalRef: p.id, // REG-side idempotency
      });

      await this.purchases.manager.transaction(async (em) => {
        await em.update(Purchase, p.id, {
          status: PurchaseStatus.COMPLETED,
          kwh: result.unitsKwh,
          completedAt: new Date(),
        });
        await em.insert('tokens', {
          purchase_id: p.id,
          token_enc: result.tokenEncrypted, // AES-256-GCM before persist
          units_kwh: result.unitsKwh,
        });
      });

      // Push + SMS fallback so users without data still get the token.
      await this.notifications.sendToken(p.userId, p.id, result.tokenPlain);
      this.log.log(`purchase ${p.id} completed: ${result.unitsKwh} kWh`);
    } catch (err) {
      this.log.error(`vending failed for ${p.id}`, err as Error);
      await this.purchases.update(p.id, { status: PurchaseStatus.FAILED });
      // Compensating action: refund with retry/backoff; alerts support on
      // final failure and notifies the customer either way.
      await this.refundQueue.add('refund', { purchaseId: p.id }, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 30_000 },
      });
    }
  }

  private toDto(p: Purchase) {
    return {
      id: p.id,
      meter_id: p.meterId,
      amount_rwf: p.amountRwf,
      kwh: p.kwh,
      method: p.method,
      status: p.status,
      created_at: p.createdAt,
    };
  }
}

export interface CreatePurchaseDto {
  meterId: string;
  amountRwf: number;
  method: 'mtn_momo' | 'airtel_money' | 'visa' | 'mastercard' | 'bank' | 'qr';
  paymentMethodId?: string;
}
