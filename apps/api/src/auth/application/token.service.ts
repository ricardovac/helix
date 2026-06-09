import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResult, AuthUser, JwtPayload } from '../domain/user.entity';

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  issue(user: AuthUser): AuthResult {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return { accessToken: this.jwt.sign(payload), user };
  }
}
