import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PersonalTransaction, PersonalBudget, PersonalNote } from '../types';

const API_BASE_URL = 'https://bloodhelpbd.com/polymate-api';

const getAuthHeaders = async () => {
  const token = 'mock-jwt-token';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Local mock database
let mockBudget: PersonalBudget = {
  monthlyLimit: 5000,
  spentThisMonth: 3450,
  incomeThisMonth: 8000
};

let mockTransactions: PersonalTransaction[] = [
  {
    id: 1,
    userId: 1,
    title: "Mess Seat Rent (June)",
    amount: 1500,
    type: 'expense',
    category: 'rent',
    expenseDate: "2026-06-30",
    notes: "Super Mess DPI"
  },
  {
    id: 2,
    userId: 1,
    title: "Java SE Reference Book",
    amount: 600,
    type: 'expense',
    category: 'study',
    expenseDate: "2026-06-28",
    notes: "Marketplace purchase from Rhythm"
  },
  {
    id: 3,
    userId: 1,
    title: "Bus Ticket to Tangail",
    amount: 250,
    type: 'expense',
    category: 'travel',
    expenseDate: "2026-06-25",
    notes: "Home visit"
  },
  {
    id: 4,
    userId: 1,
    title: "Drawing Board Sheets",
    amount: 150,
    type: 'expense',
    category: 'study',
    expenseDate: "2026-06-22",
    notes: "Midterm exam preparation sheets"
  },
  {
    id: 5,
    userId: 1,
    title: "Mess Meal Deposit",
    amount: 750,
    type: 'expense',
    category: 'food',
    expenseDate: "2026-06-20",
    notes: "Deposited to Apon"
  },
  {
    id: 6,
    userId: 1,
    title: "Tuition Salary (June)",
    amount: 3000,
    type: 'income',
    category: 'tuition',
    expenseDate: "2026-06-10",
    notes: "Class 9 Science student"
  },
  {
    id: 7,
    userId: 1,
    title: "Pocket Money from Home",
    amount: 5000,
    type: 'income',
    category: 'pocket_money',
    expenseDate: "2026-06-02",
    notes: "Received via Bkash"
  },
  {
    id: 8,
    userId: 1,
    title: "Canteen Tea & Snacks",
    amount: 200,
    type: 'expense',
    category: 'food',
    expenseDate: "2026-06-18",
    notes: "Treat with Jihad & Asha"
  }
];

let mockNotes: PersonalNote[] = [
  {
    id: 1,
    userId: 1,
    title: "Mess Manager Bkash No.",
    content: "==Apon (01812345678)==\n- Send room rent before 5th of every month\n- Meal deposit: 1000tk\n[x] June mess seat paid\n[ ] July meal deposit paid",
    createdAt: "2026-07-01",
    textAlign: "left",
    fontSize: 14
  },
  {
    id: 2,
    userId: 1,
    title: "Pending Tuition Bills",
    content: "**Class 9 student (Jihad's reference)**\n- June tuition fee: 3000tk pending\n- Talk with guardian next Friday\n[ ] Collect June salary",
    createdAt: "2026-06-28",
    textAlign: "left",
    fontSize: 14
  },
  {
    id: 3,
    userId: 1,
    title: "Semester Books Budget",
    content: "Need to buy 6th Semester books set (expected 900tk) and drafting materials next month.\n[ ] Purchase drafting sheets\n[ ] Buy T-Square bag",
    createdAt: "2026-06-25",
    textAlign: "left",
    fontSize: 14
  }
];

export function usePersonalBudget() {
  return useQuery<PersonalBudget, Error>({
    queryKey: ['personalBudget'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/personal/budget`, { headers });
        return response.data;
      } catch (err) {
        return mockBudget;
      }
    }
  });
}

export function usePersonalExpenses() {
  return useQuery<PersonalTransaction[], Error>({
    queryKey: ['personalExpenses'],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/personal/expenses`, { headers });
        return response.data;
      } catch (err) {
        return mockTransactions;
      }
    }
  });
}

export function useAddPersonalTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTx: Omit<PersonalTransaction, 'id' | 'userId'>) => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_BASE_URL}/personal/expenses`, newTx, { headers });
        return response.data;
      } catch (err) {
        console.warn("API failed, adding mock transaction locally:", (err as any).message);
        const created: PersonalTransaction = {
          id: Math.random(),
          userId: 1,
          ...newTx
        };
        mockTransactions = [created, ...mockTransactions];
        if (newTx.type === 'expense') {
          mockBudget.spentThisMonth += newTx.amount;
        } else {
          mockBudget.incomeThisMonth += newTx.amount;
        }
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['personalBudget'] });
      queryClient.invalidateQueries({ queryKey: ['userContextWidget'] });
    }
  });
}

export function useUpdateBudgetLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLimit: number) => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.patch(`${API_BASE_URL}/personal/budget`, { limit: newLimit }, { headers });
        return response.data;
      } catch (err) {
        console.warn("API failed, updating mock budget locally:", (err as any).message);
        mockBudget.monthlyLimit = newLimit;
        return mockBudget;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalBudget'] });
      queryClient.invalidateQueries({ queryKey: ['userContextWidget'] });
    }
  });
}

// ----------------------------------------------------------------------------
// Personal Notes Queries & Mutations (Forced 100% local to bypass query override issues)
// ----------------------------------------------------------------------------

export function usePersonalNotes() {
  return useQuery<PersonalNote[], Error>({
    queryKey: ['personalNotes'],
    queryFn: async () => {
      // Return local state directly to prevent API call overrides
      return [...mockNotes];
    }
  });
}

export function useAddPersonalNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newNote: Omit<PersonalNote, 'id' | 'userId' | 'createdAt'>) => {
      const created: PersonalNote = {
        id: Math.random(),
        userId: 1,
        createdAt: new Date().toISOString().split('T')[0],
        ...newNote
      };
      mockNotes = [created, ...mockNotes];
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
    }
  });
}

export function useUpdatePersonalNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updated: PersonalNote) => {
      mockNotes = mockNotes.map(n => n.id === updated.id ? updated : n);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
    }
  });
}

export function useDeletePersonalNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: number) => {
      mockNotes = mockNotes.filter(n => n.id !== noteId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
    }
  });
}
