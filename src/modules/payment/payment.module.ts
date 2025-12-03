import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeesModule } from '../fees/fees.module';
import { FileModule } from '../shared/file/file.module';
import { StudentModule } from '../student/student.module';
import { UploadModule } from '../upload/upload.module';

import { PaymentController } from './controllers/payment.controller';
import { Payment } from './entities/payment.entity';
import { PaymentModelAction } from './model-action/payment.model-action';
import { PaymentValidationService } from './services/payment-validation.service';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    FeesModule,
    FileModule,
    UploadModule,
    StudentModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentModelAction, PaymentService, PaymentValidationService],
  exports: [PaymentModelAction, PaymentService],
})
export class PaymentModule {}
