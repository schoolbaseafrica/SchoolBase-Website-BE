import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { MoreThan, Repository } from 'typeorm';

import { CannotRevokeOtherSessionsException } from '../../common/exceptions/domain.exceptions';
import * as sysMsg from '../../constants/system.messages';

import { Session } from './entities/session.entity';
import {
  IRevokeSessionData,
  ICreateSessionData,
  IRevokeAllSessionsData,
} from './interface/session-response.interface';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  private async hashRefreshToken(refreshToken: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(refreshToken, saltRounds);
  }

  async createSession(
    userId: string,
    refreshToken: string,
  ): Promise<ICreateSessionData> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const refreshTokenHash = await this.hashRefreshToken(refreshToken);

    const session = this.sessionRepository.create({
      user_id: userId,
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
    currentUserId: string,
  ): Promise<IRevokeSessionData> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['user'],
    });

    if (!session) {
      return { revoked: false, session_id: sessionId };
    }

    if (session.user_id !== currentUserId) {
      throw new CannotRevokeOtherSessionsException(
        sysMsg.CANNOT_REVOKE_OTHER_SESSIONS,
      );
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

  async revokeAllUserSessions(
    userId: string,
    excludeSessionId?: string,
  ): Promise<IRevokeAllSessionsData> {
    const query = this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({
        is_active: false,
        revoked_at: new Date(),
      })
      .where('user_id = :user_id', { user_id: userId })
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

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<Session | null> {
    // Get all active sessions for the user
    const now = new Date();
    const validSessions = await this.sessionRepository.find({
      where: {
        user_id: userId,
        is_active: true,
        expires_at: MoreThan(now),
      },
    });
    // Try to match the refresh token against stored hashes
    const comparisonResults = await Promise.all(
      validSessions.map((session) =>
        bcrypt.compare(refreshToken, session.refresh_token),
      ),
    );

    const matchingSessionIndex = comparisonResults.findIndex(
      (isMatch) => isMatch,
    );

    if (matchingSessionIndex !== -1) {
      return validSessions[matchingSessionIndex];
    }

    return null;
  }
}
