'use client';

import { useEffect, useState } from 'react';
import { API_URL, money } from '../../../lib/api';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  serviceType: string;
  total: string;
  createdAt: string;
  customer: { name: string; phone: string };
  items: { quantity: number }[];
};

const labels: Record<string, string> = {
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparação',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado'
};

function nextStatuses(order: Order): string[] {
  const transitions: Record<string, string[]> = {
    RECEIVED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: order.serviceType === 'DELIVERY'
      ? ['OUT_FOR_DELIVERY', 'CANCELLED']
      : ['DELIVERED', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: []
  };
  return transitions[order.status] ?? [];
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  async function load(currentToken = token) {
    const response = await fetch(`${API_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? 'Falha ao carregar.');
    setOrders(data);
  }

  useEffect(() => {
    const saved = localStorage.getItem('menu-commerce-token') ?? '';
    setToken(saved);
    if (saved) {
      load(saved).catch((requestError) => setMessage(requestError.message));
    } else {
      setMessage('Entre no painel administrativo antes de acessar os pedidos.');
    }
  }, []);

  async function update(id: string, status: string) {
    const response = await fetch(`${API_URL}/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(
        Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Erro.'
      );
      return;
    }
    await load();
    setMessage('Status atualizado.');
  }

  return <main className="admin-shell">
    <div className="admin-top">
      <div><span className="version">v0.5.0</span><h1>Operação de pedidos</h1></div>
      <div className="header-actions">
        <a href="/admin">Catálogo</a>
        <a href="/admin/promocoes">Promoções</a>
        <a href="/">Cardápio</a>
      </div>
    </div>
    <p className="message">{message}</p>
    <section className="orders-board">
      {orders.map((order) => {
        const targets = nextStatuses(order);
        return <article className="card order-card" key={order.id}>
          <div className="toolbar">
            <div>
              <strong>#{order.orderNumber}</strong>
              <small>{new Date(order.createdAt).toLocaleString('pt-BR')}</small>
            </div>
            <strong>{money(order.total)}</strong>
          </div>
          <h3>{order.customer.name}</h3>
          <p>
            {order.customer.phone} · {order.serviceType === 'DELIVERY' ? 'Entrega' : 'Retirada'} ·{' '}
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} itens
          </p>
          <p>Status atual: <strong>{labels[order.status] ?? order.status}</strong></p>
          {targets.length > 0
            ? <label>Próximo status
                <select defaultValue="" onChange={(event) => {
                  if (event.target.value) update(order.id, event.target.value);
                  event.target.value = '';
                }}>
                  <option value="" disabled>Selecione</option>
                  {targets.map((status) => <option key={status} value={status}>
                    {labels[status]}
                  </option>)}
                </select>
              </label>
            : <small>Fluxo encerrado.</small>}
        </article>;
      })}
    </section>
  </main>;
}
