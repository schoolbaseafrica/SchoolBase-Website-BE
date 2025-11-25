import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

import { Injectable, ConflictException } from '@nestjs/common';
import * as sharp from 'sharp';

import * as sysMsg from '../../constants/system.messages';

import { CreateInstallationDto } from './dto/create-installation.dto';
import { SchoolModelAction } from './model-actions/school.action';

interface IUploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class SchoolService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'logos');

  constructor(private readonly schoolModelAction: SchoolModelAction) {}

  async processInstallation(
    createInstallationDto: CreateInstallationDto,
    logoFile?: IUploadedFile,
  ) {
    // Check for existing installation and duplicate name in parallel
    const [installations, schools] = await Promise.all([
      this.schoolModelAction.list({
        filterRecordOptions: { installation_completed: true },
      }),
      this.schoolModelAction.list({
        filterRecordOptions: { name: createInstallationDto.name },
      }),
    ]);

    if (installations.payload && installations.payload.length > 0) {
      throw new ConflictException(sysMsg.INSTALLATION_ALREADY_COMPLETED);
    }

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
        address: createInstallationDto.address,
        email: createInstallationDto.email,
        phone: createInstallationDto.phone,
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
      address: school.address,
      email: school.email,
      phone: school.phone,
      logo_url: school.logo_url,
      primary_color: school.primary_color,
      secondary_color: school.secondary_color,
      accent_color: school.accent_color,
      installation_completed: school.installation_completed,
      message: sysMsg.INSTALLATION_COMPLETED,
    };
  }

  private async uploadLogo(file: IUploadedFile): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const filename = `logo-${crypto.randomBytes(16).toString('hex')}.png`;
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
