export type RecordStatus = 'ACTIVE' | 'INACTIVE';
export interface CatalogProduct { id: string; name: string; description?: string; price: string; promotionalPrice?: string | null; imageUrl?: string; featured: boolean; }
export interface CatalogCategory { id: string; name: string; products: CatalogProduct[]; }
