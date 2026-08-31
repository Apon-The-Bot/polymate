// TypeScript Interfaces for Mess & Room Finder Domain

export interface RoomListing {
  id: number;
  instituteId: number;
  hostUserId: number;
  hostName: string;
  title: string;
  description: string;
  rentAmount: number;
  location: string;
  type: 'mess_seat' | 'single_room' | 'sublet' | 'apartment';
  seatCount: number;
  contactPhone: string;
  images: string[];
  status: 'available' | 'occupied' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface RoomFilter {
  type: 'all' | 'mess_seat' | 'single_room' | 'sublet' | 'apartment';
  maxRent: number;
  location?: string;
}
