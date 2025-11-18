import { IsString, IsNotEmpty } from 'class-validator';

export class RevokeAllSessionsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}