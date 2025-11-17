import { PartialType } from '@nestjs/mapped-types';
import { CreateWaitlistDto } from './create-waitlist.dto';

export class UpdateWaitlistDto extends PartialType(CreateWaitlistDto) {}
