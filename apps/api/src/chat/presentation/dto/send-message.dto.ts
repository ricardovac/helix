import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Explique clean architecture em uma frase.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;
}
