import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { AuthResult } from '../domain/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../domain/user-repository.port';
import { PasswordHasher } from './password-hasher';
import { TokenService } from './token.service';

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      email,
      displayName: input.displayName.trim(),
      passwordHash,
    });

    return this.tokens.issue(user);
  }
}
