import { Module } from '@nestjs/common';

import { ResolverModule } from './resolver/resolver.module';

@Module({
  imports: [ResolverModule],
})
export class DashboardModule {}
