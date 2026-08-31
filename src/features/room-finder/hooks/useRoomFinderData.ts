import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { RoomListing, RoomFilter } from '../types';

const API_BASE_URL = 'https://bloodhelpbd.com/polymate-api';

const getAuthHeaders = async () => {
  const token = 'mock-jwt-token';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// ============================================================================
// LOCAL MOCK DATA (DPI nearby room rental options)
// ============================================================================

const mockListings: RoomListing[] = [
  {
    id: 1,
    instituteId: 1,
    hostUserId: 2,
    hostName: "Asif Raihan",
    title: "সিঙ্গেল সিট খালি (কম্পিউটার ডিপার্টমেন্ট মেস)",
    description: "আমাদের ৪ জনের রুমে একটি সিট খালি আছে। ডাইনিং এবং ওয়াইফাই এর সুবিধা আছে। কারেন্ট বিল শেয়ার করা হবে। কেবল মাত্র পলিটেকনিকের শান্ত ও পড়াশোনা প্রিয় ছাত্রদের জন্য প্রযোজ্য।",
    rentAmount: 1200,
    location: "পলিটেকনিক মোড় (ক্যাম্পাস থেকে ২ মিনিট হাঁটা পথ)",
    type: 'mess_seat',
    seatCount: 1,
    contactPhone: "01812345678",
    images: [],
    status: 'available',
    createdAt: "2026-07-01",
    updatedAt: "2026-07-01"
  },
  {
    id: 2,
    instituteId: 1,
    hostUserId: 3,
    hostName: "Sajid Hasan",
    title: "পড়াশোনার জন্য নিরিবিলি সিঙ্গেল রুম",
    description: "একটি ফ্ল্যাটের ভেতরে এটা সম্পূর্ণ আলাদা একটি রুম। বাথরুম এবং রান্নাঘর শেয়ার করতে হবে। পানি ও গ্যাস বিল ভাড়ার ভেতরেই অন্তর্ভুক্ত।",
    rentAmount: 2500,
    location: "তেজগাঁও কুনিপাড়া (DPI গেট সংলগ্ন)",
    type: 'single_room',
    seatCount: 1,
    contactPhone: "01912345678",
    images: [],
    status: 'available',
    createdAt: "2026-06-30",
    updatedAt: "2026-06-30"
  },
  {
    id: 3,
    instituteId: 1,
    hostUserId: 4,
    hostName: "Tanvir Rahman",
    title: "২ রুমের সাবলেট ফ্ল্যাট (পারিবারিক বাসা)",
    description: "একটি ড্রয়িং, ডাইনিং স্পেস ও আলাদা রান্নাঘরসহ এই বাসাটি সাবলেট দেওয়া হবে। ফ্যামিলি বা ৪ জন ছাত্র শেয়ার করে থাকতে পারবেন। নিরাপত্তা নিশ্চিত করা আছে।",
    rentAmount: 6500,
    location: "বেগুনবাড়ী মেইন রোড, তেজগাঁও",
    type: 'sublet',
    seatCount: 4,
    contactPhone: "01723456789",
    images: [],
    status: 'available',
    createdAt: "2026-06-28",
    updatedAt: "2026-06-28"
  },
  {
    id: 4,
    instituteId: 1,
    hostUserId: 5,
    hostName: "Imran Khan",
    title: "মেস সিট খালি - খাবার রান্নার বুয়া আছে",
    description: "খুব সুন্দর পরিবেশ এবং প্রতি বেলা খাবারের ভালো মান। ২ জন বুয়া আছে রান্না ও থালাবাসন ধোয়ার জন্য। ম্যানেজার প্রতিমাসে হিসাব নিকাশ ডিজিটালি প্রজেক্ট ড্যাশবোর্ড থেকে রিলিজ করেন।",
    rentAmount: 1400,
    location: "নাকহালপাড়া রেলগেট সংলগ্ন, তেজগাঁও",
    type: 'mess_seat',
    seatCount: 2,
    contactPhone: "01512345678",
    images: [],
    status: 'available',
    createdAt: "2026-06-27",
    updatedAt: "2026-06-27"
  }
];

/**
 * Fetch room listings filtered by type and max rent.
 * Integrates local mock search filtering fallback if the API database table is offline.
 */
export function useRoomListings(filters: RoomFilter) {
  return useQuery<RoomListing[], Error>({
    queryKey: ['roomListings', filters],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/mess-rooms`, {
          headers,
          params: {
            type: filters.type !== 'all' ? filters.type : undefined,
            maxRent: filters.maxRent
          }
        });
        return response.data;
      } catch (err) {
        console.warn("API failed, performing client-side mock filter mapping:", err.message);
        
        // Emulate database queries locally
        return mockListings.filter(item => {
          const matchesType = filters.type === 'all' || item.type === filters.type;
          const matchesPrice = item.rentAmount <= filters.maxRent;
          return matchesType && matchesPrice;
        });
      }
    }
  });
}
