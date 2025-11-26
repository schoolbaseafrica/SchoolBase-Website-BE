import { PartialType } from '@nestjs/swagger';

import { ConfigureDatabaseDto } from './configure-database.dto';

export class UpdateDatabaseDto extends PartialType(ConfigureDatabaseDto) {}
