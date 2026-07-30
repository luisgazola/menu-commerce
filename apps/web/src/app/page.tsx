'use client';
import { useEffect, useMemo, useState } from 'react';
import { API_URL, STORE_SLUG, money } from '../lib/api';

type OptionItem = { id: string; name: string; additionalPrice: string };
type OptionGroup = { id: string; name: string; required: boolean; maximumSelection: number; items: OptionItem[] };
type Product = { id: string; name: string; description?: string; price: string; promotionalPrice?: string | null; imageUrl?: string; preparationTime?: number; featured: boolean; optionGroups: OptionGroup[] };
type Category = { id: string; name: string; products: Product[] };
type MenuResponse = { store: { name: string; description?: string; bannerUrl?: string; whatsapp?: string; isOpen: boolean }; categories: Category[] };

export default function HomePage() {
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { const timer = setTimeout(() => { fetch(`${API_URL}/catalog/${STORE_SLUG}?search=${encodeURIComponent(search)}`).then(async r => { if (!r.ok) throw new Error('Não foi possível carregar o cardápio.'); return r.json(); }).then(setMenu).catch((e: Error) => setError(e.message)); }, 250); return () => clearTimeout(timer); }, [search]);
  const count = useMemo(() => menu?.categories.reduce((sum, category) => sum + category.products.length, 0) ?? 0, [menu]);

  return <main className="menu-shell">
    <header className="menu-header">
      <div><span className="version">v0.2.0</span><h1>{menu?.store.name ?? 'MenuCommerce'}</h1><p>{menu?.store.description ?? 'Cardápio online responsivo'}</p></div>
      <a className="admin-link" href="/admin">Administrador</a>
    </header>
    <section className="banner" style={menu?.store.bannerUrl ? { backgroundImage: `linear-gradient(90deg, rgba(14,12,18,.92), rgba(14,12,18,.3)), url(${menu.store.bannerUrl})` } : undefined}>
      <div><span className={menu?.store.isOpen ? 'status open' : 'status'}>{menu?.store.isOpen ? 'Aberto agora' : 'Fechado'}</span><h2>Escolha seu pedido</h2><p>{count} produtos disponíveis</p></div>
    </section>
    <label className="search"><span>Pesquisar</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hambúrguer, bebida, sobremesa..." /></label>
    {error && <p className="error">{error}</p>}
    {!menu && !error && <p>Carregando cardápio...</p>}
    {menu?.categories.map(category => <section className="category" key={category.id}><h2>{category.name}</h2><div className="products">{category.products.map(product => <article className="product" key={product.id}>
      <div className="product-image" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}>{product.featured && <span>Destaque</span>}</div>
      <div className="product-content"><h3>{product.name}</h3><p>{product.description}</p>{product.preparationTime && <small>Preparo aproximado: {product.preparationTime} min</small>}
      {product.optionGroups.length > 0 && <details><summary>Opções e adicionais</summary>{product.optionGroups.map(group => <div key={group.id}><strong>{group.name}</strong><ul>{group.items.map(item => <li key={item.id}>{item.name} {Number(item.additionalPrice) > 0 && `(+ ${money(item.additionalPrice)})`}</li>)}</ul></div>)}</details>}
      <div className="price-row"><div>{product.promotionalPrice ? <><del>{money(product.price)}</del><strong>{money(product.promotionalPrice)}</strong></> : <strong>{money(product.price)}</strong>}</div><button disabled title="Carrinho será implementado na v0.3.0">Adicionar</button></div></div>
    </article>)}</div></section>)}
  </main>;
}
