import { IsString, IsNotEmpty } from 'class-validator';

export class RevokeSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}