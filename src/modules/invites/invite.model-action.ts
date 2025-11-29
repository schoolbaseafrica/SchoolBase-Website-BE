import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Invite } from './entities/invites.entity';

@Injectable()
export class InviteModelAction extends AbstractModelAction<Invite> {
  constructor(
    @InjectRepository(Invite)
    private readonly inviteRepository: Repository<Invite>,
  ) {
    super(inviteRepository, Invite);
  }
}
