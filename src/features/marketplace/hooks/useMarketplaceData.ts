import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MarketplaceListing } from '../types';

const API_BASE_URL = 'https://bloodhelpbd.com/polymate-api';

const getAuthHeaders = async () => {
  const token = 'mock-jwt-token';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const mockListings: MarketplaceListing[] = [
  {
    id: 1,
    instituteId: 1,
    sellerId: 2,
    sellerName: "Apon",
    sellerPhone: "01812345678",
    title: "Drafting Table (Like New)",
    description: "সিভিল টেকনোলজির ড্রয়িং ক্লাসের জন্য অত্যন্ত উপযোগী। বোর্ডটি একদম নতুনের মতো এবং কোনো স্ক্র্যাচ নেই। সাথে ফ্রি প্রটেক্টিভ কাভার পাবেন।",
    price: 450,
    isNegotiable: true,
    category: 'drawing_tools',
    condition: 'like_new',
    location: "Polytechnic Mor",
    images: [],
    status: 'available',
    createdAt: "2026-07-01"
  },
  {
    id: 2,
    instituteId: 1,
    sellerId: 4,
    sellerName: "Jihad",
    sellerPhone: "01723456789",
    title: "Physics-2 Handwritten Full Note",
    description: "সবগুলো চ্যাপ্টারের সহজ সমাধান ও বোর্ড পরীক্ষার জন্য ইম্পরট্যান্ট সাজেশন্সসহ সম্পূর্ণ হাতে লেখা নোটখাতা। লেখা অত্যন্ত পরিষ্কার ও বোঝার উপযোগী।",
    price: 120,
    isNegotiable: false,
    category: 'books_notes',
    condition: 'good',
    location: "Kunipara, Tejgaon",
    images: [],
    status: 'available',
    createdAt: "2026-07-01"
  },
  {
    id: 3,
    instituteId: 1,
    sellerId: 3,
    sellerName: "Asha",
    sellerPhone: "01912345678",
    title: "Casio fx-991ES Plus Calculator",
    description: "অরিজিনাল ক্যালকুলেটর। ম্যাট্রিক্স, ভেক্টর, ইন্টিগ্রেশন ও কমপ্লেক্স নাম্বার ইকুয়েশন সলভ করার জন্য বেস্ট। সোলার প্যানেল সচল আছে, ডিসপ্লে একদম ফ্রেশ।",
    price: 800,
    isNegotiable: true,
    category: 'electronics',
    condition: 'like_new',
    location: "Begunbari",
    images: [],
    status: 'available',
    createdAt: "2026-06-30"
  },
  {
    id: 4,
    instituteId: 1,
    sellerId: 5,
    sellerName: "Jerin",
    sellerPhone: "01512345678",
    title: "Ceiling Fan & Study Table Combo",
    description: "মেসের রুম ছাড়ছি তাই জরুরি ভিত্তিতে বিক্রি হবে। বিআরবি কোম্পানির সিলিং ফ্যান (ফুল স্পিড) এবং ১টি ফোল্ডিং কাঠের পড়ার টেবিল ও প্লাস্টিকের চেয়ার।",
    price: 1800,
    isNegotiable: true,
    category: 'mess_furniture',
    condition: 'good',
    location: "DPI Gate area",
    images: [],
    status: 'available',
    createdAt: "2026-06-29"
  },
  {
    id: 5,
    instituteId: 1,
    sellerId: 6,
    sellerName: "Rhythm",
    sellerPhone: "01787654321",
    title: "Phoenix Student Bicycle (Running)",
    description: "ক্যাম্পাসে যাতায়াতের জন্য পারফেক্ট সাইকেল। ব্র্যাক সচল, চাকা ডাবল রিংয়ের এবং পেছনের টায়ার কিছুদিন আগেই নতুন লাগানো হয়েছে। লক ও বেল ফ্রি পাবেন।",
    price: 4200,
    isNegotiable: true,
    category: 'cycles_bikes',
    condition: 'fair',
    location: "Tejgaon Station Road",
    images: [],
    status: 'available',
    createdAt: "2026-06-28"
  },
  {
    id: 6,
    instituteId: 1,
    sellerId: 2,
    sellerName: "Apon",
    sellerPhone: "01812345678",
    title: "Drawing Sheet Tube & T-Square Bag",
    description: "ড্রয়িং শিট সুন্দরভাবে বহন করার জন্য ওয়াটারপ্রুফ প্লাস্টিক শিট টিউব এবং স্কেল রাখার ব্যাগ। কারিগরি ছাত্রদের জন্য খুবই প্রয়োজনীয়।",
    price: 250,
    isNegotiable: false,
    category: 'others',
    condition: 'new',
    location: "Polytechnic Mor",
    images: [],
    status: 'available',
    createdAt: "2026-06-27"
  },
  {
    id: 7,
    instituteId: 1,
    sellerId: 5,
    sellerName: "Jerin",
    sellerPhone: "01512345678",
    title: "5th Sem Computer Tech Books Set",
    description: "৫ম পর্বের কম্পিউটার টেকনোলজির ৭টি বোর্ড রেফারেন্স বই একসাথে। সবগুলো বই ফ্রেশ, ভেতরে কোনো লেখালেখি করা নেই। প্র্যাক্টিকাল বুকও সাথে থাকবে।",
    price: 750,
    isNegotiable: false,
    category: 'books_notes',
    condition: 'good',
    location: "DPI Hostel",
    images: [],
    status: 'available',
    createdAt: "2026-06-26"
  }
];

export function useMarketplaceListings() {
  return useQuery<MarketplaceListing[], Error>({
    queryKey: ['marketplaceListings'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/marketplace`, { headers });
        return response.data;
      } catch (err) {
        return mockListings;
      }
    }
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newListing: Omit<MarketplaceListing, 'id' | 'createdAt' | 'status' | 'sellerId' | 'sellerName' | 'instituteId'>) => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_BASE_URL}/marketplace`, newListing, { headers });
        return response.data;
      } catch (err) {
        console.warn("API failed, adding mock listing locally:", (err as any).message);
        return {
          id: Math.random(),
          instituteId: 1,
          sellerId: 1, // Logged-in user ID
          sellerName: "Amanullah Sheikh", // Default logged-in user name
          status: 'available',
          createdAt: new Date().toISOString().split('T')[0],
          ...newListing
        } as MarketplaceListing;
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to trigger re-fetch or optimistically update local client cache
      queryClient.setQueryData(['marketplaceListings'], (oldData: MarketplaceListing[] | undefined) => {
        if (!oldData) return [data];
        return [data, ...oldData];
      });
      queryClient.invalidateQueries({ queryKey: ['marketplaceListings'] });
    }
  });
}
