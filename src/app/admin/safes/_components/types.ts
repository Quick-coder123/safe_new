export interface Safe {
  id: number;
  number: string;
  category: string;
  size: string;
  status: 'available' | 'occupied' | 'maintenance';
  block_id: number;
  maintenance_comment?: string;
}

export interface Block {
  id: number;
  name: string;
  description?: string;
}

export interface SafeStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  byCategory: {
    [key: string]: {
      total: number;
      available: number;
      occupied: number;
      maintenance: number;
      availableBySizes: {
        [size: string]: number;
      };
    };
  };
}

// Маппінг розмірів до категорій
export const CATEGORY_SIZES = {
  'I': ['50х280х390', '75х280х390', '80х280х390', '100х280х390'],
  'II': ['125х280х390', '150х280х390'],
  'III': ['200х280х390', '250х280х390'],
  'IV': ['300х280х390']
};
