import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginUseCase } from '@/auth/application/login.usecase';
import { RegisterUseCase } from '@/auth/application/register.usecase';
import { RequestUser } from '@/auth/infrastructure/jwt.strategy';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Cria uma conta e retorna o token JWT' })
  register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica e retorna o token JWT' })
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuário autenticado' })
  me(@CurrentUser() user: RequestUser) {
    return user;
  }
}
