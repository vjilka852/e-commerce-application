export interface Category {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

export type CategoryInput = Omit<Category, 'id'>;
