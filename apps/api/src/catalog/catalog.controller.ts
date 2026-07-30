import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { CreateOptionItemDto } from './dto/create-option-item.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get(':storeSlug')
  menu(@Param('storeSlug') storeSlug: string, @Query('search') search?: string) { return this.service.publicMenu(storeSlug, search); }
}

@ApiTags('admin/catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminCatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get('stores/:storeId/categories') listCategories(@Param('storeId') storeId: string) { return this.service.listCategories(storeId); }
  @Post('categories') createCategory(@Body() dto: CreateCategoryDto) { return this.service.createCategory(dto); }
  @Patch('categories/:id') updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.service.updateCategory(id, dto); }
  @Delete('categories/:id') deleteCategory(@Param('id') id: string) { return this.service.deactivateCategory(id); }

  @Get('stores/:storeId/products') listProducts(@Param('storeId') storeId: string) { return this.service.listProducts(storeId); }
  @Post('products') createProduct(@Body() dto: CreateProductDto) { return this.service.createProduct(dto); }
  @Patch('products/:id') updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.service.updateProduct(id, dto); }
  @Delete('products/:id') deleteProduct(@Param('id') id: string) { return this.service.deactivateProduct(id); }

  @Post('products/:productId/options') createGroup(@Param('productId') productId: string, @Body() dto: CreateOptionGroupDto) { return this.service.createOptionGroup(productId, dto); }
  @Post('option-groups/:groupId/items') createItem(@Param('groupId') groupId: string, @Body() dto: CreateOptionItemDto) { return this.service.createOptionItem(groupId, dto); }
}
