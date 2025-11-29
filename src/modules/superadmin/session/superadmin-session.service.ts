import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { SuperadminSession } from './entities/superadmin-session.entity';
import {
  ICreateSuperadminSessionData,
  IRevokeSuperadminSessionData,
  IRevokeAllSuperadminSessionsData,
} from './interfaces/superadmin-session-response.interface';

@Injectable()
export class SuperadminSessionService {
  constructor(
    @InjectRepository(SuperadminSession)
    private readonly sessionRepository: Repository<SuperadminSession>,
  ) {}

  private async hashRefreshToken(refreshToken: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(refreshToken, saltRounds);
  }

  async createSession(
    superadminId: string,
    refreshToken: string,
  ): Promise<ICreateSuperadminSessionData> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const refreshTokenHash = await this.hashRefreshToken(refreshToken);

    const session = this.sessionRepository.create({
      superadmin_id: superadminId,
      refresh_token: refreshTokenHash,
      expires_at: expiresAt,
      provider: 'jwt',
      is_active: true,
    });

    const savedSession = await this.sessionRepository.save(session);

    return {
      session_id: savedSession.id,
      expires_at: savedSession.expires_at,
    };
  }

  async revokeSession(
    sessionId: string,
    currentSuperadminId: string,
  ): Promise<IRevokeSuperadminSessionData> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      return { revoked: false, session_id: sessionId };
    }

    if (session.superadmin_id !== currentSuperadminId) {
      return { revoked: false, session_id: sessionId };
    }

    const result = await this.sessionRepository.update(
      { id: sessionId, is_active: true },
      {
        is_active: false,
        revoked_at: new Date(),
      },
    );

    return {
      revoked: result.affected > 0,
      session_id: sessionId,
    };
  }

  async revokeAllSuperadminSessions(
    superadminId: string,
    excludeSessionId?: string,
  ): Promise<IRevokeAllSuperadminSessionsData> {
    const query = this.sessionRepository
      .createQueryBuilder()
      .update(SuperadminSession)
      .set({
        is_active: false,
        revoked_at: new Date(),
      })
      .where('superadmin_id = :superadmin_id', { superadmin_id: superadminId })
      .andWhere('is_active = :is_active', { is_active: true });

    if (excludeSessionId) {
      query.andWhere('id != :exclude_session_id', {
        exclude_session_id: excludeSessionId,
      });
    }

    const result = await query.execute();

    return {
      revoked_count: result.affected || 0,
    };
  }
}
