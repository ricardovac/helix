import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('Conectado ao Postgres');
    } catch (err) {
      // Não derruba o boot: a API sobe em modo degradado e o /health reporta.
      this.logger.warn(
        `Postgres indisponível no boot (${(err as Error).message}). Seguindo em modo degradado.`,
      );
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
