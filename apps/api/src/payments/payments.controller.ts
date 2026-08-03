import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import {
  Request,
} from 'express';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

import {
  JwtPayload,
} from '../auth/jwt-payload.interface';

import {
  RefundPaymentDto,
} from './dto/refund-payment.dto';

import {
  TrackPaymentDto,
} from './dto/track-payment.dto';

import {
  UpdatePaymentConfigDto,
} from './dto/update-payment-config.dto';

import {
  PaymentsService,
} from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('methods/:storeSlug')
  publicMethods(
    @Param('storeSlug') storeSlug: string,
  ) {
    return this.paymentsService.publicMethods(
      storeSlug,
    );
  }

  @Post('orders/track')
  trackOrder(
    @Body() dto: TrackPaymentDto,
  ) {
    return this.paymentsService.trackOrder(dto);
  }
}

@ApiTags('admin/payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('stores/:storeId/payments')
  getConfig(
    @Req()
    request: Request & {
      user: JwtPayload;
    },

    @Param('storeId')
    storeId: string,
  ) {
    return this.paymentsService.getConfig(
      request.user,
      storeId,
    );
  }

  @Patch('stores/:storeId/payments')
  updateConfig(
    @Req()
    request: Request & {
      user: JwtPayload;
    },

    @Param('storeId')
    storeId: string,

    @Body()
    dto: UpdatePaymentConfigDto,
  ) {
    return this.paymentsService.updateConfig(
      request.user,
      storeId,
      dto,
    );
  }

  @Post('payments/:id/mock-approve')
  mockApprove(
    @Req()
    request: Request & {
      user: JwtPayload;
    },

    @Param('id')
    id: string,
  ) {
    return this.paymentsService.mockApprove(
      request.user,
      id,
    );
  }

  @Post('payments/:id/refund')
  refund(
    @Req()
    request: Request & {
      user: JwtPayload;
    },

    @Param('id')
    id: string,

    @Body()
    dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refund(
      request.user,
      id,
      dto,
    );
  }
}
