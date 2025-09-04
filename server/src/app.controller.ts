import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import client from './metrics';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello() {
    return this.appService.getHello();
  }

  @Get('/metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics() {
    return client.register.metrics();
  }
}
