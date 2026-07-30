import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}
  create(dto: CreateStoreDto) { return this.prisma.store.create({ data: dto }); }
  list() { return this.prisma.store.findMany({ orderBy: { name: 'asc' } }); }
}
