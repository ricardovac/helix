import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthResult } from '../domain/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../domain/user-repository.port';
import { PasswordHasher } from './password-hasher';
import { TokenService } from './token.service';

export interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    // Mesma mensagem para usuário inexistente e senha errada (evita enumeração).
    if (!user || !(await this.hasher.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.tokens.issue({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });
  }
}
