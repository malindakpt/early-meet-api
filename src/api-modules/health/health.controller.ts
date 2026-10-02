import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): Promise<{ database: 'connected'; status: 'ok' }> {
    return this.healthService.getHealth();
  }

  // Liveness probe for container and load-balancer health checks. It deliberately avoids the
  // database so a transient PostgreSQL outage does not cause healthy API tasks to be replaced.
  @Get('live')
  getLiveness(): { status: 'ok' } {
    return this.healthService.getLiveness();
  }
}
