'use client';

import { FormEvent, useEffect, useState } from 'react';
import { API_URL, money } from '../../../lib/api';

type Order = {
  orderNumber: string;
  status: string;
  total: string;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  couponCode?: string | null;
  serviceType: string;
  createdAt: string;
  items: {
    id: string;
    productNameSnapshot: string;
    quantity: number;
    totalPrice: string;
  }[];
  statusLog: {
    id: string;
    status: string;
    note?: string;
    createdAt: string;
  }[];
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

export default function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ orderNumber: value }) => {
      setOrderNumber(value);
      setPhone(localStorage.getItem(`menucommerce.order.phone.${value}`) ?? '');
    });
  }, [params]);

  async function track(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const response = await fetch(`${API_URL}/orders/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message ?? 'Pedido não encontrado.'
        );
      }
      localStorage.setItem(`menucommerce.order.phone.${orderNumber}`, phone);
      setOrder(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Pedido não encontrado.'
      );
    } finally {
      setLoading(false);
    }
  }

  return <main className="admin-shell">
    <a href="/">← Cardápio</a>
    <section className="card">
      <span className="version">Acompanhamento seguro · v0.5.0</span>
      <h1>Pedido #{orderNumber || '...'}</h1>
      {!order && <form onSubmit={track} className="tracking-form">
        <p>Informe o mesmo WhatsApp utilizado no checkout para consultar o pedido.</p>
        <label>WhatsApp
          <input
            required
            minLength={8}
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(12) 99999-9999"
          />
        </label>
        <button disabled={loading}>{loading ? 'Consultando...' : 'Acompanhar pedido'}</button>
      </form>}
      {error && <p className="error">{error}</p>}
      {order && <>
        <p>Status atual: <strong>{labels[order.status] ?? order.status}</strong></p>
        <p>Atendimento: {order.serviceType === 'DELIVERY' ? 'Entrega' : 'Retirada'}</p>
        <p>Criado em: {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
        <div className="list">
          {order.items.map((item) => <span key={item.id}>
            {item.quantity}× {item.productNameSnapshot} — {money(item.totalPrice)}
          </span>)}
        </div>
        <div className="order-totals">
          <span>Subtotal <strong>{money(order.subtotal)}</strong></span>
          <span>Entrega <strong>{money(order.deliveryFee)}</strong></span>
          {Number(order.discount) > 0 && <span>
            Desconto {order.couponCode ? `(${order.couponCode})` : ''}
            <strong>- {money(order.discount)}</strong>
          </span>}
          <span>Total <strong>{money(order.total)}</strong></span>
        </div>
        <h3>Histórico</h3>
        <div className="timeline">
          {order.statusLog.map((log) => <div key={log.id}>
            <strong>{labels[log.status] ?? log.status}</strong>
            <small>
              {new Date(log.createdAt).toLocaleString('pt-BR')}
              {log.note ? ` · ${log.note}` : ''}
            </small>
          </div>)}
        </div>
        <button className="secondary" onClick={() => setOrder(null)}>
          Consultar novamente
        </button>
      </>}
    </section>
  </main>;
}
