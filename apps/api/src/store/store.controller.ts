import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreService } from './store.service';
@ApiTags('admin/stores') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('admin/stores')
export class StoreController {
  constructor(private readonly service: StoreService) {}
  @Get() list() { return this.service.list(); }
  @Post() create(@Body() dto: CreateStoreDto) { return this.service.create(dto); }
}
