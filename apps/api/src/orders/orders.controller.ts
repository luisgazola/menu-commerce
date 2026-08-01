import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { TrackOrderDto } from './dto/track-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Post('track')
  track(@Body() dto: TrackOrderDto) {
    return this.service.track(dto);
  }
}

@ApiTags('admin/orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  list(
    @Req() request: Request & { user: JwtPayload },
    @Query('storeId') storeId?: string
  ) {
    return this.service.list(request.user, storeId);
  }

  @Patch(':id/status')
  update(
    @Req() request: Request & { user: JwtPayload },
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.service.updateStatus(request.user, id, dto);
  }
}
