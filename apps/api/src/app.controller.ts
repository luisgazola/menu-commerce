import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiInfo() {
    return {
      name: 'MenuCommerce API',
      version: '0.3.0',
      status: 'online',
      documentation: '/api/docs',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        stores: '/api/v1/stores',
        catalog: '/api/v1/catalog',
        cart: '/api/v1/cart',
      },
    };
  }
}
