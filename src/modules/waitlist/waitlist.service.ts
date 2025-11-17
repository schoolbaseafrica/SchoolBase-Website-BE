import {
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EmailTemplateID } from 'src/constants/email-constants';

import { SYS_MSG } from '../../constants/system-messages';
import { EmailService } from '../email/email.service';
import { EmailPayload } from '../email/email.types';


import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { UpdateWaitlistDto } from './dto/update-waitlist.dto';
import { Waitlist } from './entities/waitlist.entity';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);
  constructor(
    @InjectRepository(Waitlist)
    private readonly waitlistRepository: Repository<Waitlist>,
    private readonly emailService: EmailService,
  ) {}

  async create(createWaitlistDto: CreateWaitlistDto): Promise<Waitlist> {
    const existingEntry = await this.waitlistRepository.findOne({
      where: { email: createWaitlistDto.email },
    });

    if (existingEntry) {
      throw new ConflictException(SYS_MSG.emailAlreadyExists);
    }

    const waitlistEntry = this.waitlistRepository.create(createWaitlistDto);
    const savedEntry = await this.waitlistRepository.save(waitlistEntry);

    const emailPayload: EmailPayload = {
      to: [{ email: savedEntry.email, name: savedEntry.firstName }],
      subject: "You're on the Waitlist! | Open School Portal",
      templateNameID: EmailTemplateID.WAITLIST_WELCOME,
      context: {
        greeting: `Hi ${savedEntry.firstName},`,
      },
    };

    this.emailService.sendMail(emailPayload).catch((err) => {
      this.logger.error(
        `Failed to queue welcome email for ${savedEntry.email}`,
        err.message,
      );
    });

    return savedEntry;
  }

  async findAll(): Promise<Waitlist[]> {
    return this.waitlistRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Waitlist> {
    const entry = await this.waitlistRepository.findOne({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException(`Waitlist entry with ID ${id} not found`);
    }

    return entry;
  }

  async update(
    id: string,
    updateWaitlistDto: UpdateWaitlistDto,
  ): Promise<Waitlist> {
    const entry = await this.findOne(id);

    if (updateWaitlistDto.email && updateWaitlistDto.email !== entry.email) {
      const existingEmail = await this.waitlistRepository.findOne({
        where: { email: updateWaitlistDto.email },
      });

      if (existingEmail) {
        throw new ConflictException(SYS_MSG.emailAlreadyExists);
      }
    }

    Object.assign(entry, updateWaitlistDto);
    return this.waitlistRepository.save(entry);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    await this.waitlistRepository.remove(entry);
  }
}
