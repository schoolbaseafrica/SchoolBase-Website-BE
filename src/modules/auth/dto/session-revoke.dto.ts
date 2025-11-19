import { IsString, IsNotEmpty } from 'class-validator';

export class RevokeSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}

export class RevokeAllSessionsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
