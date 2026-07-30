import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RecordStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { CreateOptionItemDto } from './dto/create-option-item.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const slugify = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async publicMenu(storeSlug: string, search?: string) {
    const store = await this.prisma.store.findFirst({ where: { slug: storeSlug, status: RecordStatus.ACTIVE } });
    if (!store) throw new NotFoundException('Loja não encontrada.');
    const categories = await this.prisma.category.findMany({
      where: { storeId: store.id, status: RecordStatus.ACTIVE },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        products: {
          where: {
            status: RecordStatus.ACTIVE,
            ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {})
          },
          orderBy: [{ featured: 'desc' }, { name: 'asc' }],
          include: { optionGroups: { orderBy: { displayOrder: 'asc' }, include: { items: { where: { status: RecordStatus.ACTIVE }, orderBy: { displayOrder: 'asc' } } } } }
        }
      }
    });
    return { store, categories: categories.filter((category) => category.products.length > 0 || !search) };
  }

  listCategories(storeId: string) { return this.prisma.category.findMany({ where: { storeId }, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] }); }

  async createCategory(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    try { return await this.prisma.category.create({ data: { ...dto, slug } }); }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Categoria já cadastrada.'); throw error; }
  }

  updateCategory(id: string, dto: UpdateCategoryDto) { return this.prisma.category.update({ where: { id }, data: { ...dto, ...(dto.name ? { slug: slugify(dto.name) } : {}) } }); }
  deactivateCategory(id: string) { return this.prisma.category.update({ where: { id }, data: { status: RecordStatus.INACTIVE } }); }

  listProducts(storeId: string) { return this.prisma.product.findMany({ where: { storeId }, orderBy: { name: 'asc' }, include: { category: true, optionGroups: { include: { items: true } } } }); }

  async createProduct(dto: CreateProductDto) {
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, storeId: dto.storeId } });
    if (!category) throw new NotFoundException('Categoria inválida para esta loja.');
    const { price, promotionalPrice, ...rest } = dto;
    return this.prisma.product.create({ data: { ...rest, slug: slugify(dto.name), price: new Prisma.Decimal(price), promotionalPrice: promotionalPrice == null ? undefined : new Prisma.Decimal(promotionalPrice) } });
  }

  updateProduct(id: string, dto: UpdateProductDto) {
    const { price, promotionalPrice, ...rest } = dto;
    return this.prisma.product.update({ where: { id }, data: { ...rest, ...(dto.name ? { slug: slugify(dto.name) } : {}), ...(price == null ? {} : { price: new Prisma.Decimal(price) }), ...(promotionalPrice === undefined ? {} : { promotionalPrice: promotionalPrice === null ? null : new Prisma.Decimal(promotionalPrice) }) } });
  }

  deactivateProduct(id: string) { return this.prisma.product.update({ where: { id }, data: { status: RecordStatus.INACTIVE } }); }
  createOptionGroup(productId: string, dto: CreateOptionGroupDto) { return this.prisma.productOptionGroup.create({ data: { productId, ...dto } }); }
  createOptionItem(groupId: string, dto: CreateOptionItemDto) { return this.prisma.productOptionItem.create({ data: { groupId, name: dto.name, displayOrder: dto.displayOrder, additionalPrice: new Prisma.Decimal(dto.additionalPrice ?? 0) } }); }
}
