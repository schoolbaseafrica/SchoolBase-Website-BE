import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { UpdateRoomDTO } from '../dto/update-room-dto';

export const ApiCreateRoom = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create Room',
      description: 'Creates a new room. Room name must be unique.',
    }),
    ApiBody({
      type: CreateRoomDTO,
      description: 'Room creation payload',
      examples: {
        scienceLab: {
          summary: 'Science Lab Example',
          value: {
            name: 'Science Lab A',
            type: 'Laboratory',
            capacity: 30,
            location: 'North Wing',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: sysMsg.ROOM_CREATED_SUCCESSFULLY,
    }),
    ApiConflictResponse({ description: sysMsg.DUPLICATE_ROOM_NAME }),
  );

export const ApiFindAllRooms = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get All Rooms',
      description: 'Retrieves the list of all rooms.',
    }),
    ApiOkResponse({
      description: sysMsg.ROOM_LIST_RETRIEVED_SUCCESSFULLY,
    }),
  );

export const ApiFindOneRoom = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get Room by ID',
      description: 'Retrieves a single room by its ID.',
    }),
    ApiParam({ name: 'id', description: 'Room ID' }),
    ApiOkResponse({
      description: sysMsg.ROOM_RETRIEVED_SUCCESSFULLY,
    }),
    ApiNotFoundResponse({ description: sysMsg.ROOM_NOT_FOUND }),
  );

export const ApiDeleteRoom = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete Room',
      description:
        'Deletes a single room by its unique ID. Only empty rooms can be deleted.',
    }),
    ApiParam({ name: 'id', description: 'Room ID' }),
    ApiOkResponse({
      description: sysMsg.ROOM_DELETED_SUCCESSFULLY,
    }),
    ApiNotFoundResponse({ description: sysMsg.ROOM_NOT_FOUND }),
    ApiConflictResponse({ description: sysMsg.CANNOT_DELETE_OCCUPIED_ROOM }),
  );

export const ApiUpdateRoom = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update Room',
      description: 'Updates details of an existing room.',
    }),
    ApiBody({
      description: 'Room update payload (partial update)',
      examples: {
        updateCapacity: {
          summary: 'Update Capacity Only',
          description: 'Example of updating a single field.',
          value: {
            capacity: 45,
          },
        },
        relocateRoom: {
          summary: 'Rename and Move',
          description: 'Example of updating multiple fields at once.',
          value: {
            name: 'Chemistry Lab B',
            location: 'East Wing',
          },
        },
        updateAllFields: {
          summary: 'Update All Fields',
          description: 'Example of updating every property of the room.',
          value: {
            name: 'Advanced Physics Lab',
            type: 'Laboratory',
            capacity: 50,
            location: 'Research Center Block B',
          },
        },
      },
    }),
    ApiParam({ name: 'id', description: 'Room ID (UUID)', type: 'string' }),
    ApiBody({ type: UpdateRoomDTO }),
    ApiOkResponse({
      description: sysMsg.ROOM_UPDATED_SUCCESSFULLY,
    }),
    ApiNotFoundResponse({ description: sysMsg.ROOM_NOT_FOUND }),
  );
