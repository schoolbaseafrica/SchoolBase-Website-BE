import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Term } from '../academic-term/entities/term.entity';
import { TermModelAction } from '../academic-term/model-actions';
import { Class } from '../class/entities/class.entity';
import { ClassModelAction } from '../class/model-actions/class.actions';
import { PaymentModule } from '../payment/payment.module';
import { StudentModule } from '../student/student.module';

import { FeeAssignment } from './entities/fee-assignment.entity';
import { Fees } from './entities/fees.entity';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { FeesModelAction } from './model-action/fees.model-action';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fees, Class, Term, FeeAssignment]),
    forwardRef(() => PaymentModule),
    StudentModule,
  ],
  controllers: [FeesController],
  providers: [FeesService, FeesModelAction, TermModelAction, ClassModelAction],
  exports: [
    FeesService,
    FeesModelAction,
    TermModelAction,
    ClassModelAction,
    TypeOrmModule,
  ],
})
export class FeesModule {}
