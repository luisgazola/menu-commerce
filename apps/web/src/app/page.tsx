'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_URL, STORE_SLUG, money } from '../lib/api';
import {
  CART_STORAGE_KEY,
  CartItem,
  CartOption,
  cartQuantity,
  cartSubtotal,
  createCartKey,
  itemTotal,
  itemUnitTotal
} from '../lib/cart';

type OptionItem = { id: string; name: string; additionalPrice: string };
type OptionGroup = {
  id: string;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  required: boolean;
  minimumSelection: number;
  maximumSelection: number;
  items: OptionItem[];
};
type Product = {
  id: string;
  name: string;
  description?: string;
  price: string;
  promotionalPrice?: string | null;
  imageUrl?: string;
  preparationTime?: number;
  featured: boolean;
  optionGroups: OptionGroup[];
};
type Category = { id: string; name: string; products: Product[] };
type MenuResponse = {
  store: { name: string; description?: string; bannerUrl?: string; whatsapp?: string; isOpen: boolean };
  categories: Category[];
};

type ProductSelection = {
  product: Product;
  selected: Record<string, string[]>;
  notes: string;
  quantity: number;
};

function baseProductPrice(product: Product): number {
  return Number(product.promotionalPrice ?? product.price);
}

export default function HomePage() {
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selection, setSelection] = useState<ProductSelection | null>(null);
  const [selectionError, setSelectionError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) setCart(JSON.parse(saved) as CartItem[]);
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setError('');
      fetch(`${API_URL}/catalog/${STORE_SLUG}?search=${encodeURIComponent(search)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error('Não foi possível carregar o cardápio.');
          return response.json();
        })
        .then(setMenu)
        .catch((requestError: Error) => {
          if (requestError.name !== 'AbortError') setError(requestError.message);
        });
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [search]);

  const productCount = useMemo(
    () => menu?.categories.reduce((sum, category) => sum + category.products.length, 0) ?? 0,
    [menu]
  );
  const totalQuantity = useMemo(() => cartQuantity(cart), [cart]);
  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);

  function openProduct(product: Product) {
    const selected: Record<string, string[]> = {};
    for (const group of product.optionGroups) selected[group.id] = [];
    setSelection({ product, selected, notes: '', quantity: 1 });
    setSelectionError('');
  }

  function toggleOption(group: OptionGroup, itemId: string) {
    if (!selection) return;
    const current = selection.selected[group.id] ?? [];
    let next: string[];
    if (group.type === 'SINGLE') {
      next = current.includes(itemId) && !group.required ? [] : [itemId];
    } else if (current.includes(itemId)) {
      next = current.filter((id) => id !== itemId);
    } else if (current.length < group.maximumSelection) {
      next = [...current, itemId];
    } else {
      setSelectionError(`Escolha no máximo ${group.maximumSelection} item(ns) em ${group.name}.`);
      return;
    }
    setSelectionError('');
    setSelection({ ...selection, selected: { ...selection.selected, [group.id]: next } });
  }

  function selectedOptions(current: ProductSelection): CartOption[] {
    return current.product.optionGroups.flatMap((group) =>
      (current.selected[group.id] ?? []).flatMap((itemId) => {
        const item = group.items.find((candidate) => candidate.id === itemId);
        return item
          ? [{
              groupId: group.id,
              groupName: group.name,
              itemId: item.id,
              itemName: item.name,
              additionalPrice: Number(item.additionalPrice)
            }]
          : [];
      })
    );
  }

  function addSelectionToCart() {
    if (!selection) return;
    for (const group of selection.product.optionGroups) {
      const selectedCount = selection.selected[group.id]?.length ?? 0;
      const minimum = group.required ? Math.max(1, group.minimumSelection) : group.minimumSelection;
      if (selectedCount < minimum) {
        setSelectionError(`Selecione pelo menos ${minimum} item(ns) em ${group.name}.`);
        return;
      }
    }

    const options = selectedOptions(selection);
    const key = createCartKey(selection.product.id, options, selection.notes);
    const newItem: CartItem = {
      key,
      productId: selection.product.id,
      productName: selection.product.name,
      imageUrl: selection.product.imageUrl,
      unitPrice: baseProductPrice(selection.product),
      quantity: selection.quantity,
      notes: selection.notes.trim(),
      options
    };

    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      return existing
        ? current.map((item) => item.key === key ? { ...item, quantity: item.quantity + selection.quantity } : item)
        : [...current, newItem];
    });
    setSelection(null);
    setCartOpen(true);
  }

  function changeQuantity(key: string, delta: number) {
    setCart((current) => current
      .map((item) => item.key === key ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
      .filter((item) => item.quantity > 0));
  }

  function removeItem(key: string) {
    setCart((current) => current.filter((item) => item.key !== key));
  }

  const selectionPreview = selection
    ? itemUnitTotal({ unitPrice: baseProductPrice(selection.product), options: selectedOptions(selection) }) * selection.quantity
    : 0;

  return <main className="menu-shell">
    <header className="menu-header">
      <div>
        <span className="version">v0.3.0</span>
        <h1>{menu?.store.name ?? 'MenuCommerce'}</h1>
        <p>{menu?.store.description ?? 'Cardápio online responsivo'}</p>
      </div>
      <div className="header-actions">
        <a className="admin-link" href="/admin">Administrador</a>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Abrir carrinho">
          Carrinho <span>{totalQuantity}</span>
        </button>
      </div>
    </header>

    <section className="banner" style={menu?.store.bannerUrl ? {
      backgroundImage: `linear-gradient(90deg, rgba(14,12,18,.92), rgba(14,12,18,.3)), url(${menu.store.bannerUrl})`
    } : undefined}>
      <div>
        <span className={menu?.store.isOpen ? 'status open' : 'status'}>{menu?.store.isOpen ? 'Aberto agora' : 'Fechado'}</span>
        <h2>Escolha seu pedido</h2>
        <p>{productCount} produtos disponíveis</p>
      </div>
    </section>

    <label className="search">
      <span>Pesquisar</span>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hambúrguer, bebida, sobremesa..." />
    </label>

    {error && <p className="error">{error}</p>}
    {!menu && !error && <p>Carregando cardápio...</p>}
    {menu?.categories.map((category) => <section className="category" key={category.id}>
      <h2>{category.name}</h2>
      <div className="products">
        {category.products.map((product) => <article className="product" key={product.id}>
          <div className="product-image" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>
            {product.featured && <span>Destaque</span>}
          </div>
          <div className="product-content">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            {product.preparationTime && <small>Preparo aproximado: {product.preparationTime} min</small>}
            {product.optionGroups.length > 0 && <small className="customizable">Personalizável com adicionais</small>}
            <div className="price-row">
              <div>{product.promotionalPrice
                ? <><del>{money(product.price)}</del><strong>{money(product.promotionalPrice)}</strong></>
                : <strong>{money(product.price)}</strong>}</div>
              <button onClick={() => openProduct(product)}>Adicionar</button>
            </div>
          </div>
        </article>)}
      </div>
    </section>)}

    {selection && <div className="overlay" role="presentation" onMouseDown={() => setSelection(null)}>
      <section className="modal product-modal" role="dialog" aria-modal="true" aria-label={`Personalizar ${selection.product.name}`} onMouseDown={(event) => event.stopPropagation()}>
        <button className="close" onClick={() => setSelection(null)} aria-label="Fechar">×</button>
        <h2>{selection.product.name}</h2>
        <p>{selection.product.description}</p>
        {selection.product.optionGroups.map((group) => <fieldset key={group.id}>
          <legend>{group.name}</legend>
          <small>{group.required ? 'Obrigatório' : 'Opcional'} · escolha até {group.maximumSelection}</small>
          {group.items.map((item) => {
            const checked = selection.selected[group.id]?.includes(item.id) ?? false;
            return <label className="option" key={item.id}>
              <input
                type={group.type === 'SINGLE' ? 'radio' : 'checkbox'}
                name={group.id}
                checked={checked}
                onChange={() => toggleOption(group, item.id)}
              />
              <span>{item.name}</span>
              <strong>{Number(item.additionalPrice) > 0 ? `+ ${money(item.additionalPrice)}` : 'Incluso'}</strong>
            </label>;
          })}
        </fieldset>)}
        <label>
          Observações
          <textarea maxLength={240} value={selection.notes} onChange={(event) => setSelection({ ...selection, notes: event.target.value })} placeholder="Ex.: sem cebola, molho separado..." />
          <small>{selection.notes.length}/240</small>
        </label>
        {selectionError && <p className="error">{selectionError}</p>}
        <div className="modal-footer">
          <div className="stepper">
            <button onClick={() => setSelection({ ...selection, quantity: Math.max(1, selection.quantity - 1) })}>−</button>
            <strong>{selection.quantity}</strong>
            <button onClick={() => setSelection({ ...selection, quantity: selection.quantity + 1 })}>+</button>
          </div>
          <button className="primary-wide" onClick={addSelectionToCart}>Adicionar · {money(selectionPreview)}</button>
        </div>
      </section>
    </div>}

    {cartOpen && <div className="overlay cart-overlay" role="presentation" onMouseDown={() => setCartOpen(false)}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrinho de compras" onMouseDown={(event) => event.stopPropagation()}>
        <div className="cart-title">
          <div><span className="version">Carrinho</span><h2>Seu pedido</h2></div>
          <button className="close" onClick={() => setCartOpen(false)} aria-label="Fechar">×</button>
        </div>
        {cart.length === 0 ? <div className="empty-cart"><p>Seu carrinho está vazio.</p><button onClick={() => setCartOpen(false)}>Voltar ao cardápio</button></div> : <>
          <div className="cart-list">
            {cart.map((item) => <article className="cart-item" key={item.key}>
              <div className="cart-item-main">
                <h3>{item.productName}</h3>
                <strong>{money(itemTotal(item))}</strong>
              </div>
              {item.options.length > 0 && <ul>{item.options.map((option) => <li key={option.itemId}>{option.groupName}: {option.itemName}{option.additionalPrice > 0 ? ` (+ ${money(option.additionalPrice)})` : ''}</li>)}</ul>}
              {item.notes && <p className="notes">Observação: {item.notes}</p>}
              <small>Valor unitário configurado: {money(itemUnitTotal(item))}</small>
              <div className="cart-item-actions">
                <div className="stepper small">
                  <button onClick={() => changeQuantity(item.key, -1)}>−</button>
                  <strong>{item.quantity}</strong>
                  <button onClick={() => changeQuantity(item.key, 1)}>+</button>
                </div>
                <button className="link-danger" onClick={() => removeItem(item.key)}>Remover</button>
              </div>
            </article>)}
          </div>
          <footer className="cart-footer">
            <div><span>Itens</span><strong>{totalQuantity}</strong></div>
            <div className="subtotal"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <button disabled title="Checkout será implementado na v0.4.0">Continuar para identificação</button>
            <small>O carrinho permanece salvo neste navegador.</small>
          </footer>
        </>}
      </aside>
    </div>}

    {cart.length > 0 && !cartOpen && <button className="floating-cart" onClick={() => setCartOpen(true)}>
      <span>{totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'}</span><strong>Ver carrinho · {money(subtotal)}</strong>
    </button>}
  </main>;
}
