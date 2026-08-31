import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Share, Modal, Platform } from 'react-native';
import Animated, { FadeInUp, FadeIn, Layout, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';
import { 
  useMessSummary, 
  useSearchMess, 
  useCreateMess, 
  useJoinMess, 
  useRecordMeals, 
  useMealsSheet, 
  useBazaarSchedule, 
  useAssignBazaarDuties, 
  useAddBazaarExpense, 
  useUpdateBazaarExpense, 
  usePendingExpenses, 
  useApproveBazaarExpense, 
  useTransferManager, 
  useAddDeposit,
  useMessExpenses
} from '../hooks/useMessData';

// Reanimated skeleton loader
function SkeletonCard() {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })),
      -1,
      true
    );
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={shimmerStyle} className="w-full bg-slate-200 dark:bg-slate-800 rounded-3xl p-5 mb-4 h-32" />;
}

interface MessDashboardProps {
  messId: number;
}

export default function MessDashboard({ messId: initialMessId }: MessDashboardProps) {
  const currentUser = useAuthStore(state => state.user);
  const [activeMessId, setActiveMessId] = useState(initialMessId);

  // If no mess joined initially
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: isSearching } = useSearchMess(searchQuery);
  const createMessMutation = useCreateMess();
  const joinMessMutation = useJoinMess();

  // Create Mess Form States
  const [newMessName, setNewMessName] = useState('');
  const [newMessHandle, setNewMessHandle] = useState('');

  // Main Dashboard Queries (only enabled if activeMessId > 0)
  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useMessSummary(activeMessId);
  const { data: expensesList } = useMessExpenses(activeMessId);
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const { data: bazaarSchedule, refetch: refetchSchedule } = useBazaarSchedule(activeMessId, currentMonthStr);
  const { data: mealsSheet, refetch: refetchMealsSheet } = useMealsSheet(activeMessId, currentMonthStr);
  const { data: pendingExpenses, refetch: refetchPending } = usePendingExpenses(activeMessId);

  // Mutations
  const recordMealsMutation = useRecordMeals();
  const assignBazaarMutation = useAssignBazaarDuties();
  const addExpenseMutation = useAddBazaarExpense();
  const updateExpenseMutation = useUpdateBazaarExpense();
  const approveExpenseMutation = useApproveBazaarExpense();
  const transferManagerMutation = useTransferManager();
  const addDepositMutation = useAddDeposit();

  // Navigation tabs inside Mess
  type Tab = 'home' | 'mealsheet' | 'schedule' | 'pending' | 'admin';
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Input states
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);

  // Deposit input states
  const [depositAmount, setDepositAmount] = useState('');
  const [depositUserId, setDepositUserId] = useState<number | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Meal sheet editing states (Manager only)
  const [editingMealDate, setEditingMealDate] = useState<string | null>(null);
  const [mealInputs, setMealInputs] = useState<{ [userId: number]: string }>({});

  // Bazaar Schedule planning states (Manager only)
  const [selectedPlannerDate, setSelectedPlannerDate] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<number>(0);

  // Manager transfer state
  const [transferTargetId, setTransferTargetId] = useState<number>(0);

  useEffect(() => {
    if (initialMessId > 0) {
      setActiveMessId(initialMessId);
    }
  }, [initialMessId]);

  if (activeMessId === 0) {
    // ==========================================================================
    // RENDER: JOIN / CREATE MESS PAGE
    // ==========================================================================
    const handleCreateMess = () => {
      if (!newMessName.trim() || !newMessHandle.trim()) {
        Alert.alert('Required Fields', 'Please enter Mess Name and Handle.');
        return;
      }
      createMessMutation.mutate({
        name: newMessName.trim(),
        handle: newMessHandle.trim()
      }, {
        onSuccess: (data) => {
          Alert.alert('Success', 'Mess created successfully!');
          if (data.mess && data.mess.id) {
            setActiveMessId(data.mess.id);
          }
        },
        onError: (err: any) => {
          Alert.alert('Failed', err.response?.data?.error || 'Failed to create mess.');
        }
      });
    };

    const handleJoinMess = (codeOrHandle: string) => {
      joinMessMutation.mutate({
        code_or_handle: codeOrHandle
      }, {
        onSuccess: () => {
          Alert.alert('Success', 'Join request submitted! Please wait for the manager to approve.');
          setSearchQuery('');
        },
        onError: (err: any) => {
          Alert.alert('Failed', err.response?.data?.error || 'Failed to join mess.');
        }
      });
    };

    return (
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 bg-slate-50 dark:bg-slate-955 p-5">
        
        {/* Search Mess */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-3xl shadow-sm mb-5">
          <Text className="text-slate-900 dark:text-white text-sm font-extrabold mb-3">Join a Mess</Text>
          <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center mb-4">
            <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Enter mess name or @handle..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
            />
          </View>

          {isSearching && <ActivityIndicator color="#0D9488" className="my-2" />}

          {searchResults && searchResults.length > 0 ? (
            <View className="border-t border-slate-100 dark:border-slate-800 pt-2">
              {searchResults.map((m: any) => (
                <View key={m.id} className="flex-row justify-between items-center py-3 border-b border-slate-50 dark:border-slate-850">
                  <View className="flex-1 pr-3">
                    <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">{m.name}</Text>
                    <Text className="text-slate-400 text-[10px] mt-0.5">{m.handle} • {m.member_count} members</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleJoinMess(m.handle)}
                    className="bg-teal-600 px-3 py-1.5 rounded-lg"
                  >
                    <Text className="text-white text-[10px] font-extrabold">Send Request</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : searchQuery.length > 1 ? (
            <Text className="text-slate-400 text-center text-xs my-2">No matches found. Try `@handle`.</Text>
          ) : null}
        </Animated.View>

        {/* Create Mess */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-3xl shadow-sm mb-10">
          <Text className="text-slate-900 dark:text-white text-sm font-extrabold mb-4">Create New Mess</Text>
          
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Mess Name *</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="home-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
              <TextInput
                placeholder="e.g. Engineers Mess"
                placeholderTextColor="#94A3B8"
                value={newMessName}
                onChangeText={setNewMessName}
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Unique Handle *</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="at-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
              <TextInput
                placeholder="e.g. engineers_mess"
                placeholderTextColor="#94A3B8"
                value={newMessHandle}
                onChangeText={setNewMessHandle}
                autoCapitalize="none"
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleCreateMess}
            disabled={createMessMutation.isPending}
            className="w-full bg-teal-600 py-3.5 rounded-xl justify-center items-center"
          >
            {createMessMutation.isPending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white text-xs font-extrabold uppercase tracking-wider">Create Mess</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    );
  }

  // Loading skeleton
  if (isSummaryLoading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-955 p-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (!summary) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-955 p-5">
        <Text className="text-slate-500 font-extrabold">Failed to load Mess details.</Text>
      </View>
    );
  }

  const isManager = summary.userRole === 'manager';
  const myStanding = summary.membersSummary.find(m => m.userId === currentUser?.id);
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Get who is doing bazaar today & tomorrow
  const todayBazaar = bazaarSchedule?.filter(s => s.bazaarDate === todayDateStr) || [];
  const tomorrowBazaar = bazaarSchedule?.filter(s => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return s.bazaarDate === tom.toISOString().split('T')[0];
  }) || [];

  const isAssignedToday = todayBazaar.some(s => s.userId === currentUser?.id);

  // Handle Bazaar Expense Submit / Edit
  const handleSubmitExpense = () => {
    if (!expenseTitle.trim() || !expenseAmount.trim()) {
      Alert.alert('Required Fields', 'Please fill in details.');
      return;
    }
    const amountVal = parseFloat(expenseAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (editingExpenseId) {
      updateExpenseMutation.mutate({
        messId: activeMessId,
        expenseId: editingExpenseId,
        title: expenseTitle.trim(),
        amount: amountVal,
        category: 'bazaar',
        expenseDate
      }, {
        onSuccess: (data) => {
          Alert.alert('Success', data.message || 'Expense updated successfully.');
          setShowExpenseModal(false);
          setEditingExpenseId(null);
          setExpenseTitle('');
          setExpenseAmount('');
          refetchSummary();
        },
        onError: (err: any) => {
          Alert.alert('Failed', err.response?.data?.error || 'Failed to update.');
        }
      });
    } else {
      addExpenseMutation.mutate({
        messId: activeMessId,
        title: expenseTitle.trim(),
        amount: amountVal,
        category: 'bazaar',
        expenseDate
      }, {
        onSuccess: (data) => {
          Alert.alert('Success', data.message || 'Expense submitted.');
          setShowExpenseModal(false);
          setExpenseTitle('');
          setExpenseAmount('');
          refetchSummary();
        },
        onError: (err: any) => {
          Alert.alert('Failed', err.response?.data?.error || 'Failed to submit.');
        }
      });
    }
  };

  // Handle Deposit Log
  const handleAddDeposit = () => {
    if (!depositAmount || !depositUserId) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const amountVal = parseFloat(depositAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      Alert.alert('Error', 'Invalid amount.');
      return;
    }

    addDepositMutation.mutate({
      messId: activeMessId,
      userId: depositUserId,
      amount: amountVal,
      depositDate: new Date().toISOString().split('T')[0]
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Deposit recorded successfully.');
        setShowDepositModal(false);
        setDepositAmount('');
        refetchSummary();
      },
      onError: (err: any) => {
        Alert.alert('Failed', err.response?.data?.error || 'Failed to record.');
      }
    });
  };

  // Handle Bazaar schedule assignment
  const handleAssignBazaar = () => {
    if (!selectedPlannerDate || !assignedUserId) return;

    assignBazaarMutation.mutate({
      messId: activeMessId,
      assignments: [{ userId: assignedUserId, bazaarDate: selectedPlannerDate }]
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Duty assigned successfully!');
        setSelectedPlannerDate(null);
        setAssignedUserId(0);
        refetchSchedule();
      },
      onError: (err: any) => {
        Alert.alert('Failed', err.response?.data?.error || 'Failed to assign.');
      }
    });
  };

  // Handle Batch Meals Save
  const handleSaveMeals = () => {
    if (!editingMealDate) return;
    const mealsPayload = Object.keys(mealInputs).map(uid => ({
      userId: parseInt(uid),
      mealDate: editingMealDate,
      mealCount: parseFloat(mealInputs[parseInt(uid)] || '0')
    }));

    recordMealsMutation.mutate({
      messId: activeMessId,
      meals: mealsPayload
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Daily meals recorded.');
        setEditingMealDate(null);
        setMealInputs({});
        refetchSummary();
        refetchMealsSheet();
      },
      onError: (err: any) => {
        Alert.alert('Failed', err.response?.data?.error || 'Failed to record.');
      }
    });
  };

  // Handle Expense Approval
  const handleApproveExpense = (id: number, status: 'approved' | 'rejected') => {
    approveExpenseMutation.mutate({
      messId: activeMessId,
      expenseId: id,
      status
    }, {
      onSuccess: () => {
        Alert.alert('Success', `Expense request ${status}.`);
        refetchSummary();
        refetchPending();
      }
    });
  };

  // Handle Transfer Management
  const handleTransferManager = () => {
    if (!transferTargetId) {
      Alert.alert('Error', 'Please select a member.');
      return;
    }
    Alert.alert(
      'Confirm Transfer',
      'Are you sure you want to transfer Mess Management responsibility to this member? You will lose manager privileges.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Transfer', 
          style: 'destructive',
          onPress: () => {
            transferManagerMutation.mutate({
              messId: activeMessId,
              newManagerId: transferTargetId
            }, {
              onSuccess: () => {
                Alert.alert('Success', 'Management transferred!');
                refetchSummary();
                setActiveTab('home');
              },
              onError: (err: any) => {
                Alert.alert('Failed', err.response?.data?.error || 'Failed to transfer.');
              }
            });
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-955">
      
      {/* 1. Header Details Info Card */}
      <View className="mx-4 mt-4 bg-teal-600 dark:bg-teal-900 rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <View className="absolute right-[-10] top-[-10] w-24 h-24 rounded-full bg-white/5" />
        
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-teal-200 text-[9px] font-extrabold uppercase tracking-widest">Active Mess</Text>
            <Text className="text-white text-lg font-extrabold tracking-tight mt-0.5">{summary.messName}</Text>
            <Text className="text-teal-100 text-[10px] font-bold mt-0.5">{summary.handle}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => Share.share({ message: `Join our PolyMate Mess! Code: ${summary.joinCode} or handle: ${summary.handle}` })}
            className="w-8 h-8 rounded-xl bg-white/15 justify-center items-center"
          >
            <Ionicons name="share-social-outline" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stands Widget */}
        {myStanding && (
          <View className="flex-row justify-between border-t border-white/20 pt-3 mt-1">
            <View>
              <Text className="text-teal-200 text-[8px] font-bold uppercase">Allocated Cost</Text>
              <Text className="text-white text-sm font-extrabold mt-0.5">৳ {myStanding.allocatedExpense}</Text>
            </View>
            <View className="items-end">
              <Text className="text-teal-200 text-[8px] font-bold uppercase">Net Standing</Text>
              <Text className={`text-sm font-extrabold mt-0.5 ${myStanding.balance >= 0 ? 'text-teal-100' : 'text-rose-200'}`}>
                {myStanding.balance >= 0 ? `+ ৳ ${myStanding.balance}` : `- ৳ ${Math.abs(myStanding.balance)}`}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 2. Horizontal Navigation Tabs */}
      <View className="px-4 mt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <TouchableOpacity 
            onPress={() => setActiveTab('home')} 
            className={`px-4 py-2.5 rounded-xl mr-2 flex-row items-center border ${activeTab === 'home' ? 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-900' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}
          >
            <Ionicons name="grid-outline" size={14} color={activeTab === 'home' ? '#0D9488' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text className={`text-xs font-bold ${activeTab === 'home' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setActiveTab('mealsheet')} 
            className={`px-4 py-2.5 rounded-xl mr-2 flex-row items-center border ${activeTab === 'mealsheet' ? 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-900' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}
          >
            <Ionicons name="list-outline" size={14} color={activeTab === 'mealsheet' ? '#0D9488' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text className={`text-xs font-bold ${activeTab === 'mealsheet' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}>Meal Sheet</Text>
          </TouchableOpacity>

          {isManager && (
            <>
              <TouchableOpacity 
                onPress={() => setActiveTab('schedule')} 
                className={`px-4 py-2.5 rounded-xl mr-2 flex-row items-center border ${activeTab === 'schedule' ? 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-900' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}
              >
                <Ionicons name="calendar-outline" size={14} color={activeTab === 'schedule' ? '#0D9488' : '#94A3B8'} style={{ marginRight: 6 }} />
                <Text className={`text-xs font-bold ${activeTab === 'schedule' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}>Bazaar Planner</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setActiveTab('pending')} 
                className={`px-4 py-2.5 rounded-xl mr-2 flex-row items-center border ${activeTab === 'pending' ? 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-900' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}
              >
                <Ionicons name="checkmark-done-outline" size={14} color={activeTab === 'pending' ? '#0D9488' : '#94A3B8'} style={{ marginRight: 6 }} />
                {pendingExpenses && pendingExpenses.length > 0 && (
                  <View className="bg-rose-500 w-2 h-2 rounded-full absolute top-2 right-1.5" />
                )}
                <Text className={`text-xs font-bold ${activeTab === 'pending' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}>Approvals</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setActiveTab('admin')} 
                className={`px-4 py-2.5 rounded-xl mr-2 flex-row items-center border ${activeTab === 'admin' ? 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-900' : 'bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}
              >
                <Ionicons name="settings-outline" size={14} color={activeTab === 'admin' ? '#0D9488' : '#94A3B8'} style={{ marginRight: 6 }} />
                <Text className={`text-xs font-bold ${activeTab === 'admin' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}>Admin Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      {/* 3. Main Body Content Switch */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mt-4 px-4 pb-10">
        
        {activeTab === 'home' && (
          // ========================================================================
          // TAB: HOME DASHBOARD
          // ========================================================================
          <Animated.View entering={FadeIn.duration(400)}>
            
            {/* Financial Summary Row */}
            <View className="flex-row justify-between mb-4 gap-2">
              <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-3 items-center">
                <Text className="text-slate-400 text-[8px] font-extrabold uppercase">Total Expense</Text>
                <Text className="text-slate-800 dark:text-white text-sm font-black mt-1">৳ {summary.totalExpenses}</Text>
              </View>
              <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-3 items-center">
                <Text className="text-slate-400 text-[8px] font-extrabold uppercase">Total Meals</Text>
                <Text className="text-slate-800 dark:text-white text-sm font-black mt-1">{summary.totalMeals}</Text>
              </View>
              <View className="flex-1 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-3 items-center">
                <Text className="text-slate-400 text-[8px] font-extrabold uppercase">Meal Rate</Text>
                <Text className="text-teal-600 dark:text-teal-400 text-sm font-black mt-1">৳ {summary.mealRate}</Text>
              </View>
            </View>

            {/* Daily Bazaar Planner display */}
            <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4 mb-4">
              <Text className="text-slate-900 dark:text-white text-xs font-extrabold mb-3 uppercase tracking-wider">🛒 Today's Bazaar Duty</Text>
              
              {todayBazaar.length > 0 ? (
                todayBazaar.map(s => (
                  <View key={s.id} className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 mb-2">
                    <Text className="text-slate-800 dark:text-slate-250 text-xs font-bold">{s.memberName}</Text>
                    {s.notes && <Text className="text-slate-400 text-[10px] italic">{s.notes}</Text>}
                  </View>
                ))
              ) : (
                <Text className="text-slate-400 text-[11px] italic mb-2">No bazaar duty assigned for today.</Text>
              )}

              {/* Tomorrow duty */}
              <View className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-2">Tomorrow's Duty</Text>
                {tomorrowBazaar.length > 0 ? (
                  tomorrowBazaar.map(s => (
                    <Text key={s.id} className="text-slate-700 dark:text-slate-300 text-xs font-bold">• {s.memberName}</Text>
                  ))
                ) : (
                  <Text className="text-slate-400 text-[10px] italic">Not assigned yet.</Text>
                )}
              </View>

              {/* Submit Bazaar Button */}
              {(isAssignedToday || isManager) && (
                <TouchableOpacity
                  onPress={() => { setEditingExpenseId(null); setExpenseTitle(''); setExpenseAmount(''); setShowExpenseModal(true); }}
                  className="bg-teal-600 mt-4 py-3 rounded-xl justify-center items-center flex-row"
                >
                  <Ionicons name="receipt-outline" size={16} color="white" style={{ marginRight: 6 }} />
                  <Text className="text-white text-xs font-bold">Submit Bazaar Receipt</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stands details panel */}
            <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4 mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-slate-900 dark:text-white text-xs font-extrabold uppercase tracking-wider">👥 Members Standings</Text>
                {isManager && (
                  <TouchableOpacity onPress={() => setShowDepositModal(true)} className="bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-150 dark:border-slate-850 flex-row items-center">
                    <Ionicons name="add" size={12} color="#0D9488" style={{ marginRight: 4 }} />
                    <Text className="text-teal-600 dark:text-teal-400 text-[9px] font-extrabold">Log Deposit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {summary.membersSummary.map(m => (
                <View key={m.userId} className="flex-row justify-between items-center py-2.5 border-b border-slate-50 dark:border-slate-850">
                  <View>
                    <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">{m.name}</Text>
                    <Text className="text-slate-400 text-[9px] mt-0.5">Meals: {m.totalMeals} • Deposits: ৳ {m.totalDeposits}</Text>
                  </View>
                  <Text className={`text-xs font-extrabold ${m.balance >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>
                    {m.balance >= 0 ? `+ ৳ ${m.balance}` : `- ৳ ${Math.abs(m.balance)}`}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {activeTab === 'mealsheet' && (
          // ========================================================================
          // TAB: MEAL SHEET GRID
          // ========================================================================
          <Animated.View entering={FadeIn.duration(400)}>
            <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4 mb-4">
              <Text className="text-slate-900 dark:text-white text-xs font-extrabold mb-3 uppercase tracking-wider">📅 Monthly Meals Sheet</Text>
              
              {isManager && (
                <Text className="text-slate-400 text-[9px] mb-3">
                  💡 Tip: Click any date to batch record or edit meal counts. Updates will be logged.
                </Text>
              )}

              {mealsSheet ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    {/* Header Row */}
                    <View className="flex-row border-b border-slate-100 dark:border-slate-800 pb-2">
                      <View className="w-20"><Text className="text-slate-400 text-[9px] font-bold uppercase">Date</Text></View>
                      {mealsSheet.members.map(m => (
                        <View key={m.user_id} className="w-16 items-center">
                          <Text className="text-slate-700 dark:text-slate-350 text-[9px] font-bold text-center" numberOfLines={1}>
                            {m.name.split(' ')[0]}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Sheet Rows (days 1 to 31) */}
                    {Array.from({ length: 31 }, (_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentMonthStr}-${day < 10 ? '0' + day : day}`;
                      
                      return (
                        <TouchableOpacity
                          key={day}
                          disabled={!isManager}
                          onPress={() => {
                            setEditingMealDate(dateStr);
                            const initialInputs: { [uid: number]: string } = {};
                            mealsSheet.members.forEach(m => {
                              const match = mealsSheet.meals.find(ml => ml.user_id === m.user_id && ml.meal_date === dateStr);
                              initialInputs[m.user_id] = match ? match.meal_count.toString() : '0';
                            });
                            setMealInputs(initialInputs);
                          }}
                          className="flex-row py-2 border-b border-slate-50 dark:border-slate-850 items-center active:bg-slate-50 dark:active:bg-slate-950"
                        >
                          <View className="w-20">
                            <Text className="text-slate-550 dark:text-slate-450 text-[10px] font-bold">{dateStr}</Text>
                          </View>
                          {mealsSheet.members.map(m => {
                            const meal = mealsSheet.meals.find(ml => ml.user_id === m.user_id && ml.meal_date === dateStr);
                            return (
                              <View key={m.user_id} className="w-16 items-center">
                                <Text className="text-slate-800 dark:text-slate-200 text-xs font-black">
                                  {meal ? meal.meal_count : '-'}
                                </Text>
                              </View>
                            );
                          })}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : (
                <ActivityIndicator color="#0D9488" />
              )}
            </View>

            {/* Meal update logs */}
            {mealsSheet && mealsSheet.logs && mealsSheet.logs.length > 0 && (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4 mb-4">
                <Text className="text-slate-500 text-[10px] font-extrabold uppercase mb-3">🛠️ Meal Modification Logs</Text>
                {mealsSheet.logs.map((l, index) => (
                  <View key={index} className="py-2 border-b border-slate-50 dark:border-slate-850">
                    <Text className="text-slate-700 dark:text-slate-350 text-[10px] font-bold">
                      {l.changerName} modified meals on {l.mealDate}:
                    </Text>
                    <Text className="text-slate-400 text-[9px] mt-0.5">
                      Old count: {l.oldCount} ➔ New count: {l.newCount} ({new Date(l.loggedAt).toLocaleTimeString()})
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'schedule' && (
          // ========================================================================
          // TAB: BAZAAR PLANNER
          // ========================================================================
          <Animated.View entering={FadeIn.duration(400)}>
            <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4 mb-4">
              <Text className="text-slate-900 dark:text-white text-xs font-extrabold mb-3 uppercase tracking-wider">📅 Monthly Duty Assignments</Text>
              <Text className="text-slate-400 text-[9px] mb-3">Click any date to schedule a member for bazaar duty.</Text>

              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const dateStr = `${currentMonthStr}-${day < 10 ? '0' + day : day}`;
                const match = bazaarSchedule?.find(s => s.bazaarDate === dateStr);

                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => {
                      setSelectedPlannerDate(dateStr);
                      setAssignedUserId(match ? match.userId : 0);
                    }}
                    className="flex-row justify-between items-center py-3 border-b border-slate-50 dark:border-slate-850 active:bg-slate-50 dark:active:bg-slate-950"
                  >
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-bold">{dateStr}</Text>
                    <View className="flex-row items-center">
                      <Text className={`text-xs font-extrabold mr-2 ${match ? 'text-teal-600' : 'text-slate-400'}`}>
                        {match ? match.memberName : 'Unassigned'}
                      </Text>
                      <Ionicons name="create-outline" size={14} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {activeTab === 'pending' && (
          // ========================================================================
          // TAB: PENDING APPROVALS
          // ========================================================================
          <Animated.View entering={FadeIn.duration(400)}>
            <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-4 mb-4">
              <Text className="text-slate-900 dark:text-white text-xs font-extrabold mb-3 uppercase tracking-wider">📝 Pending Expense Approvals</Text>

              {pendingExpenses && pendingExpenses.length > 0 ? (
                pendingExpenses.map(p => (
                  <View key={p.id} className="py-3.5 border-b border-slate-50 dark:border-slate-850">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <Text className="text-slate-800 dark:text-slate-200 text-xs font-extrabold">{p.title}</Text>
                        <Text className="text-slate-400 text-[10px] mt-0.5">Submitted by {p.member_name} for {p.expenseDate}</Text>
                      </View>
                      <Text className="text-teal-600 dark:text-teal-400 text-sm font-black">৳ {p.amount}</Text>
                    </View>

                    {/* Approve/Reject Actions */}
                    <View className="flex-row gap-2 mt-3.5">
                      <TouchableOpacity
                        onPress={() => handleApproveExpense(p.id, 'approved')}
                        className="flex-1 bg-teal-600 py-2 rounded-xl justify-center items-center"
                      >
                        <Text className="text-white text-[10px] font-extrabold uppercase">Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleApproveExpense(p.id, 'rejected')}
                        className="flex-1 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 py-2 rounded-xl justify-center items-center"
                      >
                        <Text className="text-rose-600 text-[10px] font-extrabold uppercase">Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text className="text-slate-400 text-center text-xs my-4">No pending approvals found.</Text>
              )}
            </View>
          </Animated.View>
        )}

        {activeTab === 'admin' && (
          // ========================================================================
          // TAB: ADMIN SETTINGS
          // ========================================================================
          <Animated.View entering={FadeIn.duration(400)}>
            
            {/* Transfer Manager */}
            <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 mb-5 shadow-sm">
              <Text className="text-slate-900 dark:text-white text-xs font-extrabold mb-2 uppercase tracking-wide">👑 Transfer Management Role</Text>
              <Text className="text-slate-400 text-[9px] mb-4">Choose another active member to transfer manager role to for next month.</Text>

              {/* Members dropdown simulation */}
              <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1 px-1 flex-row mb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {summary.membersSummary.filter(m => m.userId !== currentUser?.id).map(m => (
                    <TouchableOpacity
                      key={m.userId}
                      onPress={() => setTransferTargetId(m.userId)}
                      className="px-3.5 py-2.5 rounded-lg mx-1"
                      style={{
                        backgroundColor: transferTargetId === m.userId ? '#0D9488' : '#F1F5F9'
                      }}
                    >
                      <Text className={`text-[10px] font-extrabold ${transferTargetId === m.userId ? 'text-white' : 'text-slate-500'}`}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                onPress={handleTransferManager}
                className="w-full bg-teal-600 py-3.5 rounded-xl justify-center items-center"
              >
                <Text className="text-white text-xs font-extrabold uppercase tracking-wide">Confirm Transfer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

      </ScrollView>

      {/* ==========================================================================
          MODAL: SUBMIT / EDIT BAZAAR EXPENSE
          ========================================================================== */}
      <Modal visible={showExpenseModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-10 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-slate-900 dark:text-white text-sm font-extrabold">Submit Bazaar Cost</Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Expense Title *</Text>
              <TextInput
                placeholder="e.g. Potato, Onion, Rice"
                placeholderTextColor="#94A3B8"
                value={expenseTitle}
                onChangeText={setExpenseTitle}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            <View className="mb-6">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Cost Amount (৳) *</Text>
              <TextInput
                placeholder="e.g. 750"
                placeholderTextColor="#94A3B8"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                keyboardType="numeric"
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmitExpense}
              className="w-full bg-teal-600 py-3.5 rounded-xl justify-center items-center"
            >
              <Text className="text-white text-xs font-extrabold uppercase tracking-wide">Submit Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================================================
          MODAL: RECORD DAILY MEALS (MANAGER BATCH VIEW)
          ========================================================================== */}
      <Modal visible={editingMealDate !== null} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-10 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-slate-900 dark:text-white text-sm font-extrabold">Record Daily Meals</Text>
                <Text className="text-slate-400 text-[10px] mt-0.5">Date: {editingMealDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingMealDate(null)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-5 max-h-[60%]">
              {summary.membersSummary.map(m => (
                <View key={m.userId} className="flex-row items-center justify-between py-3 border-b border-slate-50 dark:border-slate-850">
                  <Text className="text-slate-800 dark:text-slate-250 text-xs font-extrabold flex-1 pr-3">{m.name}</Text>
                  <TextInput
                    value={mealInputs[m.userId] || '0'}
                    onChangeText={text => setMealInputs({ ...mealInputs, [m.userId]: text })}
                    keyboardType="numeric"
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-3 py-1.5 rounded-lg text-slate-800 dark:text-white text-center text-xs font-bold w-16"
                  />
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveMeals}
              className="w-full bg-teal-600 py-3.5 rounded-xl justify-center items-center"
            >
              <Text className="text-white text-xs font-extrabold uppercase tracking-wide">Save Meals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================================================
          MODAL: ASSIGN BAZAAR PLANNER DATE
          ========================================================================== */}
      <Modal visible={selectedPlannerDate !== null} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-10 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-slate-900 dark:text-white text-sm font-extrabold">Assign Bazaar Duty</Text>
                <Text className="text-slate-400 text-[10px] mt-0.5">Date: {selectedPlannerDate}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPlannerDate(null)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-2">Select Member</Text>
            <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1 px-1 flex-row mb-6">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {summary.membersSummary.map(m => (
                  <TouchableOpacity
                    key={m.userId}
                    onPress={() => setAssignedUserId(m.userId)}
                    className="px-3.5 py-2.5 rounded-lg mx-1"
                    style={{
                      backgroundColor: assignedUserId === m.userId ? '#0D9488' : '#F1F5F9'
                    }}
                  >
                    <Text className={`text-[10px] font-extrabold ${assignedUserId === m.userId ? 'text-white' : 'text-slate-500'}`}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={handleAssignBazaar}
              className="w-full bg-teal-600 py-3.5 rounded-xl justify-center items-center"
            >
              <Text className="text-white text-xs font-extrabold uppercase tracking-wide">Assign Duty</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================================================
          MODAL: RECORD MEMBER DEPOSIT
          ========================================================================== */}
      <Modal visible={showDepositModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-10 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-slate-900 dark:text-white text-sm font-extrabold">Log Member Deposit</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-2">Choose Member</Text>
            <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1 px-1 flex-row mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {summary.membersSummary.map(m => (
                  <TouchableOpacity
                    key={m.userId}
                    onPress={() => setDepositUserId(m.userId)}
                    className="px-3.5 py-2.5 rounded-lg mx-1"
                    style={{
                      backgroundColor: depositUserId === m.userId ? '#0D9488' : '#F1F5F9'
                    }}
                  >
                    <Text className={`text-[10px] font-extrabold ${depositUserId === m.userId ? 'text-white' : 'text-slate-500'}`}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="mb-6">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Deposit Amount (৳) *</Text>
              <TextInput
                placeholder="e.g. 2000"
                placeholderTextColor="#94A3B8"
                value={depositAmount}
                onChangeText={setDepositAmount}
                keyboardType="numeric"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-slate-850 dark:text-white text-xs font-semibold"
              />
            </View>

            <TouchableOpacity
              onPress={handleAddDeposit}
              className="w-full bg-teal-600 py-3.5 rounded-xl justify-center items-center"
            >
              <Text className="text-white text-xs font-extrabold uppercase tracking-wide">Record Deposit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
