import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Class } from '../entities/class.entity';

@Injectable()
export class ClassModelAction extends AbstractModelAction<Class> {
  constructor(
    @InjectRepository(Class)
    classRepository: Repository<Class>,
  ) {
    super(classRepository, Class);
  }

  /**
   * Fetches all classes and groups them by class name and academic session.
   */
  async findAllWithSession(): Promise<
    Array<{
      name: string;
      academicSession: { id: string; name: string };
      classes: { id: string; arm?: string }[];
    }>
  > {
    const classes = await this.repository.find({
      relations: { academicSession: true },
      order: { name: 'ASC', arm: 'ASC' },
    });

    // Group by name + session
    const grouped: Record<
      string,
      {
        name: string;
        academicSession: { id: string; name: string };
        classes: { id: string; arm?: string }[];
      }
    > = {};
    for (const cls of classes) {
      const key = `${cls.name}_${cls.academicSession?.id}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: cls.name,
          academicSession: {
            id: cls.academicSession?.id,
            name: cls.academicSession?.name,
          },
          classes: [],
        };
      }
      grouped[key].classes.push({ id: cls.id, arm: cls.arm });
    }
    return Object.values(grouped);
  }
}
