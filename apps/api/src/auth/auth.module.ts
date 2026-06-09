import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Env } from '@/config/configuration';
import { LoginUseCase } from './application/login.usecase';
import { PasswordHasher } from './application/password-hasher';
import { RegisterUseCase } from './application/register.usecase';
import { TokenService } from './application/token.service';
import { USER_REPOSITORY } from './domain/user-repository.port';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    TokenService,
    PasswordHasher,
    JwtStrategy,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
  ],
  // Exporta JwtModule para o ChatGateway autenticar conexões WebSocket.
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
