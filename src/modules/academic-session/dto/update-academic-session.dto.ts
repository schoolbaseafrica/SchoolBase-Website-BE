import { PartialType } from '@nestjs/swagger';

import { CreateAcademicSessionDto } from './create-academic-session.dto';

export class UpdateAcademicSessionDto extends PartialType(
  CreateAcademicSessionDto,
) {}
