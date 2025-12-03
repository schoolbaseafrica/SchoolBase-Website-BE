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
    // Check for existing installation
    const { payload: installations } = await this.schoolModelAction.list({
      filterRecordOptions: { installation_completed: true },
    });

    const existingSchool =
      installations && installations.length > 0 ? installations[0] : null;

    if (existingSchool) {
      // UPDATE PATH - School installation already exists
      // Process new logo if provided, otherwise keep existing logo
      let logoUrl = existingSchool.logo_url;
      if (logoFile) {
        logoUrl = await this.uploadLogo(logoFile);
      }

      // Update existing school record
      const updatedSchool = await this.schoolModelAction.update({
        identifierOptions: { id: existingSchool.id },
        updatePayload: {
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
        id: updatedSchool.id,
        name: updatedSchool.name,
        address: updatedSchool.address,
        email: updatedSchool.email,
        phone: updatedSchool.phone,
        logo_url: updatedSchool.logo_url,
        primary_color: updatedSchool.primary_color,
        secondary_color: updatedSchool.secondary_color,
        accent_color: updatedSchool.accent_color,
        installation_completed: updatedSchool.installation_completed,
        message: sysMsg.INSTALLATION_UPDATED,
      };
    } else {
      // CREATE PATH - First time installation
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
  }

  private async uploadLogo(file: IUploadedFile): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const filename = `logo-${crypto.randomBytes(16).toString('hex')}.png`;
    const filepath = path.join(this.uploadDir, filename);

    await sharp(file.buffer).resize(200, 200).png().toFile(filepath);

    return `/uploads/logos/${filename}`;
  }

  async getSchoolDetails() {
    const { payload } = await this.schoolModelAction.list({
      filterRecordOptions: { installation_completed: true },
    });

    if (!payload || payload.length === 0) {
      throw new ConflictException(sysMsg.SCHOOL_NOT_FOUND);
    }

    const school = payload[0];

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
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} school`;
  }

  remove(id: number) {
    return `This action removes a #${id} school`;
  }
}
