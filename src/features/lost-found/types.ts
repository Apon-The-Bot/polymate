export interface LostFoundItem {
  id: number;
  title: string;
  type: 'lost' | 'found';
  category: 'electronics' | 'documents' | 'books' | 'personal_items' | 'others';
  description: string;
  location: string;
  contactNumber: string;
  reporterName: string;
  status: 'unresolved' | 'resolved';
  reportedDate: string;
}

export type LostFoundFilterCategory = 'all' | LostFoundItem['category'];
export type LostFoundFilterType = 'all' | 'lost' | 'found';
