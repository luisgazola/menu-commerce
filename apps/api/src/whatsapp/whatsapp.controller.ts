import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { BuildOrderWhatsappDto } from './dto/build-order-whatsapp.dto';
import { UpdateWhatsappConfigDto } from './dto/update-whatsapp-config.dto';
import { WhatsappService } from './whatsapp.service';

@ApiTags('whatsapp')
@Controller()
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  @Post('whatsapp/orders/message')
  buildMessage(@Body() dto: BuildOrderWhatsappDto) {
    return this.service.buildOrderMessage(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/stores/:storeId/whatsapp')
  getConfig(
    @Req() request: Request & { user: JwtPayload },
    @Param('storeId') storeId: string
  ) {
    return this.service.getConfig(request.user, storeId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('admin/stores/:storeId/whatsapp')
  updateConfig(
    @Req() request: Request & { user: JwtPayload },
    @Param('storeId') storeId: string,
    @Body() dto: UpdateWhatsappConfigDto
  ) {
    return this.service.updateConfig(request.user, storeId, dto);
  }
}
