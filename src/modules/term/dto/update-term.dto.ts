import { PartialType } from '@nestjs/swagger';
import { CreateTermDto } from './create-term.dto';

export class UpdateTermDto extends PartialType(CreateTermDto) {}
