/**
 * Anti-corruption adapter for REG's existing STS vending system.
 * The app NEVER talks to meters: it requests a standard 20-digit STS
 * token from REG's vending backend, exactly like USSD/agent channels do.
 *
 * Wrapped with circuit breaker + timeout so vending outages degrade
 * gracefully (purchases queue, users notified) instead of cascading.
 */
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import * as crypto from 'crypto';

export interface VendRequest {
  meterNumber: string;
  amountRwf: number;
  externalRef: string; // our purchase id, used as REG-side idempotency key
}

export interface VendResult {
  tokenPlain: string;      // delivered to user then discarded from memory
  tokenEncrypted: Buffer;  // AES-256-GCM for persistence
  unitsKwh: number;
}

@Injectable()
export class RegVendingAdapter {
  private readonly log = new Logger(RegVendingAdapter.name);
  private failures = 0;
  private openUntil = 0; // circuit breaker

  constructor(private http: HttpService) {}

  async vendToken(req: VendRequest): Promise<VendResult> {
    // --- circuit breaker: fail fast while REG vending is down ---
    if (Date.now() < this.openUntil) {
      throw new ServiceUnavailableException('vending_unavailable');
    }

    try {
      const res = await firstValueFrom(
        this.http
          .post(
            `${process.env.REG_VENDING_URL}/vend`,
            {
              meter: req.meterNumber,
              amount: req.amountRwf,
              reference: req.externalRef,
              channel: 'SMARTPOWER_APP',
            },
            {
              headers: this.signedHeaders(req),
            },
          )
          .pipe(timeout(15_000)),
      );

      this.failures = 0;
      const token: string = res.data.token; // 20-digit STS token
      return {
        tokenPlain: token,
        tokenEncrypted: this.encrypt(token),
        unitsKwh: Number(res.data.units),
      };
    } catch (err) {
      if (++this.failures >= 5) {
        this.openUntil = Date.now() + 60_000; // open for 60 s
        this.log.warn('vending circuit OPEN');
      }
      throw err;
    }
  }

  /** HMAC request signing per REG integration agreement. */
  private signedHeaders(req: VendRequest) {
    const ts = Date.now().toString();
    const payload = `${req.externalRef}:${req.meterNumber}:${req.amountRwf}:${ts}`;
    const signature = crypto
      .createHmac('sha256', process.env.REG_VENDING_SECRET!)
      .update(payload)
      .digest('hex');
    return {
      'X-Client-Id': process.env.REG_VENDING_CLIENT_ID,
      'X-Timestamp': ts,
      'X-Signature': signature,
    };
  }

  /** AES-256-GCM envelope encryption (key from Key Vault). */
  private encrypt(plain: string): Buffer {
    const key = Buffer.from(process.env.TOKEN_ENC_KEY!, 'base64');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), enc]);
  }
}
