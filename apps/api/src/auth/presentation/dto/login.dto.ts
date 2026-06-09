import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'segredo123' })
  @IsString()
  @MaxLength(72)
  password!: string;
}
