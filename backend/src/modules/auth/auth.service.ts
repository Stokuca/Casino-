import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueryFailedError } from 'typeorm/error/QueryFailedError';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

import { Player } from '../players/player.entity';
import { Transaction } from '../transactions/transaction.entity';
import { TxType } from '../common/enums';
import { Operator } from '../operators/operator.entity';

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOpts,
  refreshCookieOpts,
} from './cookies';

type Role = 'player' | 'operator';

@Injectable()
export class AuthService {
  constructor(
    private readonly ds: DataSource,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}


  private async signAccess(payload: { sub: string; email?: string; role: Role }) {
    const secret = this.cfg.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is missing');
    const expiresIn = this.cfg.get<string>('JWT_EXPIRES') ?? '15m';
    return this.jwt.signAsync(payload, { secret, expiresIn });
  }

  private async signRefresh(payload: { sub: string; role: Role }) {
    const secret = this.cfg.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET is missing');
    const expiresIn = this.cfg.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';
    return this.jwt.signAsync(payload, { secret, expiresIn });
  }

  private async issueCookies(
    res: Response,
    payload: { sub: string; email?: string; role: Role },
  ) {
    const access = await this.signAccess(payload);
    const refresh = await this.signRefresh({ sub: payload.sub, role: payload.role });
    res.cookie(ACCESS_COOKIE, access, accessCookieOpts);
    res.cookie(REFRESH_COOKIE, refresh, refreshCookieOpts);
  }

  clearCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
  }

  async register(email: string, password: string, res: Response) {
    const normEmail = email.trim().toLowerCase();
    const initialCentsEnv = this.cfg.get<string>('INITIAL_DEPOSIT_CENTS');
    const INITIAL = BigInt(initialCentsEnv ?? '100000');

    const hash = await bcrypt.hash(password, 10);

    let player: Player;
    try {
      player = await this.ds.transaction(async (q) => {
        const pRepo = q.getRepository(Player);
        const txRepo = q.getRepository(Transaction);

        const created = await pRepo.save(
          pRepo.create({ email: normEmail, passwordHash: hash, balanceCents: '0' }),
        );

        await pRepo.update(created.id, { balanceCents: INITIAL.toString() });

        await txRepo.save(
          txRepo.create({
            playerId: created.id,
            type: TxType.DEPOSIT,
            amountCents: INITIAL.toString(),
            balanceAfterCents: INITIAL.toString(),
            meta: { reason: 'initial_credit' },
          }),
        );

        return created;
      });
    } catch (e) {
      if (e instanceof QueryFailedError && (e as any).code === '23505') {
        throw new BadRequestException('Email already in use');
      }
      throw e;
    }

    await this.issueCookies(res, { sub: player.id, role: 'player', email: player.email });

    return {
      role: 'player' as const,
      user: { id: player.id, email: player.email, balanceCents: player.balanceCents },
    };
  }

  async playerLogin(email: string, password: string, res: Response) {
    const normEmail = email.trim().toLowerCase();
    const repo = this.ds.getRepository(Player);
    const user = await repo.findOne({ where: { email: normEmail } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.issueCookies(res, { sub: user.id, role: 'player', email: user.email });

    return {
      role: 'player' as const,
      user: { id: user.id, email: user.email, balanceCents: user.balanceCents },
    };
  }

  async operatorLogin(email: string, password: string, res: Response) {
    const normEmail = email.trim().toLowerCase();
    const repo = this.ds.getRepository(Operator);
    const op = await repo.findOne({ where: { email: normEmail } });
    if (!op) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, op.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.issueCookies(res, { sub: op.id, role: 'operator', email: op.email });

    return { role: 'operator' as const, user: { id: op.id, email: op.email } };
  }

  async refreshFromCookie(res: Response, refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException('Missing refresh');

    const secret = this.cfg.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET is missing');

    let decoded: { sub: string; role: Role };
    try {
      decoded = await this.jwt.verifyAsync(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Invalid refresh');
    }

    await this.issueCookies(res, { sub: decoded.sub, role: decoded.role });
    return { ok: true };
  }

  async parseMe(accessToken: string | undefined) {
    if (!accessToken) return { role: null, user: null };

    const secret = this.cfg.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is missing');

    try {
      const payload: any = await this.jwt.verifyAsync(accessToken, { secret });
      return {
        role: payload.role as Role,
        user: { id: payload.sub, email: payload.email },
      };
    } catch {
      return { role: null, user: null };
    }
  }
}
