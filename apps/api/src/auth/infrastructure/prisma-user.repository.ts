import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import {
  AuthUser,
  NewUser,
  UserWithSecret,
} from '@/auth/domain/user.entity';
import { UserRepository } from '@/auth/domain/user-repository.port';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: NewUser): Promise<AuthUser> {
    const row = await this.prisma.user.create({
      data: {
        email: data.email,
        displayName: data.displayName,
        passwordHash: data.passwordHash,
      },
    });
    return { id: row.id, email: row.email, displayName: row.displayName };
  }

  async findByEmail(email: string): Promise<UserWithSecret | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      passwordHash: row.passwordHash,
    };
  }

  async findById(id: string): Promise<AuthUser | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id, email: row.email, displayName: row.displayName };
  }
}
