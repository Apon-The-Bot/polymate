// TypeScript Interfaces for Home Dashboard Feature Domain

export interface StudentProfile {
  id: number;
  name: string;
  rollNo: number;
  registrationNo: number;
  department: string;
  session: string;
  semester: string;
  instituteName: string;
  instituteCode: string;
}

export interface CampusFeedItem {
  id: number;
  type: 'marketplace' | 'room_finder' | 'lost_found' | 'notice';
  title: string;
  subtitle: string;
  timeAgo: string;
  price?: number;
  badgeText?: string;
  badgeColor?: string;
}

export interface UserContextWidget {
  hasActiveMess: boolean;
  messName?: string;
  todayMeals?: number;
  messBalance?: number;
  monthlyExpenseBudget?: number;
  monthlyExpenseSpent?: number;
}
