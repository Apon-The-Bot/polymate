import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { StudentProfile, CampusFeedItem, UserContextWidget } from '../types';

const API_BASE_URL = 'https://bloodhelpbd.com/polymate-api';

const getAuthHeaders = async () => {
  const token = 'mock-jwt-token';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// ============================================================================
// LOCAL MOCK DATA FALLBACKS (For instant visual presentation)
// ============================================================================

const mockProfile: StudentProfile = {
  id: 1,
  name: "Rahat Islam",
  rollNo: 501234,
  registrationNo: 1501234567,
  department: "Computer Technology",
  session: "2020-21",
  semester: "5th Semester",
  instituteName: "Dhaka Polytechnic Institute",
  instituteCode: "DPI"
};

const mockWidget: UserContextWidget = {
  hasActiveMess: true,
  messName: "Super Mess DPI",
  todayMeals: 1.5,
  messBalance: 150.00,
  monthlyExpenseBudget: 5000.00,
  monthlyExpenseSpent: 3450.00
};

const mockFeed: CampusFeedItem[] = [
  {
    id: 1,
    type: 'notice',
    title: '৫ম পর্বের মিড-টার্ম পরীক্ষার সময়সূচী প্রকাশ',
    subtitle: 'অফিসিয়াল নোটিশ বোর্ড - DPI',
    timeAgo: '১০ মিনিট আগে',
    badgeText: 'পরীক্ষা',
    badgeColor: 'bg-rose-500'
  },
  {
    id: 2,
    type: 'marketplace',
    title: 'বিক্রি হবে: Drafting Table (Like New)',
    subtitle: 'বিক্রেতা: আসিফ রায়হান (সিভিল)',
    timeAgo: '১ ঘণ্টা আগে',
    price: 450,
    badgeText: 'মার্কেটপ্লেস',
    badgeColor: 'bg-emerald-500'
  },
  {
    id: 3,
    type: 'room_finder',
    title: 'সিট খালি: ডাবল রুমে ১টি মেস সিট খালি আছে (ছাত্র)',
    subtitle: 'লোকেশন: পলিটেকনিক মোড় (ক্যাম্পাসের কাছে)',
    timeAgo: '২ ঘণ্টা আগে',
    price: 1300,
    badgeText: 'মেস সিট',
    badgeColor: 'bg-teal-500'
  },
  {
    id: 4,
    type: 'lost_found',
    title: 'খুঁজে পাওয়া গেছে: Casio FX-991EX সায়েন্টিফিক ক্যালকুলেটর',
    subtitle: 'প্রাপ্তিস্থান: অডিটোরিয়াম মাঠ',
    timeAgo: '৪ ঘণ্টা আগে',
    badgeText: 'লস্ট/ফাউন্ড',
    badgeColor: 'bg-amber-500'
  }
];

export function useStudentProfile() {
  return useQuery<StudentProfile, Error>({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/student/profile`, { headers });
        return response.data;
      } catch (err) {
        return mockProfile;
      }
    }
  });
}

export function useUserContextWidget() {
  return useQuery<UserContextWidget, Error>({
    queryKey: ['userContextWidget'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/student/widget`, { headers });
        return response.data;
      } catch (err) {
        return mockWidget;
      }
    }
  });
}

export function useCampusFeed() {
  return useQuery<CampusFeedItem[], Error>({
    queryKey: ['campusFeed'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/student/feed`, { headers });
        return response.data;
      } catch (err) {
        return mockFeed;
      }
    }
  });
}
