'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  API_URL,
  money,
} from '../../../lib/api';

type OrderItem = {
  quantity: number;
};

type Customer = {
  name: string;
  phone: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  serviceType: string;
  total: string;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
};

type ApiResponse = {
  message?: string | string[];
};

const TOKEN_STORAGE_KEY = 'menu-commerce-token';

const labels: Record<string, string> = {
  RECEIVED: 'Recebido',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Em preparação',
  READY: 'Pronto',
  OUT_FOR_DELIVERY: 'Saiu para entrega',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

function nextStatuses(order: Order): string[] {
  const transitions: Record<string, string[]> = {
    RECEIVED: [
      'CONFIRMED',
      'CANCELLED',
    ],

    CONFIRMED: [
      'PREPARING',
      'CANCELLED',
    ],

    PREPARING: [
      'READY',
      'CANCELLED',
    ],

    READY:
      order.serviceType === 'DELIVERY'
        ? [
            'OUT_FOR_DELIVERY',
            'CANCELLED',
          ]
        : [
            'DELIVERED',
            'CANCELLED',
          ],

    OUT_FOR_DELIVERY: [
      'DELIVERED',
      'CANCELLED',
    ],

    DELIVERED: [],
    CANCELLED: [],
  };

  return transitions[order.status] ?? [];
}

function formatApiMessage(
  data: ApiResponse,
  fallback: string,
): string {
  if (Array.isArray(data.message)) {
    return data.message.join(', ');
  }

  return data.message ?? fallback;
}

async function readJsonSafely<T>(
  response: Response,
): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);

    setToken('');
    setOrders([]);
    setLoading(false);
    setUpdatingOrderId(null);

    setMessage(
      'Sua sessão expirou. Entre novamente no painel administrativo.',
    );

    window.setTimeout(() => {
      window.location.replace('/admin');
    }, 1200);
  }, []);

  const load = useCallback(
    async (currentToken: string) => {
      if (!currentToken) {
        setLoading(false);
        setOrders([]);

        setMessage(
          'Entre no painel administrativo antes de acessar os pedidos.',
        );

        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/admin/orders`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${currentToken}`,
            },
            cache: 'no-store',
          },
        );

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const data = await readJsonSafely<
          Order[] | ApiResponse
        >(response);

        if (!response.ok) {
          throw new Error(
            formatApiMessage(
              data as ApiResponse,
              'Falha ao carregar os pedidos.',
            ),
          );
        }

        setOrders(data as Order[]);
        setMessage('');
      } catch (requestError) {
        const errorMessage =
          requestError instanceof Error
            ? requestError.message
            : 'Não foi possível carregar os pedidos.';

        setOrders([]);
        setMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [handleUnauthorized],
  );

  useEffect(() => {
    const savedToken =
      localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';

    setToken(savedToken);

    if (!savedToken) {
      setLoading(false);

      setMessage(
        'Entre no painel administrativo antes de acessar os pedidos.',
      );

      return;
    }

    void load(savedToken);
  }, [load]);

  async function update(
    id: string,
    status: string,
  ): Promise<void> {
    if (!token) {
      handleUnauthorized();
      return;
    }

    setUpdatingOrderId(id);
    setMessage('Atualizando status...');

    try {
      const response = await fetch(
        `${API_URL}/admin/orders/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        },
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const data =
        await readJsonSafely<ApiResponse>(response);

      if (!response.ok) {
        throw new Error(
          formatApiMessage(
            data,
            'Não foi possível atualizar o status.',
          ),
        );
      }

      await load(token);
      setMessage('Status atualizado com sucesso.');
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível atualizar o status.';

      setMessage(errorMessage);
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setOrders([]);

    window.location.replace('/admin');
  }

  return (
    <main className="admin-shell">
      <div className="admin-top">
        <div>
          <span className="version">v0.6.0</span>
          <h1>Operação de pedidos</h1>
        </div>

        <div className="header-actions">
          <a href="/admin">Catálogo</a>
          <a href="/admin/promocoes">Promoções</a>
          <a href="/admin/whatsapp">WhatsApp</a>
          <a href="/">Cardápio</a>

          {token && (
            <button
              type="button"
              onClick={logout}
            >
              Sair
            </button>
          )}
        </div>
      </div>

      {message && (
        <p
          className="message"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      {loading ? (
        <section className="card">
          <p>Carregando pedidos...</p>
        </section>
      ) : (
        <section className="orders-board">
          {orders.length === 0 && token ? (
            <article className="card">
              <h3>Nenhum pedido encontrado</h3>
              <p>
                Os novos pedidos aparecerão nesta área.
              </p>
            </article>
          ) : null}

          {orders.map((order) => {
            const targets = nextStatuses(order);

            const itemCount = order.items.reduce(
              (sum, item) =>
                sum + item.quantity,
              0,
            );

            const isUpdating =
              updatingOrderId === order.id;

            return (
              <article
                className="card order-card"
                key={order.id}
              >
                <div className="toolbar">
                  <div>
                    <strong>
                      #{order.orderNumber}
                    </strong>

                    <small>
                      {new Date(
                        order.createdAt,
                      ).toLocaleString('pt-BR')}
                    </small>
                  </div>

                  <strong>
                    {money(order.total)}
                  </strong>
                </div>

                <h3>{order.customer.name}</h3>

                <p>
                  {order.customer.phone}
                  {' · '}
                  {order.serviceType ===
                  'DELIVERY'
                    ? 'Entrega'
                    : 'Retirada'}
                  {' · '}
                  {itemCount}{' '}
                  {itemCount === 1
                    ? 'item'
                    : 'itens'}
                </p>

                <p>
                  Status atual:{' '}
                  <strong>
                    {labels[order.status] ??
                      order.status}
                  </strong>
                </p>

                {targets.length > 0 ? (
                  <label>
                    Próximo status

                    <select
                      value=""
                      disabled={isUpdating}
                      onChange={(event) => {
                        const selectedStatus =
                          event.target.value;

                        if (selectedStatus) {
                          void update(
                            order.id,
                            selectedStatus,
                          );
                        }
                      }}
                    >
                      <option
                        value=""
                        disabled
                      >
                        {isUpdating
                          ? 'Atualizando...'
                          : 'Selecione'}
                      </option>

                      {targets.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {labels[status] ??
                              status}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                ) : (
                  <small>Fluxo encerrado.</small>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
