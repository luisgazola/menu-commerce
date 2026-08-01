import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: string; version: string } {
    return { status: 'ok', version: '0.5.0' };
  }
}
