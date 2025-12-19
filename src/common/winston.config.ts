import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

import config from '../config/config';

export const winstonConfig: WinstonModuleOptions = {
  levels: winston.config.npm.levels,

  level: config().logger.legLevel,

  // Define log format
  format: winston.format.combine(
    // Add timestamp to every log
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),

    // Handle errors properly
    winston.format.errors({ stack: true }),

    // Add metadata to logs
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),

    // Colorize logs for console (only works in terminal)
    winston.format.colorize({ all: true }),

    // Define the log format structure
    winston.format.printf((info) => {
      const { timestamp, level, message, metadata } = info;
      // Extract metadata if present
      const metaString =
        metadata && typeof metadata === 'object' && Object.keys(metadata).length
          ? ` ${JSON.stringify(metadata)}`
          : '';
      return `${String(timestamp)} [${String(level)}]: ${String(message)}${metaString}`;
    }),
  ),

  // Define where logs should go (transports)
  transports: [
    // Console transport (always active for development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf((info) => {
          const { timestamp, level, message, metadata } = info;
          const metaString =
            metadata &&
            typeof metadata === 'object' &&
            Object.keys(metadata).length
              ? ` ${JSON.stringify(metadata)}`
              : '';
          return `${String(timestamp)} [${String(level)}]: ${String(message)}${metaString}`;
        }),
      ),
    }),

    // File transport for errors (only errors go here)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(), // JSON format for easier parsing
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep last 5 error log files
    }),

    // File transport for all logs (combined.log)
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for HTTP requests (useful for API monitoring)
    new winston.transports.File({
      filename: 'logs/http.log',
      level: 'http',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],

  // Handle exceptions and rejections that aren't caught
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
};
