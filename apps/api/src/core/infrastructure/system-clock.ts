import { Injectable } from '@nestjs/common';
import type { Clock } from '../domain/clock';

@Injectable()
export class SystemClock implements Clock {
  ahora(): Date {
    return new Date();
  }
}
