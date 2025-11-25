import * as sysMsg from '../../../constants/system.messages';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { RoomType } from '../enums/room-enum';

export const RoomSwagger = {
  tags: ['Rooms'],
  summary: 'Room Management',
  description:
    'Endpoints for creating, retrieving, updating, and deleting physical and virtual rooms.',
  endpoints: {
    create: {
      summary: 'Create Room',
      description:
        'Creates a new room. Room name must be unique. Capacity must be a positive integer if provided.',
      requestBody: {
        required: true,
        content: {
          ['application/json']: {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Science Lab A' },
                type: {
                  type: 'string',
                  enum: Object.values(RoomType),
                  example: RoomType.PHYSICAL,
                },
                capacity: { type: 'integer', example: 30 },
                location: { type: 'string', example: 'North Wing' },
                building: { type: 'string', example: 'Main Block' },
                floor: { type: 'string', example: '1st Floor' },
                description: {
                  type: 'string',
                  example: 'Physics laboratory with projector',
                },
                streams: {
                  type: 'array',
                  items: { type: 'string', format: 'uuid' },
                  example: ['550e8400-e29b-41d4-a716-446655440000'],
                },
              },
              required: ['name', 'type', 'location'],
            },
          },
        },
      },
      responses: {
        ['201']: {
          description: sysMsg.ROOM_CREATED_SUCCESSFULLY,
          content: {
            ['application/json']: {
              schema: {
                type: 'object',
                properties: {
                  status_code: { type: 'number', example: 201 },
                  message: {
                    type: 'string',
                    example: sysMsg.ROOM_CREATED_SUCCESSFULLY,
                  },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      type: { type: 'string' },
                      capacity: { type: 'integer' },
                      location: { type: 'string' },
                      status: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
        ['409']: {
          description: sysMsg.DUPLICATE_ROOM_NAME,
        },
        ['404']: {
          description: sysMsg.INVALID_STREAM_IDS,
        },
      },
    },
    findAll: {
      summary: 'Get All Rooms',
      description:
        'Retrieves all rooms with pagination support. Defaults to page 1 and limit 20 if not provided.',
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          description: 'Page number (defaults to 1)',
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 20,
          },
          description: 'Number of items per page (defaults to 20)',
        },
      ],
      responses: {
        ['200']: {
          description: sysMsg.ROOM_LIST_RETRIEVED_SUCCESSFULLY,
          content: {
            ['application/json']: {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        capacity: { type: 'integer' },
                        status: { type: 'string' },
                      },
                    },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      limit: { type: 'integer' },
                      page: { type: 'integer' },
                      total_pages: { type: 'integer' },
                      has_next: { type: 'boolean' },
                      has_previous: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    findOne: {
      summary: 'Get Room by ID',
      description:
        'Retrieves a single room by its ID, including associated streams.',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'The UUID of the room',
        },
      ],
      responses: {
        ['200']: {
          description: sysMsg.ROOM_RETRIEVED_SUCCESSFULLY,
        },
        ['404']: {
          description: sysMsg.ROOM_NOT_FOUND,
        },
      },
    },
  },
  decorators: {
    create: {
      operation: {
        summary: 'Create Room',
        description:
          'Creates a new room. Requires a unique room name. Optional streams can be assigned via their IDs.',
      },
      body: {
        type: CreateRoomDTO,
        description: 'Create room payload',
        examples: {
          example1: {
            summary: 'Physical Science Lab',
            value: {
              name: 'Science Lab A',
              type: 'PHYSICAL',
              capacity: 30,
              location: 'North Wing',
              floor: '2nd Floor',
              description: 'Physics laboratory with projector',
              building: 'Main Block',
              streams: ['uuid-1', 'uuid-2'],
            },
          },
        },
      },
      response: {
        status: 201,
        description: sysMsg.ROOM_CREATED_SUCCESSFULLY,
      },
      errorResponses: [
        {
          status: 409,
          description: sysMsg.DUPLICATE_ROOM_NAME,
        },
        {
          status: 404,
          description: sysMsg.INVALID_STREAM_IDS,
        },
      ],
    },
    findAll: {
      operation: {
        summary: 'Get All Rooms',
        description:
          'Retrieves a paginated list of all rooms registered in the system.',
      },
      response: {
        status: 200,
        description: sysMsg.ROOM_LIST_RETRIEVED_SUCCESSFULLY,
      },
    },
    findOne: {
      operation: {
        summary: 'Get Room by ID',
        description: 'Retrieves detailed information about a specific room.',
      },
      response: {
        status: 200,
        description: sysMsg.ROOM_RETRIEVED_SUCCESSFULLY,
      },
      errorResponses: [
        {
          status: 404,
          description: sysMsg.ROOM_NOT_FOUND,
        },
      ],
    },
  },
};
