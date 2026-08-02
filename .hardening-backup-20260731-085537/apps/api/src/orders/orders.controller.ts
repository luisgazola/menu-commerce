import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}
  @Post() create(@Body() dto: CreateOrderDto) { return this.service.create(dto); }
  @Get(':orderNumber') find(@Param('orderNumber') orderNumber: string) { return this.service.findPublic(orderNumber); }
}

@ApiTags('admin/orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly service: OrdersService) {}
  @Get() list(@Query('storeId') storeId?: string) { return this.service.list(storeId); }
  @Patch(':id/status') update(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) { return this.service.updateStatus(id, dto); }
}
