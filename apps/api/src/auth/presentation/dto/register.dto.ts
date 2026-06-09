import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Ana Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @ApiProperty({ example: 'segredo123', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;
}
