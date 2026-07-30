export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
export const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG ?? 'demo';
export function money(value: string | number): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)); }
