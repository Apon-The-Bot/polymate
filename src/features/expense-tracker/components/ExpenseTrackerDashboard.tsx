import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { usePersonalExpenses, usePersonalBudget, useAddPersonalTransaction, useUpdateBudgetLimit, usePersonalNotes, useAddPersonalNote, useUpdatePersonalNote, useDeletePersonalNote } from '../hooks/useExpenseData';
import { PersonalTransaction, PersonalNote } from '../types';

const EXPENSE_CATEGORIES: { value: PersonalTransaction['category']; label: string; icon: string; bg: string; color: string; border: string }[] = [
  { value: 'food', label: 'Food & Meals', icon: 'restaurant-sharp', bg: 'bg-orange-50 dark:bg-orange-950/20', color: '#EA580C', border: 'border-orange-100 dark:border-orange-900/30' },
  { value: 'study', label: 'Study & Books', icon: 'book-sharp', bg: 'bg-blue-50 dark:bg-blue-955/20', color: '#2563EB', border: 'border-blue-100 dark:border-blue-900/30' },
  { value: 'travel', label: 'Travel / Transport', icon: 'bus-sharp', bg: 'bg-teal-50 dark:bg-teal-955/20', color: '#0D9488', border: 'border-teal-100 dark:border-teal-900/30' },
  { value: 'rent', label: 'Mess Rent', icon: 'home-sharp', bg: 'bg-purple-50 dark:bg-purple-955/20', color: '#7C3AED', border: 'border-purple-100 dark:border-purple-900/30' },
  { value: 'others', label: 'Others', icon: 'cart-sharp', bg: 'bg-slate-100 dark:bg-slate-800/40', color: '#64748B', border: 'border-slate-200/20 dark:border-slate-800/60' }
];

const INCOME_CATEGORIES: { value: PersonalTransaction['category']; label: string; icon: string; bg: string; color: string; border: string }[] = [
  { value: 'pocket_money', label: 'Pocket Money', icon: 'wallet-sharp', bg: 'bg-emerald-50 dark:bg-emerald-955/20', color: '#059669', border: 'border-emerald-100 dark:border-emerald-900/30' },
  { value: 'tuition', label: 'Tuition Salary', icon: 'cash-sharp', bg: 'bg-teal-50 dark:bg-teal-955/20', color: '#0D9488', border: 'border-teal-100 dark:border-teal-900/30' },
  { value: 'scholarship', label: 'Scholarship', icon: 'ribbon-sharp', bg: 'bg-amber-50 dark:bg-amber-955/20', color: '#D97706', border: 'border-amber-100 dark:border-amber-900/30' },
  { value: 'others', label: 'Others', icon: 'gift-sharp', bg: 'bg-slate-100 dark:bg-slate-800/40', color: '#64748B', border: 'border-slate-200/20 dark:border-slate-800/60' }
];

const NOTE_COLORS = [
  { bg: 'bg-amber-50/70 dark:bg-amber-955/15', border: 'border-amber-100 dark:border-amber-900/30', text: 'text-amber-800 dark:text-amber-300' },
  { bg: 'bg-blue-50/70 dark:bg-blue-955/15', border: 'border-blue-100 dark:border-blue-900/30', text: 'text-blue-800 dark:text-blue-300' },
  { bg: 'bg-teal-50/70 dark:bg-teal-955/15', border: 'border-teal-100 dark:border-teal-900/30', text: 'text-teal-800 dark:text-teal-300' },
];

export default function ExpenseTrackerDashboard() {
  const { data: budget } = usePersonalBudget();
  const { data: transactions = [] } = usePersonalExpenses();
  const { data: notes = [] } = usePersonalNotes();

  const addTransactionMutation = useAddPersonalTransaction();
  const updateBudgetMutation = useUpdateBudgetLimit();
  const addNoteMutation = useAddPersonalNote();
  const updateNoteMutation = useUpdatePersonalNote();
  const deleteNoteMutation = useDeletePersonalNote();

  // Screen Tab Selection
  const [activeTab, setActiveTab] = useState<'tx' | 'notes'>('tx');

  // Create Transaction Modal Form
  const [isTxModalVisible, setIsTxModalVisible] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<PersonalTransaction['category']>('food');
  const [txNotes, setTxNotes] = useState('');
  const [txDetails, setTxDetails] = useState('');

  // Update Budget Modal Form
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  // Create Note Fullscreen Form
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  // Selection state to control TextInput selection prop programmatically
  const [editorSelection, setEditorSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorAlignment, setEditorAlignment] = useState<'left' | 'center' | 'right'>('left');

  const editorInputRef = useRef<TextInput>(null);

  // Filter States
  const [selectedFilterType, setSelectedFilterType] = useState<'all' | 'expense' | 'income'>('all');

  const filteredTransactions = transactions.filter(item => {
    return selectedFilterType === 'all' || item.type === selectedFilterType;
  });

  const getCategoryInfo = (category: string, type: 'expense' | 'income') => {
    const list = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const found = list.find(c => c.value === category);
    return found || EXPENSE_CATEGORIES[4];
  };

  const handleAddTransaction = () => {
    if (!txTitle || !txAmount) {
      Alert.alert('Validation Error', 'Please fill in Title and Amount fields.');
      return;
    }

    const amtNum = parseFloat(txAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount greater than zero.');
      return;
    }

    let finalNotes = txNotes;
    if (txCategory === 'others' && txDetails) {
      finalNotes = txDetails;
    }

    addTransactionMutation.mutate({
      title: txTitle,
      amount: amtNum,
      type: txType,
      category: txCategory,
      expenseDate: new Date().toISOString().split('T')[0],
      notes: finalNotes || undefined
    }, {
      onSuccess: () => {
        setTxTitle('');
        setTxAmount('');
        setTxCategory('food');
        setTxNotes('');
        setTxDetails('');
        setIsTxModalVisible(false);
        Alert.alert('Success', 'Transaction recorded successfully.');
      }
    });
  };

  const handleUpdateBudget = () => {
    if (!newBudgetLimit) {
      Alert.alert('Validation Error', 'Please enter a budget limit.');
      return;
    }

    const limitNum = parseFloat(newBudgetLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid budget limit.');
      return;
    }

    updateBudgetMutation.mutate(limitNum, {
      onSuccess: () => {
        setNewBudgetLimit('');
        setIsBudgetModalVisible(false);
        Alert.alert('Success', 'Monthly budget limit updated.');
      }
    });
  };

  const handleAddNote = () => {
    if (!noteTitle || !noteContent) {
      Alert.alert('Validation Error', 'Please fill in both Title and Content fields.');
      return;
    }

    addNoteMutation.mutate({
      title: noteTitle,
      content: noteContent,
      textAlign: editorAlignment,
      fontSize: editorFontSize
    }, {
      onSuccess: () => {
        setNoteTitle('');
        setNoteContent('');
        setEditorSelection({ start: 0, end: 0 });
        setIsNoteModalVisible(false);
        Alert.alert('Success', 'Sticky note added successfully.');
      }
    });
  };

  const handleDeleteNote = (noteId: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this sticky note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteNoteMutation.mutate(noteId)
        }
      ]
    );
  };

  // Helper to toggle checkbox item directly from the sticky note card
  const handleToggleChecklistItem = (note: PersonalNote, lineIndex: number) => {
    const lines = note.content.split('\n');
    const targetLine = lines[lineIndex].trim();
    
    if (targetLine.startsWith('[ ]')) {
      lines[lineIndex] = lines[lineIndex].replace('[ ]', '[x]');
    } else if (targetLine.startsWith('[x]')) {
      lines[lineIndex] = lines[lineIndex].replace('[x]', '[ ]');
    }

    const updated: PersonalNote = {
      ...note,
      content: lines.join('\n')
    };

    updateNoteMutation.mutate(updated);
  };

  // Helper to insert formatting tags at current selection
  const insertFormatting = (tagStart: string, tagEnd: string = '') => {
    const start = editorSelection.start;
    const end = editorSelection.end;
    
    const selectedText = noteContent.substring(start, end);
    const replacement = tagStart + (selectedText || "") + tagEnd;
    
    const newContent = noteContent.substring(0, start) + replacement + noteContent.substring(end);
    setNoteContent(newContent);

    // Reposition cursor and refocus textinput programmatically
    const newCursor = start + tagStart.length + (selectedText ? selectedText.length : 0);
    setEditorSelection({ start: newCursor, end: newCursor });

    setTimeout(() => {
      editorInputRef.current?.focus();
    }, 60);
  };

  // Custom text decorator parser
  const renderFormattedText = (text: string, baseStyle: any) => {
    let parts: { text: string; bold?: boolean; italic?: boolean; underline?: boolean; highlight?: boolean }[] = [{ text }];

    // 1. Process Bold (**)
    let tempParts: typeof parts = [];
    parts.forEach(part => {
      if (part.bold || part.italic || part.underline || part.highlight) {
        tempParts.push(part);
        return;
      }
      const regex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(part.text)) !== null) {
        if (match.index > lastIndex) {
          tempParts.push({ text: part.text.substring(lastIndex, match.index) });
        }
        tempParts.push({ text: match[1], bold: true });
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < part.text.length) {
        tempParts.push({ text: part.text.substring(lastIndex) });
      }
    });
    parts = tempParts;

    // 2. Process Highlight (==)
    tempParts = [];
    parts.forEach(part => {
      if (part.bold || part.italic || part.underline || part.highlight) {
        tempParts.push(part);
        return;
      }
      const regex = /\=\=(.*?)\=\=/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(part.text)) !== null) {
        if (match.index > lastIndex) {
          tempParts.push({ text: part.text.substring(lastIndex, match.index) });
        }
        tempParts.push({ text: match[1], highlight: true });
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < part.text.length) {
        tempParts.push({ text: part.text.substring(lastIndex) });
      }
    });
    parts = tempParts;

    // 3. Process Underline (__)
    tempParts = [];
    parts.forEach(part => {
      if (part.bold || part.italic || part.underline || part.highlight) {
        tempParts.push(part);
        return;
      }
      const regex = /\_\_(.*?)\_\_/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(part.text)) !== null) {
        if (match.index > lastIndex) {
          tempParts.push({ text: part.text.substring(lastIndex, match.index) });
        }
        tempParts.push({ text: match[1], underline: true });
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < part.text.length) {
        tempParts.push({ text: part.text.substring(lastIndex) });
      }
    });
    parts = tempParts;

    // 4. Process Italic (*)
    tempParts = [];
    parts.forEach(part => {
      if (part.bold || part.italic || part.underline || part.highlight) {
        tempParts.push(part);
        return;
      }
      const regex = /\*(.*?)\*/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(part.text)) !== null) {
        if (match.index > lastIndex) {
          tempParts.push({ text: part.text.substring(lastIndex, match.index) });
        }
        tempParts.push({ text: match[1], italic: true });
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < part.text.length) {
        tempParts.push({ text: part.text.substring(lastIndex) });
      }
    });
    parts = tempParts;

    return parts.map((part, idx) => {
      const style: any = { ...baseStyle };
      if (part.bold) style.fontWeight = 'bold';
      if (part.italic) style.fontStyle = 'italic';
      if (part.underline) style.textDecorationLine = 'underline';
      if (part.highlight) {
        style.backgroundColor = '#FEF08A'; // Tailwind yellow-200
        style.paddingHorizontal = 4;
        style.borderRadius = 4;
      }
      return (
        <Text key={idx} style={style}>
          {part.text}
        </Text>
      );
    });
  };

  // Parses full note line by line supporting bullets and checkboxes
  const renderFormattedContent = (note: PersonalNote) => {
    const lines = note.content.split('\n');
    const baseFontSize = note.fontSize || 14;
    const alignment = note.textAlign || 'left';
    
    const baseStyle: any = {
      fontSize: baseFontSize,
      textAlign: alignment,
      color: '#1E293B',
    };

    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      
      const isChecked = trimmed.startsWith('[x]');
      const isUnchecked = trimmed.startsWith('[ ]');
      
      if (isChecked || isUnchecked) {
        const cleanLine = trimmed.substring(3).trim();
        return (
          <View 
            key={lineIdx} 
            className="flex-row items-center mt-1.5 mb-1" 
            style={{ alignSelf: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start' }}
          >
            <TouchableOpacity 
              onPress={() => handleToggleChecklistItem(note, lineIdx)}
              className="mr-2 p-0.5"
            >
              <Ionicons 
                name={isChecked ? "checkbox" : "square-outline"} 
                size={18} 
                color={isChecked ? "#0D9488" : "#64748B"} 
              />
            </TouchableOpacity>
            <Text style={{ flexShrink: 1 }}>
              {renderFormattedText(cleanLine, {
                ...baseStyle,
                textDecorationLine: isChecked ? 'line-through' : 'none',
                color: isChecked ? '#94A3B8' : '#1E293B'
              })}
            </Text>
          </View>
        );
      }
      
      const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•');
      if (isBullet) {
        const cleanLine = trimmed.replace(/^[-•]\s*/, '');
        return (
          <View 
            key={lineIdx} 
            className="flex-row items-start mt-1.5 mb-0.5" 
            style={{ alignSelf: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start' }}
          >
            <Text className="text-teal-600 dark:text-teal-400 mr-2 font-extrabold" style={{ fontSize: baseFontSize }}>•</Text>
            <Text style={{ flexShrink: 1 }}>
              {renderFormattedText(cleanLine, baseStyle)}
            </Text>
          </View>
        );
      }

      return (
        <View 
          key={lineIdx} 
          className="mt-1" 
          style={{ width: '100%', alignItems: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start' }}
        >
          <Text style={{ width: '100%', textAlign: alignment }}>
            {renderFormattedText(line, baseStyle)}
          </Text>
        </View>
      );
    });
  };

  // Calculations
  const totalLimit = budget?.monthlyLimit || 5000;
  const totalSpent = budget?.spentThisMonth || 0;
  const totalIncome = budget?.incomeThisMonth || 0;
  const cashBalance = totalIncome - totalSpent;
  const progressRatio = Math.min(totalSpent / totalLimit, 1);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-955">
      
      {/* Top Navigation Tabs */}
      <View className="bg-white dark:bg-slate-900 px-4 pt-3.5 pb-2.5 border-b border-slate-200/50 dark:border-slate-800/80 flex-row">
        <TouchableOpacity
          onPress={() => setActiveTab('tx')}
          className={`flex-1 py-2 rounded-xl items-center flex-row justify-center ${activeTab === 'tx' ? 'bg-teal-500' : 'bg-slate-50 dark:bg-slate-850'}`}
        >
          <Ionicons name="receipt-sharp" size={14} color={activeTab === 'tx' ? 'white' : '#64748B'} />
          <Text className={`text-xs font-extrabold ml-1.5 ${activeTab === 'tx' ? 'text-white' : 'text-slate-500'}`}>Transactions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('notes')}
          className={`flex-1 py-2 rounded-xl items-center flex-row justify-center ml-3.5 ${activeTab === 'notes' ? 'bg-teal-500' : 'bg-slate-50 dark:bg-slate-850'}`}
        >
          <Ionicons name="document-text-sharp" size={14} color={activeTab === 'notes' ? 'white' : '#64748B'} />
          <Text className={`text-xs font-extrabold ml-1.5 ${activeTab === 'notes' ? 'text-white' : 'text-slate-500'}`}>Sticky Notes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {activeTab === 'tx' ? (
          /* ==================== TRANSACTIONS VIEW ==================== */
          <View>
            {/* 1. Monthly Budget Dashboard card */}
            <Animated.View 
              entering={FadeInUp.delay(100).duration(500)}
              className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 p-5 rounded-3xl shadow-xs mb-5"
            >
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Available Cash Balance</Text>
                  <Text className={`text-2xl font-extrabold mt-0.5 tracking-tight ${cashBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ৳ {cashBalance.toLocaleString()}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={() => {
                    setNewBudgetLimit(totalLimit.toString());
                    setIsBudgetModalVisible(true);
                  }}
                  activeOpacity={0.8}
                  className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 justify-center items-center border border-slate-200/20 dark:border-slate-700/30"
                >
                  <Ionicons name="settings-sharp" size={14} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Progress bar container */}
              <View className="w-full bg-slate-100 dark:bg-slate-850 h-3.5 rounded-full overflow-hidden mb-4 border border-slate-200/10">
                <View 
                  className={`h-full rounded-full ${progressRatio >= 0.9 ? 'bg-rose-500' : progressRatio >= 0.75 ? 'bg-amber-500' : 'bg-teal-500'}`}
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </View>

              {/* Budget stats grid */}
              <View className="flex-row justify-between pt-3.5 border-t border-slate-150 dark:border-slate-850">
                <View>
                  <Text className="text-slate-400 text-[8px] font-extrabold uppercase">Total Income</Text>
                  <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm mt-0.5">৳ {totalIncome.toLocaleString()}</Text>
                </View>
                <View className="items-center">
                  <Text className="text-slate-400 text-[8px] font-extrabold uppercase">Total Spent</Text>
                  <Text className="text-rose-600 dark:text-rose-400 font-extrabold text-sm mt-0.5">৳ {totalSpent.toLocaleString()}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-slate-400 text-[8px] font-extrabold uppercase">Target Limit</Text>
                  <Text className="text-slate-700 dark:text-slate-300 font-extrabold text-sm mt-0.5">৳ {totalLimit.toLocaleString()}</Text>
                </View>
              </View>
            </Animated.View>

            {/* 2. Transaction Lists Filter Header */}
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Transaction Logs</Text>
              
              <View className="flex-row">
                {(['all', 'expense', 'income'] as const).map(type => (
                  <TouchableOpacity 
                    key={type}
                    onPress={() => setSelectedFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg border ml-1.5 ${selectedFilterType === type ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white' : 'bg-white dark:bg-slate-900 border-slate-200/40 dark:border-slate-800'}`}
                  >
                    <Text className={`text-[9px] font-extrabold capitalize ${selectedFilterType === type ? 'text-white dark:text-slate-950' : 'text-slate-500'}`}>
                      {type === 'all' ? 'All Logs' : type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Transactions List */}
            <View>
              {filteredTransactions.length === 0 ? (
                <View className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl py-12 items-center justify-center">
                  <View className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-955 justify-center items-center mb-2.5">
                    <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
                  </View>
                  <Text className="text-slate-800 dark:text-slate-200 font-extrabold text-xs">No records found</Text>
                  <Text className="text-slate-400 text-[10px] mt-0.5">Recorded items will appear here.</Text>
                </View>
              ) : (
                filteredTransactions.map((item, index) => {
                  const isExpense = item.type === 'expense';
                  const info = getCategoryInfo(item.category, item.type);
                  return (
                    <Animated.View
                      key={item.id}
                      entering={FadeInRight.delay(index * 30).duration(300)}
                      className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl p-4 mb-2.5 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className={`w-9 h-9 rounded-full ${info.bg} justify-center items-center mr-3 border ${info.border}`}>
                          <Ionicons name={info.icon as any} size={15} color={info.color} />
                        </View>
                        <View className="flex-1 mr-2">
                          <Text className="text-slate-900 dark:text-slate-100 font-extrabold text-xs" numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text className="text-slate-400 text-[9px] mt-0.5 font-bold" numberOfLines={1}>
                            {item.notes ? `${item.notes} • ` : ''}{item.expenseDate}
                          </Text>
                        </View>
                      </View>
                      <Text className={`font-extrabold text-sm pr-1 ${isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isExpense ? '- ৳' : '+ ৳'} {item.amount}
                      </Text>
                    </Animated.View>
                  );
                })
              )}
            </View>
          </View>
        ) : (
          /* ==================== STICKY NOTES VIEW ==================== */
          <View>
            <View className="mb-4">
              <Text className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Expenses Notes & Reminders</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed font-semibold">
                Tap checkbox items to check/uncheck tasks directly. Format text inside the full-page editor.
              </Text>
            </View>

            {notes.length === 0 ? (
              <View className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl py-16 items-center justify-center">
                <View className="w-12 h-1 rounded-full bg-slate-100 dark:bg-slate-955 justify-center items-center mb-2.5">
                  <Ionicons name="document-text-outline" size={24} color="#94A3B8" />
                </View>
                <Text className="text-slate-800 dark:text-slate-200 font-extrabold text-xs">No notes found</Text>
                <Text className="text-slate-400 text-[10px] mt-0.5">Click the plus button below to write a note.</Text>
              </View>
            ) : (
              notes.map((note, index) => {
                const colorInfo = NOTE_COLORS[index % NOTE_COLORS.length];
                return (
                  <Animated.View
                    key={note.id}
                    entering={FadeInUp.delay(index * 40).duration(400)}
                    className={`${colorInfo.bg} border ${colorInfo.border} rounded-2xl p-5 mb-4 shadow-xs`}
                  >
                    <View className="flex-row justify-between items-start mb-2 border-b border-black/5 dark:border-white/5 pb-2">
                      <Text className={`font-extrabold text-sm tracking-tight flex-1 mr-2 ${colorInfo.text}`}>
                        {note.title}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => handleDeleteNote(note.id)}
                        className="p-1 rounded-lg"
                      >
                        <Ionicons name="trash-outline" size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Rendered formatted note contents */}
                    <View className="mt-1">
                      {renderFormattedContent(note)}
                    </View>

                    <Text className="text-slate-400 text-[8px] font-bold mt-4 pt-1">
                      Created: {note.createdAt}
                    </Text>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (activeTab === 'tx') {
            setTxType('expense');
            setTxCategory('food');
            setIsTxModalVisible(true);
          } else {
            setNoteTitle('');
            setNoteContent('');
            setEditorFontSize(14);
            setEditorAlignment('left');
            setEditorSelection({ start: 0, end: 0 });
            setIsNoteModalVisible(true);
          }
        }}
        className="absolute bottom-6 right-6 w-14 h-14 bg-teal-600 rounded-full justify-center items-center shadow-lg shadow-teal-600/30 z-30"
      >
        <Ionicons name="add-sharp" size={28} color="white" />
      </TouchableOpacity>

      {/* 1. Modal: Record Transaction Form */}
      <Modal
        visible={isTxModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTxModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1}
            onPress={() => setIsTxModalVisible(false)}
          />
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 border-t border-slate-200/50 dark:border-slate-800">
            <View className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full align-self-center mx-auto mb-5" />

            <Text className="text-lg font-extrabold text-slate-955 dark:text-white mb-4 tracking-tight">
              Add Transaction
            </Text>

            {/* Income / Expense Segments */}
            <View className="flex-row bg-slate-100 dark:bg-slate-955 p-2 rounded-xl mb-4">
              <TouchableOpacity
                onPress={() => {
                  setTxType('expense');
                  setTxCategory('food');
                }}
                className={`flex-1 py-2 rounded-lg items-center ${txType === 'expense' ? 'bg-rose-500' : ''}`}
              >
                <Text className={`text-xs font-extrabold ${txType === 'expense' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>Expense (খরচ)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setTxType('income');
                  setTxCategory('pocket_money');
                }}
                className={`flex-1 py-2 rounded-lg items-center ${txType === 'income' ? 'bg-emerald-500' : ''}`}
              >
                <Text className={`text-xs font-extrabold ${txType === 'income' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>Income (টাকা প্রবেশ)</Text>
              </TouchableOpacity>
            </View>

            {/* Input: Title */}
            <View className="mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                Title / Source *
              </Text>
              <TextInput
                placeholder={txType === 'expense' ? "e.g. Canteen lunch, Semester book" : "e.g. Pocket money, tuition salary"}
                placeholderTextColor="#94A3B8"
                value={txTitle}
                onChangeText={setTxTitle}
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
              />
            </View>

            {/* Grid: Amount and Category */}
            <View className="flex-row justify-between mb-4">
              {/* Amount */}
              <View style={{ width: '48%' }}>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                  Amount (৳) *
                </Text>
                <TextInput
                  placeholder="e.g. 500"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={txAmount}
                  onChangeText={setTxAmount}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                />
              </View>

              {/* Category selector */}
              <View style={{ width: '48%' }}>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                  Category *
                </Text>
                <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1 px-1">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {(txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <TouchableOpacity
                        key={cat.value}
                        onPress={() => setTxCategory(cat.value)}
                        className={`px-3 py-2 rounded-lg mx-1 ${txCategory === cat.value ? 'bg-teal-600' : 'bg-slate-100 dark:bg-slate-800'}`}
                      >
                        <Text className={`text-[9px] font-extrabold capitalize ${txCategory === cat.value ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {cat.value.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Conditional "Details" field */}
            {txCategory === 'others' && (
              <Animated.View entering={FadeInUp.duration(300)} className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                  Other Details (Optional)
                </Text>
                <TextInput
                  placeholder="e.g. Laundry, haircut, gift..."
                  placeholderTextColor="#94A3B8"
                  value={txDetails}
                  onChangeText={setTxDetails}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                />
              </Animated.View>
            )}

            {/* Input: Notes */}
            {txCategory !== 'others' && (
              <View className="mb-6">
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                  Optional Notes
                </Text>
                <TextInput
                  placeholder="e.g. Paid via Bkash / shared with friends"
                  placeholderTextColor="#94A3B8"
                  value={txNotes}
                  onChangeText={setTxNotes}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                />
              </View>
            )}

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsTxModalVisible(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl justify-center items-center border border-slate-200/20"
              >
                <Text className="text-slate-700 dark:text-slate-350 text-xs font-extrabold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddTransaction}
                disabled={addTransactionMutation.isPending}
                className="flex-1 bg-teal-600 py-3 rounded-xl justify-center items-center"
              >
                <Text className="text-white text-xs font-extrabold">
                  {addTransactionMutation.isPending ? 'Saving...' : 'Save Transaction'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2. Modal: Edit Monthly Budget Limit */}
      <Modal
        visible={isBudgetModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsBudgetModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1}
            onPress={() => setIsBudgetModalVisible(false)}
          />
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 border-t border-slate-200/50 dark:border-slate-800">
            <View className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full align-self-center mx-auto mb-5" />

            <Text className="text-lg font-extrabold text-slate-955 dark:text-white mb-2 tracking-tight">
              Update Budget Limit
            </Text>
            <Text className="text-slate-400 text-xs mb-4 leading-relaxed font-semibold">
              Set your target monthly pocket money limit. The tracker will warn you when spending goes near the threshold.
            </Text>

            {/* Input Limit */}
            <View className="mb-6">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                Target Limit (৳) *
              </Text>
              <TextInput
                placeholder="e.g. 5000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newBudgetLimit}
                onChangeText={setNewBudgetLimit}
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
              />
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsBudgetModalVisible(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 rounded-xl justify-center items-center border border-slate-200/20"
              >
                <Text className="text-slate-700 dark:text-slate-350 text-xs font-extrabold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateBudget}
                disabled={updateBudgetMutation.isPending}
                className="flex-1 bg-teal-600 py-3 rounded-xl justify-center items-center"
              >
                <Text className="text-white text-xs font-extrabold">
                  {updateBudgetMutation.isPending ? 'Updating...' : 'Update Limit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. Modal: Add Sticky Note Form */}
      <Modal
        visible={isNoteModalVisible}
        animationType="slide"
        onRequestClose={() => setIsNoteModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-955">
          
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-850">
            <TouchableOpacity 
              onPress={() => setIsNoteModalVisible(false)}
              className="flex-row items-center p-1"
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
              <Text className="text-slate-800 dark:text-slate-200 text-sm font-bold ml-1">Cancel</Text>
            </TouchableOpacity>

            <Text className="text-slate-900 dark:text-white text-base font-extrabold">Create Memo Note</Text>

            <TouchableOpacity 
              onPress={handleAddNote}
              disabled={addNoteMutation.isPending}
              className="bg-teal-600 px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-xs font-extrabold">
                {addNoteMutation.isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Page Editor Body */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            className="flex-1"
          >
            <ScrollView className="flex-1 px-5 pt-4">
              {/* Note Title Input */}
              <TextInput
                placeholder="Note Title"
                placeholderTextColor="#94A3B8"
                value={noteTitle}
                onChangeText={setNoteTitle}
                className="text-slate-955 dark:text-white text-xl font-extrabold border-b border-slate-100 dark:border-slate-850 pb-2 mb-4"
              />

              {/* Note Content Text Area */}
              <TextInput
                ref={editorInputRef}
                placeholder="Start typing calculations, numbers, or checklist items..."
                placeholderTextColor="#94A3B8"
                multiline
                value={noteContent}
                onChangeText={setNoteContent}
                selection={editorSelection}
                onSelectionChange={(e) => {
                  setEditorSelection(e.nativeEvent.selection);
                }}
                textAlignVertical="top"
                style={{ fontSize: editorFontSize, textAlign: editorAlignment }}
                className="text-slate-700 dark:text-slate-200 font-semibold leading-relaxed h-80"
              />
            </ScrollView>

            {/* Smart Text Formatting & Media Toolbar */}
            <View className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800">
              
              {/* Horizontal Scrollable Toolbar for Formatting */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 10 }}
                className="flex-row"
              >
                {/* 1. Attachment / Image */}
                <TouchableOpacity 
                  onPress={() => Alert.alert("Attachment", "Image attachments are simulated in demo mode.")}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Ionicons name="image-outline" size={16} color="#64748B" />
                </TouchableOpacity>

                {/* 2. Freehand / Draw */}
                <TouchableOpacity 
                  onPress={() => Alert.alert("Drawing", "Canvas drawing is simulated in demo mode.")}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Ionicons name="brush-outline" size={16} color="#64748B" />
                </TouchableOpacity>

                {/* 3. Checkbox / To-Do List */}
                <TouchableOpacity 
                  onPress={() => insertFormatting('[ ] ')}
                  className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-955 justify-center items-center border border-teal-100 dark:border-teal-900/30 shadow-xs"
                >
                  <Ionicons name="checkbox-outline" size={16} color="#0D9488" />
                </TouchableOpacity>

                {/* 4. Highlighter Marker */}
                <TouchableOpacity 
                  onPress={() => insertFormatting('==', '==')}
                  className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-955 justify-center items-center border border-yellow-200/30 dark:border-yellow-900/30 shadow-xs"
                >
                  <Ionicons name="pencil-sharp" size={15} color="#D97706" />
                </TouchableOpacity>

                {/* 5. A+ (Font Size Increase) */}
                <TouchableOpacity 
                  onPress={() => setEditorFontSize(prev => Math.min(prev + 2, 24))}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-[10px]">A+</Text>
                </TouchableOpacity>

                {/* 6. A- (Font Size Decrease) */}
                <TouchableOpacity 
                  onPress={() => setEditorFontSize(prev => Math.max(prev - 2, 10))}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-[10px]">A-</Text>
                </TouchableOpacity>

                {/* 7. B (Bold) */}
                <TouchableOpacity 
                  onPress={() => insertFormatting('**', '**')}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-xs">B</Text>
                </TouchableOpacity>

                {/* 8. I (Italic) */}
                <TouchableOpacity 
                  onPress={() => insertFormatting('*', '*')}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-xs italic">I</Text>
                </TouchableOpacity>

                {/* 9. U (Underline) */}
                <TouchableOpacity 
                  onPress={() => insertFormatting('__', '__')}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-xs underline">U</Text>
                </TouchableOpacity>

                {/* 10. Bullet List (-) */}
                <TouchableOpacity 
                  onPress={() => insertFormatting('- ')}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Ionicons name="list-sharp" size={16} color="#475569" />
                </TouchableOpacity>

                {/* 11. Text Align Left (L) */}
                <TouchableOpacity 
                  onPress={() => setEditorAlignment('left')}
                  className={`w-10 h-10 rounded-xl justify-center items-center border shadow-xs ${editorAlignment === 'left' ? 'bg-teal-50 border-teal-100 dark:bg-teal-950/20' : 'bg-white border-slate-200/40 dark:bg-slate-800'}`}
                >
                  <Text className={`font-extrabold text-xs ${editorAlignment === 'left' ? 'text-teal-600' : 'text-slate-500 dark:text-slate-400'}`}>L</Text>
                </TouchableOpacity>

                {/* 12. Text Align Center (C) */}
                <TouchableOpacity 
                  onPress={() => setEditorAlignment('center')}
                  className={`w-10 h-10 rounded-xl justify-center items-center border shadow-xs ${editorAlignment === 'center' ? 'bg-teal-50 border-teal-100 dark:bg-teal-950/20' : 'bg-white border-slate-200/40 dark:bg-slate-800'}`}
                >
                  <Text className={`font-extrabold text-xs ${editorAlignment === 'center' ? 'text-teal-600' : 'text-slate-500 dark:text-slate-400'}`}>C</Text>
                </TouchableOpacity>

                {/* 13. Text Align Right (R) */}
                <TouchableOpacity 
                  onPress={() => setEditorAlignment('right')}
                  className={`w-10 h-10 rounded-xl justify-center items-center border shadow-xs ${editorAlignment === 'right' ? 'bg-teal-50 border-teal-100 dark:bg-teal-950/20' : 'bg-white border-slate-200/40 dark:bg-slate-800'}`}
                >
                  <Text className={`font-extrabold text-xs ${editorAlignment === 'right' ? 'text-teal-600' : 'text-slate-500 dark:text-slate-400'}`}>R</Text>
                </TouchableOpacity>

                {/* 14. Voice Recorder */}
                <TouchableOpacity 
                  onPress={() => Alert.alert("Voice Memo", "Audio recording is simulated in demo mode.")}
                  className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 justify-center items-center border border-slate-200/40 dark:border-slate-700/50 shadow-xs"
                >
                  <Ionicons name="mic-outline" size={16} color="#64748B" />
                </TouchableOpacity>

              </ScrollView>
              
              {/* Extra help bar */}
              <View className="px-4 pb-2 pt-0.5 border-t border-slate-100 dark:border-slate-800/80 flex-row justify-between items-center bg-slate-50 dark:bg-slate-900">
                <Text className="text-slate-400 text-[8px] font-bold">
                  Cursor position tracked. Selected text will be wrapped.
                </Text>
                <Text className="text-teal-600 dark:text-teal-400 text-[8px] font-extrabold">
                  Font Size: {editorFontSize}px • Align: {editorAlignment}
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>

        </SafeAreaView>
      </Modal>

    </View>
  );
}

// Simple wrapper import to declare custom Safe Area when Modal is open
import { SafeAreaView as RawSafeAreaView } from 'react-native-safe-area-context';
const SafeAreaView = Platform.OS === 'ios' ? RawSafeAreaView : View;
