'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{code:string;discount:string;freeDelivery:boolean;description?:string}|null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderNumber: string; total: string } | null>(null);
  const [checkout, setCheckout] = useState({ name: '', phone: '', email: '', serviceType: 'PICKUP', postalCode: '', street: '', number: '', complement: '', district: '', city: '', state: 'SP', reference: '', notes: '' });

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

  async function validateCoupon() {
    setCouponMessage(''); setCouponResult(null);
    if (!couponCode.trim()) return setCouponMessage('Informe um cupom.');
    try {
      const response = await fetch(`${API_URL}/coupons/validate`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ storeSlug: STORE_SLUG, code: couponCode, customerPhone: checkout.phone, subtotal, serviceType: checkout.serviceType }) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message)?data.message.join(', '):data.message);
      setCouponResult(data); setCouponCode(data.code); setCouponMessage('Cupom aplicado com sucesso.');
    } catch (e) { setCouponMessage(e instanceof Error ? e.message : 'Cupom inválido.'); }
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      const delivery = checkout.serviceType === 'DELIVERY';
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug: STORE_SLUG,
          customer: { name: checkout.name, phone: checkout.phone, email: checkout.email || undefined },
          serviceType: checkout.serviceType,
          address: delivery ? {
            postalCode: checkout.postalCode, street: checkout.street, number: checkout.number,
            complement: checkout.complement || undefined, district: checkout.district,
            city: checkout.city, state: checkout.state, reference: checkout.reference || undefined
          } : undefined,
          couponCode: couponResult?.code || undefined,
          notes: checkout.notes || undefined,
          items: cart.map((item) => ({
            productId: item.productId, quantity: item.quantity, notes: item.notes || undefined,
            optionItemIds: item.options.map((option) => option.itemId)
          }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message ?? 'Não foi possível criar o pedido.');
      setOrderResult({ orderNumber: data.orderNumber, total: data.total });
      localStorage.setItem(`menucommerce.order.phone.${data.orderNumber}`, checkout.phone);
      setCart([]);
      localStorage.removeItem(CART_STORAGE_KEY);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro ao criar o pedido.');
    } finally { setSubmitting(false); }
  }

  const selectionPreview = selection
    ? itemUnitTotal({ unitPrice: baseProductPrice(selection.product), options: selectedOptions(selection) }) * selection.quantity
    : 0;

  return <main className="menu-shell">
    <header className="menu-header">
      <div>
        <span className="version">v0.5.0</span>
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
            <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continuar para identificação</button>
            <small>O carrinho permanece salvo neste navegador.</small>
          </footer>
        </>}
      </aside>
    </div>}


    {checkoutOpen && <div className="overlay" role="presentation" onMouseDown={() => setCheckoutOpen(false)}>
      <section className="modal checkout-modal" role="dialog" aria-modal="true" aria-label="Finalizar pedido" onMouseDown={(event) => event.stopPropagation()}>
        <button className="close" onClick={() => setCheckoutOpen(false)} aria-label="Fechar">×</button>
        <span className="version">Checkout v0.5.0</span><h2>Identificação e atendimento</h2>
        <form onSubmit={submitOrder} className="checkout-form">
          <div className="two"><label>Nome<input required value={checkout.name} onChange={e=>setCheckout({...checkout,name:e.target.value})}/></label><label>WhatsApp<input required value={checkout.phone} onChange={e=>setCheckout({...checkout,phone:e.target.value})} placeholder="(12) 99999-9999"/></label></div>
          <label>E-mail opcional<input type="email" value={checkout.email} onChange={e=>setCheckout({...checkout,email:e.target.value})}/></label>
          <fieldset><legend>Como deseja receber?</legend><div className="service-options"><label className="option"><input type="radio" checked={checkout.serviceType==='PICKUP'} onChange={()=>setCheckout({...checkout,serviceType:'PICKUP'})}/><span>Retirada no local</span></label><label className="option"><input type="radio" checked={checkout.serviceType==='DELIVERY'} onChange={()=>setCheckout({...checkout,serviceType:'DELIVERY'})}/><span>Entrega</span><strong>+ {money(5)}</strong></label></div></fieldset>
          {checkout.serviceType==='DELIVERY' && <div className="address-fields"><div className="two"><label>CEP<input required value={checkout.postalCode} onChange={e=>setCheckout({...checkout,postalCode:e.target.value})}/></label><label>Estado<input required maxLength={2} value={checkout.state} onChange={e=>setCheckout({...checkout,state:e.target.value.toUpperCase()})}/></label></div><label>Rua<input required value={checkout.street} onChange={e=>setCheckout({...checkout,street:e.target.value})}/></label><div className="two"><label>Número<input required value={checkout.number} onChange={e=>setCheckout({...checkout,number:e.target.value})}/></label><label>Complemento<input value={checkout.complement} onChange={e=>setCheckout({...checkout,complement:e.target.value})}/></label></div><div className="two"><label>Bairro<input required value={checkout.district} onChange={e=>setCheckout({...checkout,district:e.target.value})}/></label><label>Cidade<input required value={checkout.city} onChange={e=>setCheckout({...checkout,city:e.target.value})}/></label></div><label>Referência<input value={checkout.reference} onChange={e=>setCheckout({...checkout,reference:e.target.value})}/></label></div>}
          <fieldset><legend>Cupom de desconto</legend><div className="coupon-row"><input value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setCouponResult(null)}} placeholder="Ex.: BEMVINDO10"/><button type="button" onClick={validateCoupon}>Aplicar</button></div>{couponMessage&&<small className={couponResult?'success-text':'error'}>{couponMessage}</small>}{couponResult&&<small>{couponResult.freeDelivery?'Frete grátis':`Desconto estimado: ${money(couponResult.discount)}`} {couponResult.description?`· ${couponResult.description}`:''}</small>}</fieldset>
          <label>Observações gerais<textarea maxLength={300} value={checkout.notes} onChange={e=>setCheckout({...checkout,notes:e.target.value})}/></label>
          {error && <p className="error">{error}</p>}
          <div className="checkout-summary"><span>Subtotal</span><strong>{money(subtotal)}</strong>{couponResult&&<><span>Desconto estimado</span><strong>- {money(couponResult.discount)}</strong></>}<small>O servidor validará novamente o cupom, produtos, adicionais, limites e total.</small></div>
          <button disabled={submitting}>{submitting ? 'Criando pedido...' : 'Confirmar pedido'}</button>
        </form>
      </section>
    </div>}

    {orderResult && <div className="overlay"><section className="modal order-success"><span className="version">Pedido confirmado</span><h2>Pedido #{orderResult.orderNumber}</h2><p>Total validado pelo servidor: <strong>{money(orderResult.total)}</strong></p><a className="order-link" href={`/pedido/${orderResult.orderNumber}`}>Acompanhar pedido</a><button onClick={()=>setOrderResult(null)}>Voltar ao cardápio</button></section></div>}

    {cart.length > 0 && !cartOpen && <button className="floating-cart" onClick={() => setCartOpen(true)}>
      <span>{totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'}</span><strong>Ver carrinho · {money(subtotal)}</strong>
    </button>}
  </main>;
}
