'use client';

import { FormEvent, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export default function HomePage() {
  const [email, setEmail] = useState('admin@local.test');
  const [password, setPassword] = useState('Admin@123456');
  const [message, setMessage] = useState('');

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage('Autenticando...');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = (await response.json()) as { accessToken?: string; message?: string };
      if (!response.ok || !data.accessToken) throw new Error(data.message ?? 'Falha na autenticação.');

      localStorage.setItem('menu-commerce-token', data.accessToken);
      setMessage('Login realizado. Token administrativo salvo no navegador.');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Erro inesperado.');
    }
  }

  return (
    <main>
      <section className="hero">
        <span className="version">v0.1.0</span>
        <h1>MenuCommerce</h1>
        <p>Fundação do cardápio online, painel administrativo e infraestrutura de dados.</p>
      </section>

      <section className="card">
        <h2>Acesso administrativo</h2>
        <form onSubmit={handleLogin}>
          <label>
            E-mail
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Senha
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button type="submit">Entrar</button>
        </form>
        <p className="message" aria-live="polite">{message}</p>
      </section>

      <section className="card">
        <h2>Módulos disponíveis</h2>
        <div className="grid">
          <article><strong>API</strong><span>NestJS e Swagger</span></article>
          <article><strong>Banco</strong><span>PostgreSQL e Prisma</span></article>
          <article><strong>Segurança</strong><span>JWT e Argon2</span></article>
          <article><strong>Empresa</strong><span>Cadastro inicial</span></article>
        </div>
      </section>
    </main>
  );
}
