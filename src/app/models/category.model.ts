export interface Category {
  id: number;
  name: string;
  description: string;
  active: boolean;
  source?: 'api';
}

export type CategoryInput = Omit<Category, 'id'>;
