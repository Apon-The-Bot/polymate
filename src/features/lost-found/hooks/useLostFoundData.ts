import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { LostFoundItem } from '../types';

const API_BASE_URL = 'https://bloodhelpbd.com/polymate-api';

const getAuthHeaders = async () => {
  const token = 'mock-jwt-token';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Local mock database adhering strictly to the 6 student names constraint:
// Amanullah Sheikh, Apon, Asha, Jihad, Jerin, Rhythm
let mockLostFoundItems: LostFoundItem[] = [
  {
    id: 1,
    title: "Casio fx-991EX ClassWiz Calculator",
    type: "lost",
    category: "electronics",
    description: "Lost during 5th semester midterm exam in Room 304. Has a green sticker on the back side cover.",
    location: "DPI Room 304",
    contactNumber: "01712345678",
    reporterName: "Amanullah Sheikh",
    status: "unresolved",
    reportedDate: "2026-07-01"
  },
  {
    id: 2,
    title: "DPI Student ID Card (Jerin)",
    type: "found",
    category: "documents",
    description: "Found a student ID card near the main gate. Roll number starts with 568. Please call to collect.",
    location: "Campus Main Gate",
    contactNumber: "01812345678",
    reporterName: "Jerin",
    status: "unresolved",
    reportedDate: "2026-06-30"
  },
  {
    id: 3,
    title: "Room 102 Mess Keyring",
    type: "lost",
    category: "personal_items",
    description: "Lost a keyring with 3 keys and a small leather tag. Dropped somewhere between library and DPI canteen.",
    location: "Library to Canteen road",
    contactNumber: "01912345678",
    reporterName: "Jihad",
    status: "unresolved",
    reportedDate: "2026-06-28"
  },
  {
    id: 4,
    title: "Engineering Drawing T-Square Bag",
    type: "found",
    category: "others",
    description: "Found a black T-Square layout bag on the bench of cafeteria. It contains a drawing board sheet folder as well.",
    location: "Cafeteria Bench",
    contactNumber: "01512345678",
    reporterName: "Apon",
    status: "resolved",
    reportedDate: "2026-06-25"
  },
  {
    id: 5,
    title: "Mathematics Reference Book",
    type: "lost",
    category: "books",
    description: "Lost reference book (Higher Engineering Mathematics by B.S. Grewal). Had some class test sheets inside.",
    location: "Department Library",
    contactNumber: "01612345678",
    reporterName: "Asha",
    status: "unresolved",
    reportedDate: "2026-06-22"
  },
  {
    id: 6,
    title: "Leather Wallet with NID Card",
    type: "found",
    category: "documents",
    description: "Found a brown leather wallet near the library corridor. Contains national ID and some cash. Verify ownership to collect.",
    location: "Library Corridor",
    contactNumber: "01787654321",
    reporterName: "Rhythm",
    status: "unresolved",
    reportedDate: "2026-06-20"
  }
];

export function useLostFoundItems() {
  return useQuery<LostFoundItem[], Error>({
    queryKey: ['lostFoundItems'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/lost-found`, { headers });
        return response.data;
      } catch (err) {
        return [...mockLostFoundItems];
      }
    }
  });
}

export function useReportLostFoundItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Omit<LostFoundItem, 'id' | 'status' | 'reportedDate'>) => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_BASE_URL}/lost-found`, newItem, { headers });
        return response.data;
      } catch (err) {
        console.warn("API failed, adding mock lost/found listing locally:", (err as any).message);
        const created: LostFoundItem = {
          id: Math.random(),
          status: 'unresolved',
          reportedDate: new Date().toISOString().split('T')[0],
          ...newItem
        };
        mockLostFoundItems = [created, ...mockLostFoundItems];
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostFoundItems'] });
    }
  });
}

export function useToggleItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, currentStatus }: { itemId: number; currentStatus: LostFoundItem['status'] }) => {
      try {
        const nextStatus = currentStatus === 'resolved' ? 'unresolved' : 'resolved';
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${API_BASE_URL}/lost-found/${itemId}`, { status: nextStatus }, { headers });
        return response.data;
      } catch (err) {
        console.warn("API failed, toggling mock lost/found status locally:", (err as any).message);
        const nextStatus = currentStatus === 'resolved' ? 'unresolved' : 'resolved';
        mockLostFoundItems = mockLostFoundItems.map(item => 
          item.id === itemId ? { ...item, status: nextStatus } : item
        );
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lostFoundItems'] });
    }
  });
}
