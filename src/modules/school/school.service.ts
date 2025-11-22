import * as fs from 'fs/promises';
import * as path from 'path';

import { Injectable, ConflictException } from '@nestjs/common';
import sharp from 'sharp';

import * as sysMsg from '../../constants/system.messages';

import { CreateInstallationDto } from './dto/create-installation.dto';
import { SchoolModelAction } from './model-actions/school.action';

@Injectable()
export class SchoolService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'logos');

  constructor(private readonly schoolModelAction: SchoolModelAction) {}

  async processInstallation(
    createInstallationDto: CreateInstallationDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logoFile?: any,
  ) {
    // Check if installation already completed
    const installations = await this.schoolModelAction.list({
      filterRecordOptions: { installation_completed: true },
    });

    if (installations.payload && installations.payload.length > 0) {
      throw new ConflictException(sysMsg.INSTALLATION_ALREADY_COMPLETED);
    }

    // Check if school name already exists
    const schools = await this.schoolModelAction.list({
      filterRecordOptions: { name: createInstallationDto.name },
    });

    if (schools.payload && schools.payload.length > 0) {
      throw new ConflictException(
        `School with name "${createInstallationDto.name}" already exists`,
      );
    }

    // Process logo file if provided
    let logoUrl: string | null = null;
    if (logoFile) {
      logoUrl = await this.uploadLogo(logoFile);
    }

    // Create school record
    const school = await this.schoolModelAction.create({
      createPayload: {
        name: createInstallationDto.name,
        logo_url: logoUrl,
        primary_color: createInstallationDto.primary_color,
        secondary_color: createInstallationDto.secondary_color,
        accent_color: createInstallationDto.accent_color,
        installation_completed: true,
      },
      transactionOptions: { useTransaction: false },
    });

    return {
      id: school.id,
      name: school.name,
      logo_url: school.logo_url,
      primary_color: school.primary_color,
      secondary_color: school.secondary_color,
      accent_color: school.accent_color,
      installation_completed: school.installation_completed,
      message: sysMsg.INSTALLATION_COMPLETED,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async uploadLogo(file: any): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const filename = `logo-${Date.now()}.png`;
    const filepath = path.join(this.uploadDir, filename);

    await sharp(file.buffer).resize(200, 200).png().toFile(filepath);

    return `/uploads/logos/${filename}`;
  }

  findAll() {
    return `This action returns all school`;
  }

  findOne(id: number) {
    return `This action returns a #${id} school`;
  }

  remove(id: number) {
    return `This action removes a #${id} school`;
  }
}
