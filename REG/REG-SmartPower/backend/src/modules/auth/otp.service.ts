/**
 * OTP service — SMS/email one-time codes for registration, login and
 * step-up (2FA). Codes live only in Redis (TTL 5 min), hashed, with
 * attempt limits and per-identifier rate limiting.
 */
import {
  Injectable,
  TooManyRequestsException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as crypto from 'crypto';

import { SmsGateway } from '../../integration/sms.gateway';

const OTP_TTL_S = 300;        // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;

@Injectable()
export class OtpService {
  constructor(
    @InjectRedis() private redis: Redis,
    private sms: SmsGateway,
  ) {}

  async send(identifier: string): Promise<void> {
    // Rate limit sends to stop SMS-pumping abuse.
    const sends = await this.redis.incr(`otp:sends:${identifier}`);
    if (sends === 1) await this.redis.expire(`otp:sends:${identifier}`, 3600);
    if (sends > MAX_SENDS_PER_HOUR) {
      throw new TooManyRequestsException('otp_rate_limited');
    }

    // 6-digit cryptographically random code.
    const code = crypto.randomInt(100000, 1000000).toString();

    await this.redis
      .multi()
      .set(`otp:code:${identifier}`, this.hash(identifier, code), 'EX', OTP_TTL_S)
      .del(`otp:attempts:${identifier}`)
      .exec();

    await this.sms.send(
      identifier,
      `REG SmartPower: your verification code is ${code}. ` +
        `Valid 5 minutes. Never share this code.`,
    );
  }

  async verify(identifier: string, code: string): Promise<void> {
    const attempts = await this.redis.incr(`otp:attempts:${identifier}`);
    await this.redis.expire(`otp:attempts:${identifier}`, OTP_TTL_S);
    if (attempts > MAX_VERIFY_ATTEMPTS) {
      await this.redis.del(`otp:code:${identifier}`); // burn the code
      throw new UnauthorizedException('otp_expired');
    }

    const stored = await this.redis.get(`otp:code:${identifier}`);
    const valid =
      stored !== null &&
      crypto.timingSafeEqual(
        Buffer.from(stored, 'hex'),
        Buffer.from(this.hash(identifier, code), 'hex'),
      );
    if (!valid) throw new UnauthorizedException('otp_invalid');

    await this.redis.del(`otp:code:${identifier}`); // single use
  }

  /** HMAC so a Redis dump alone cannot reveal codes. */
  private hash(identifier: string, code: string): string {
    return crypto
      .createHmac('sha256', process.env.OTP_PEPPER!)
      .update(`${identifier}:${code}`)
      .digest('hex');
  }
}
