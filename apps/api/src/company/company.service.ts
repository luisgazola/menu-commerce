import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Company } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    if (dto.documentNumber) {
      const existing = await this.prisma.company.findUnique({ where: { documentNumber: dto.documentNumber } });
      if (existing) throw new ConflictException('Documento empresarial já cadastrado.');
    }

    return this.prisma.company.create({ data: dto });
  }

  async findFirst(): Promise<Company> {
    const company = await this.prisma.company.findFirst();
    if (!company) throw new NotFoundException('Empresa ainda não cadastrada.');
    return company;
  }
}
