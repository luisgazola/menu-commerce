import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { PrismaService } from '../database/prisma.service';
import { BuildOrderWhatsappDto } from './dto/build-order-whatsapp.dto';
import { UpdateWhatsappConfigDto } from './dto/update-whatsapp-config.dto';

const digitsOnly = (value: string) => value.replace(/\D/g, '');

@Injectable()
export class WhatsappService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(user: JwtPayload, storeId: string) {
    const companyId = this.requireCompany(user);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
      select: {
        id: true,
        name: true,
        whatsapp: true,
        whatsappEnabled: true,
        whatsappMessageTemplate: true
      }
    });
    if (!store) throw new NotFoundException('Loja não encontrada.');
    return store;
  }

  async updateConfig(
    user: JwtPayload,
    storeId: string,
    dto: UpdateWhatsappConfigDto
  ) {
    const companyId = this.requireCompany(user);
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, companyId },
      select: { id: true }
    });
    if (!store) throw new NotFoundException('Loja não encontrada.');

    const whatsapp = dto.whatsapp === undefined
      ? undefined
      : digitsOnly(dto.whatsapp);
    if (whatsapp !== undefined && whatsapp !== '' && !/^\d{10,15}$/.test(whatsapp)) {
      throw new BadRequestException(
        'Informe o WhatsApp com DDI e DDD, usando de 10 a 15 dígitos.'
      );
    }

    return this.prisma.store.update({
      where: { id: store.id },
      data: {
        ...dto,
        ...(whatsapp !== undefined ? { whatsapp } : {})
      },
      select: {
        id: true,
        name: true,
        whatsapp: true,
        whatsappEnabled: true,
        whatsappMessageTemplate: true
      }
    });
  }

  async buildOrderMessage(dto: BuildOrderWhatsappDto) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: dto.orderNumber.trim() },
      include: {
        store: true,
        customer: true,
        address: true,
        items: true
      }
    });

    if (!order || digitsOnly(order.customer.phone) !== digitsOnly(dto.phone)) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    if (!order.store.whatsappEnabled || !order.store.whatsapp) {
      throw new BadRequestException('WhatsApp não configurado para esta loja.');
    }

    const products = order.items.map((item) => {
      const options = Array.isArray(item.options)
        ? item.options as Array<{ name?: string }>
        : [];
      const optionText = options.length
        ? `\n  Adicionais: ${options.map((option) => option.name).filter(Boolean).join(', ')}`
        : '';
      const notes = item.notes ? `\n  Observação: ${item.notes}` : '';
      return `${item.quantity}x ${item.productNameSnapshot} — R$ ${Number(item.totalPrice)
        .toFixed(2)
        .replace('.', ',')}${optionText}${notes}`;
    }).join('\n');

    const address = order.address
      ? `${order.address.street}, ${order.address.number} - ${order.address.district}, ${order.address.city}/${order.address.state}`
      : 'Retirada no estabelecimento';
    const defaultTemplate =
      'Olá! Segue o pedido {{orderNumber}}.\n\n' +
      'Cliente: {{customerName}}\n' +
      'Atendimento: {{serviceType}}\n' +
      '{{items}}\n\n' +
      'Subtotal: {{subtotal}}\n' +
      'Entrega: {{deliveryFee}}\n' +
      'Desconto: {{discount}}\n' +
      'Total: {{total}}\n' +
      'Endereço: {{address}}\n' +
      'Observações: {{notes}}';
    const template = order.store.whatsappMessageTemplate || defaultTemplate;
    const replacements: Record<string, string> = {
      '{{orderNumber}}': order.orderNumber,
      '{{customerName}}': order.customer.name,
      '{{serviceType}}': order.serviceType === 'DELIVERY' ? 'Entrega' : 'Retirada',
      '{{items}}': products,
      '{{subtotal}}': `R$ ${Number(order.subtotal).toFixed(2).replace('.', ',')}`,
      '{{deliveryFee}}': `R$ ${Number(order.deliveryFee).toFixed(2).replace('.', ',')}`,
      '{{discount}}': `R$ ${Number(order.discount).toFixed(2).replace('.', ',')}`,
      '{{total}}': `R$ ${Number(order.total).toFixed(2).replace('.', ',')}`,
      '{{address}}': address,
      '{{notes}}': order.notes || 'Nenhuma'
    };

    let message = template;
    for (const [key, value] of Object.entries(replacements)) {
      message = message.split(key).join(value);
    }

    const phone = digitsOnly(order.store.whatsapp);
    if (!/^\d{10,15}$/.test(phone)) {
      throw new BadRequestException('Número de WhatsApp inválido.');
    }

    return {
      orderNumber: order.orderNumber,
      phone,
      message,
      url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    };
  }

  private requireCompany(user: JwtPayload): string {
    if (!user.companyId) {
      throw new ForbiddenException('Usuário sem empresa vinculada.');
    }
    return user.companyId;
  }
}
