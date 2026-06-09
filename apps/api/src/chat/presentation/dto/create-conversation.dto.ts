import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'Dúvidas sobre arquitetura' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    example: 'Você é um assistente técnico objetivo e responde em português.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  systemPrompt?: string;

  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'ID do usuário dono da conversa' })
  @IsOptional()
  @IsString()
  userId?: string;
}
