import {
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  LoggerService,
  ArgumentsHost,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import config from 'src/config/config';

import { BaseException } from '../base-exception';
import { UserNotFoundException } from '../domain.exceptions';

import { GlobalExceptionFilter } from './global-exception.filter';

interface IMockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

interface IMockRequest {
  url: string;
  method: string;
  user?: {
    id: string;
  };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: IMockResponse;
  let mockRequest: IMockRequest;
  let originalEnv: string | undefined;
  let mockLogger: LoggerService;

  beforeEach(async () => {
    // Create mock Winston logger
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      user: { id: 'user-123' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    // Store original NODE_ENV
    originalEnv = config().env;
  });

  afterEach(() => {
    // Restore original NODE_ENV
    if (originalEnv) {
      config().env = originalEnv;
    } else {
      delete config().env;
    }
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with string message', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 400,
          message: 'Test error',
          data: null,
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new BadRequestException({
        message: 'Validation failed',
        error: 'Bad Request',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 400,
          message: 'Validation failed',
          data: null,
          error: 'Bad Request',
        }),
      );
    });

    it('should handle HttpException with array message', () => {
      const exception = new BadRequestException(['Error 1', 'Error 2']);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 400,
          message: expect.arrayContaining(['Error 1', 'Error 2']),
          data: null,
        }),
      );
    });

    it('should handle different HTTP status codes', () => {
      const statusCodes = [
        { exception: new UnauthorizedException('Unauthorized'), status: 401 },
        { exception: new ForbiddenException('Forbidden'), status: 403 },
        { exception: new NotFoundException('Not Found'), status: 404 },
        {
          exception: new InternalServerErrorException('Server Error'),
          status: 500,
        },
      ];

      statusCodes.forEach(({ exception, status }) => {
        mockResponse.status.mockClear();
        mockResponse.json.mockClear();

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(status);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status_code: status,
            data: null,
          }),
        );
      });
    });
  });

  describe('BaseException handling', () => {
    it('should handle BaseException correctly', () => {
      const exception = new BaseException('Custom error', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 404,
          message: 'Custom error',
          data: null,
        }),
      );
    });

    it('should handle domain exceptions extending BaseException', () => {
      const exception = new UserNotFoundException('user-123');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 404,
          message: expect.stringContaining('User with id user-123 not found'),
          data: null,
        }),
      );
    });
  });

  describe('Validation error handling', () => {
    it('should handle validation errors with response object', () => {
      const validationError = {
        response: {
          message: ['Field is required', 'Field must be a string'],
          error: 'Validation Error',
        },
        status: 400,
      };

      filter.catch(validationError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 400,
          message: expect.arrayContaining([
            'Field is required',
            'Field must be a string',
          ]),
          data: null,
          error: 'Validation Error',
        }),
      );
    });

    it('should handle validation errors with default values', () => {
      const validationError = {
        response: {},
        status: 400,
      };

      filter.catch(validationError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 400,
          message: 'Validation failed',
          data: null,
          error: 'Validation Error',
        }),
      );
    });
  });

  describe('Database error handling', () => {
    it('should handle database errors with code', () => {
      const dbError = {
        code: 'ER_DUP_ENTRY',
        message: 'Duplicate entry',
        stack: 'Error stack trace',
      };

      filter.catch(dbError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 500,
          message: 'Database operation failed',
          data: null,
          error: 'ER_DUP_ENTRY',
        }),
      );
    });

    it('should handle database errors without code', () => {
      const dbError = {
        message: 'Connection timeout',
      };

      filter.catch(dbError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 500,
          message: 'Internal server error',
          data: null,
          error: 'INTERNAL_SERVER_ERROR',
        }),
      );
    });
  });

  describe('Unknown error handling', () => {
    it('should handle Error instances', () => {
      const error = new Error('Unknown error occurred');
      error.stack = 'Error stack trace';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 500,
          message: 'Internal server error',
          data: null,
          error: 'INTERNAL_SERVER_ERROR',
        }),
      );
    });

    it('should handle non-Error objects', () => {
      const unknownError = { someProperty: 'value' };

      filter.catch(unknownError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 500,
          message: 'Internal server error',
          data: null,
          error: 'INTERNAL_SERVER_ERROR',
        }),
      );
    });

    it('should handle null/undefined errors', () => {
      filter.catch(null as unknown, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 500,
          message: 'Internal server error',
          data: null,
          error: 'INTERNAL_SERVER_ERROR',
        }),
      );
    });
  });

  describe('Environment-specific behavior', () => {
    it('should include stack trace in development mode', () => {
      config().env = 'development';

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: 'Error: Test error\n    at test.js:1:1',
        }),
      );
    });

    // it('should not include stack trace in production mode', () => {
    //   config().env = 'production';

    //   const error = new Error('Test error');
    //   error.stack = 'Error: Test error\n    at test.js:1:1';

    //   filter.catch(error, mockArgumentsHost);

    //   expect(mockResponse.json).toHaveBeenCalledWith(
    //     expect.not.objectContaining({
    //       stack: expect.anything(),
    //     }),
    //   );
    // });

    // it('should sanitize error messages in production for 500 errors', () => {
    //   config().env = 'production';

    //   const error = new Error('Sensitive internal error details');

    //   filter.catch(error, mockArgumentsHost);

    //   expect(mockResponse.json).toHaveBeenCalledWith(
    //     expect.objectContaining({
    //       status_code: 500,
    //       message: 'An internal server error occurred',
    //       data: null,
    //       error: 'Internal Server Error',
    //     }),
    //   );
    // });

    it('should not sanitize 4xx errors in production', () => {
      config().env = 'production';

      const exception = new BadRequestException('Client error message');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status_code: 400,
          message: 'Client error message',
          data: null,
        }),
      );
    });
  });

  describe('Response structure', () => {
    it('should always include required fields', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall).toHaveProperty('status_code');
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('error');
      expect(responseCall).toHaveProperty('data');
      expect(responseCall).toHaveProperty('timestamp');
      expect(responseCall).toHaveProperty('path');
      expect(responseCall).toHaveProperty('method');
    });

    it('should format timestamp as ISO string', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(responseCall.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('should format message as string or array', () => {
      const exception = new HttpException(
        'Single message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0];
      expect(
        typeof responseCall.message === 'string' ||
          Array.isArray(responseCall.message),
      ).toBe(true);
    });
  });

  describe('Request context', () => {
    it('should include request URL in response', () => {
      mockRequest.url = '/api/users/123';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users/123',
        }),
      );
    });

    it('should include request method in response', () => {
      mockRequest.method = 'POST';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should handle requests without user context', () => {
      delete mockRequest.user;
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});
