import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeesModule } from '../fees/fees.module';
import { FileModule } from '../shared/file/file.module';

import { Payment } from './entities/payment.entity';
import { PaymentModelAction } from './model-action/payment.model-action';
import { FeePaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentValidationService } from './services/payment-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    FeesModule, // Ensure FeesModelAction is exported
    FileModule, // Ensure FileService is exported
  ],
  controllers: [FeePaymentController],
  providers: [PaymentModelAction, PaymentService, PaymentValidationService],
  exports: [PaymentModelAction, PaymentService],
})
export class FeePaymentModule {}
