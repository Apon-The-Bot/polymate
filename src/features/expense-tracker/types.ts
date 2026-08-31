export interface PersonalTransaction {
  id: number;
  userId: number;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: 'food' | 'study' | 'travel' | 'rent' | 'pocket_money' | 'tuition' | 'scholarship' | 'others';
  expenseDate: string;
  notes?: string;
}

export interface PersonalBudget {
  monthlyLimit: number;
  spentThisMonth: number;
  incomeThisMonth: number;
}

export interface PersonalNote {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
}
