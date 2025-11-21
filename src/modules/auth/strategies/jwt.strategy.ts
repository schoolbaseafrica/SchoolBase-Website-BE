import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import config from '../../../config/config';
import { UserRole } from '../../shared/enums';

interface IJwtPayload {
  sub: string;
  email: string;
  role: UserRole[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config().jwt.secret,
    });
  }

  validate(payload: IJwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.role,
    };
  }
}
