export interface MarketplaceListing {
  id: number;
  instituteId: number;
  sellerId: number;
  sellerName: string;
  sellerPhone: string;
  title: string;
  description: string;
  price: number;
  isNegotiable: boolean;
  category: 'books_notes' | 'drawing_tools' | 'electronics' | 'mess_furniture' | 'cycles_bikes' | 'others';
  condition: 'new' | 'like_new' | 'good' | 'fair';
  location: string;
  images: string[];
  status: 'available' | 'sold';
  createdAt: string;
}

export type ListingCategory = 'all' | 'books_notes' | 'drawing_tools' | 'electronics' | 'mess_furniture' | 'cycles_bikes' | 'others';
export type SortOption = 'newest' | 'price_low' | 'price_high';
export type ConditionFilter = 'all' | 'new' | 'like_new' | 'good' | 'fair';
