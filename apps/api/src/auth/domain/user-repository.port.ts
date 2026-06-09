import { AuthUser, NewUser, UserWithSecret } from './user.entity';

/**
 * Port de saída para persistência de usuários (Postgres/Prisma).
 */
export interface UserRepository {
  create(data: NewUser): Promise<AuthUser>;
  findByEmail(email: string): Promise<UserWithSecret | null>;
  findById(id: string): Promise<AuthUser | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
