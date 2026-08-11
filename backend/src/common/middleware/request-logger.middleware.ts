import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const debut = Date.now();

    res.on('finish', () => {
      const duree = Date.now() - debut;
      this.logger.log(
        `${method} ${originalUrl} ${res.statusCode} - ${duree}ms`,
      );
    });

    next();
  }
}
