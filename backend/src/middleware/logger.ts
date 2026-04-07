// Winston logger configuration

import winston from 'winston';
import { LOG_LEVELS } from '../config/constants';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || LOG_LEVELS.INFO,
  format: logFormat,
  defaultMeta: { service: 'nemicare-backend' },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: LOG_LEVELS.ERROR,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}] ${message}`;
        })
      ),
    })
  );
}

export const loggerMiddleware = (req: any, res: any, next: any) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  res.on('finish', () => {
    logger.info('Response sent', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      responseTime: Date.now() - req._startTime,
    });
  });

  req._startTime = Date.now();
  next();
};
