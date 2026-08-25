import { Injectable, Logger } from '@nestjs/common';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EnvService } from '../../config/env.service';

@Injectable()
export class ErrorLoggerService {
  private readonly logger = new Logger('GlobalError');

  constructor(private readonly env: EnvService) {}

  log(exception: unknown, context: Record<string, unknown>): void {
    const error = exception instanceof Error ? exception : undefined;
    const record = {
      timestamp: new Date().toISOString(),
      level: 'error',
      ...context,
      message: error?.message ?? String(exception),
      stack: error?.stack,
    };

    const logContext =
      typeof context.context === 'string' ? context.context : 'HTTP';
    this.logger.error(record.message, record.stack, logContext);
    void this.writeToFile(record);
  }

  private async writeToFile(record: Record<string, unknown>): Promise<void> {
    try {
      await mkdir(dirname(this.env.errorLogPath), { recursive: true });
      await appendFile(
        this.env.errorLogPath,
        `${JSON.stringify(record)}\n`,
        'utf8',
      );
    } catch (error) {
      this.logger.error(
        `Unable to write error log: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
