// TypeScript Interfaces for Mess Manager Feature Domain

export interface Institute {
  id: number;
  name: string;
  code: string;
  district: string;
}

export interface User {
  id: number;
  instituteId: number;
  name: string;
  email: string;
  phone: string;
  rollNo: number;
  registrationNo: number;
  department: string;
  session: string;
  role: 'student' | 'admin' | 'moderator';
}

export interface Mess {
  id: number;
  instituteId: number;
  name: string;
  joinCode: string;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessMember {
  id: number;
  messId: number;
  userId: number;
  name: string;      -- Joined from User table query
  rollNo: number;    -- Joined from User table query
  phone: string;     -- Joined from User table query
  role: 'manager' | 'member';
  status: 'pending' | 'active' | 'declined';
  joinedAt: string;
}

export interface MessMeal {
  id: number;
  messId: number;
  userId: number;
  mealDate: string;  -- Format: YYYY-MM-DD
  mealCount: number; -- Supports fractional values (e.g. 0.5, 1.5, 2)
  createdAt: string;
  updatedAt: string;
}

export interface MessExpense {
  id: number;
  messId: number;
  userId: number;
  userName?: string; -- Injected from joins
  title: string;
  amount: number;
  expenseDate: string;
  category: 'bazaar' | 'utilities' | 'rent' | 'other';
  createdAt: string;
}

export interface MessDeposit {
  id: number;
  messId: number;
  userId: number;
  userName?: string; -- Injected from joins
  amount: number;
  depositDate: string;
  notes?: string;
  createdAt: string;
}

// Financial calculations summary returned by API
export interface MessSummary {
  messId: number;
  totalMeals: number;
  totalExpenses: number;
  mealRate: number;
  totalDeposits: number;
  membersSummary: {
    userId: number;
    name: string;
    totalMeals: number;
    totalDeposits: number;
    allocatedExpense: number;
    balance: number; // Positive = refund due, Negative = owes money
  }[];
}
