import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStudentProfile, useUserContextWidget, useCampusFeed } from '../hooks/useDashboardData';

const { width } = Dimensions.get('window');

// 6 Core Features Metadata with custom premium gradients and styling
const FEATURES = [
  { 
    id: 'mess_finder', 
    title: 'Mess Finder', 
    desc: 'Find local messes & seats', 
    icon: 'home-sharp', 
    bgColor: 'bg-teal-50/60 dark:bg-teal-950/20', 
    border: 'border-teal-100/80 dark:border-teal-900/30',
    iconColor: '#0D9488',
    arrowBg: 'bg-teal-600'
  },
  { 
    id: 'study_hub', 
    title: 'Study Hub', 
    desc: 'Lectures, notes & board papers', 
    icon: 'book-sharp', 
    bgColor: 'bg-blue-50/60 dark:bg-blue-950/20', 
    border: 'border-blue-100/80 dark:border-blue-900/30',
    iconColor: '#2563EB',
    arrowBg: 'bg-blue-600'
  },
  { 
    id: 'marketplace', 
    title: 'Marketplace', 
    desc: 'Buy & sell tools, books', 
    icon: 'cart-sharp', 
    bgColor: 'bg-emerald-50/60 dark:bg-emerald-950/20', 
    border: 'border-emerald-100/80 dark:border-emerald-900/30',
    iconColor: '#059669',
    arrowBg: 'bg-emerald-600'
  },
  { 
    id: 'expense_tracker', 
    title: 'Expense Tracker', 
    desc: 'Track personal monthly budget', 
    icon: 'wallet-sharp', 
    bgColor: 'bg-slate-100/60 dark:bg-slate-900/40', 
    border: 'border-slate-200/80 dark:border-slate-800/30',
    iconColor: '#475569',
    arrowBg: 'bg-slate-600'
  },
  { 
    id: 'mess_manager', 
    title: 'Mess Manager', 
    desc: 'Manage meals, bills & expenses', 
    icon: 'restaurant-sharp', 
    bgColor: 'bg-purple-50/60 dark:bg-purple-950/20', 
    border: 'border-purple-100/80 dark:border-purple-900/30',
    iconColor: '#7C3AED',
    arrowBg: 'bg-purple-600',
    badge: 'Active'
  },
  { 
    id: 'lost_found', 
    title: 'Lost & Found', 
    desc: 'Share lost/found items feed', 
    icon: 'search-sharp', 
    bgColor: 'bg-amber-50/60 dark:bg-amber-950/20', 
    border: 'border-amber-100/80 dark:border-amber-900/30',
    iconColor: '#D97706',
    arrowBg: 'bg-amber-600'
  },
];

interface HomeDashboardProps {
  onSelectFeature: (featureId: string) => void;
}

export default function HomeDashboard({ onSelectFeature }: HomeDashboardProps) {
  const { data: profile } = useStudentProfile();
  const { data: widget } = useUserContextWidget();
  const { data: feed } = useCampusFeed();

  const getFeedIconInfo = (type: string) => {
    switch (type) {
      case 'notice': return { name: 'megaphone-sharp', color: '#EF4444', bg: 'bg-rose-100 dark:bg-rose-950/40' };
      case 'marketplace': return { name: 'cart-sharp', color: '#10B981', bg: 'bg-emerald-100 dark:bg-emerald-950/40' };
      case 'room_finder': return { name: 'home-sharp', color: '#06B6D4', bg: 'bg-cyan-100 dark:bg-cyan-950/40' };
      default: return { name: 'search-sharp', color: '#F59E0B', bg: 'bg-amber-100 dark:bg-amber-950/40' };
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Profile Header Card (Restored to the gorgeous green gradient card with rounded-2xl) */}
      {profile && (
        <Animated.View 
          entering={FadeInUp.delay(100).duration(600)}
          className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-md shadow-teal-700/5 relative"
        >
          {/* Absolute Background Gradient */}
          <LinearGradient
            colors={['#059669', '#0D9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          
          {/* Background circles for premium texture depth */}
          <View className="absolute right-[-15] top-[-15] w-32 h-32 rounded-full bg-white/5" />
          <View className="absolute right-[-30] bottom-[-20] w-40 h-40 rounded-full bg-white/10" />

          {/* Standard View container ensures padding works perfectly */}
          <View className="pt-6 px-5 pb-5 z-10">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-teal-100 text-[9px] font-extrabold uppercase tracking-widest">PolyMate Profile</Text>
                <Text className="text-white text-xl font-extrabold mt-0.5 tracking-tight">{profile.name}</Text>
              </View>
              <View className="w-9 h-9 rounded-xl bg-white/10 dark:bg-black/20 justify-center items-center">
                <Ionicons name="sparkles-sharp" size={16} color="white" />
              </View>
            </View>
            
            <View className="pt-3 border-t border-white/20">
              <Text className="text-white font-extrabold text-sm tracking-tight">{profile.instituteName}</Text>
              <View className="flex-row items-center mt-2.5 gap-2">
                <View className="bg-white/15 px-2.5 py-0.5 rounded-lg">
                  <Text className="text-white text-[10px] font-bold">{profile.department}</Text>
                </View>
                <View className="bg-white/15 px-2.5 py-0.5 rounded-lg">
                  <Text className="text-white text-[10px] font-bold">{profile.semester}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* 2. Sleek Custom Search Bar */}
      <Animated.View 
        entering={FadeInUp.delay(120).duration(600)}
        className="mx-4 mt-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 px-4 py-2.5 rounded-xl flex-row items-center shadow-sm"
      >
        <Ionicons name="search-sharp" size={16} color="#94A3B8" />
        <TextInput 
          placeholder="Search notes, board questions, messes..."
          placeholderTextColor="#94A3B8"
          className="ml-2.5 text-slate-800 dark:text-white flex-1 text-xs font-semibold"
        />
        <TouchableOpacity className="pl-1.5">
          <Ionicons name="options-outline" size={16} color="#64748B" />
        </TouchableOpacity>
      </Animated.View>

      {/* 3. Live Mess Status Widget (Minimal, no solid left border stripe) */}
      {widget && (
        <Animated.View 
          entering={FadeInUp.delay(140).duration(600)}
          className="mx-4 mt-3 bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 p-4 rounded-2xl shadow-sm relative overflow-hidden"
        >
          {widget.hasActiveMess ? (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => onSelectFeature('mess_manager')}
            >
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <View className="w-7 h-7 rounded-lg bg-orange-500/10 justify-center items-center">
                    <Ionicons name="restaurant-sharp" size={13} color="#EA580C" />
                  </View>
                  <Text className="text-slate-955 dark:text-slate-100 font-extrabold ml-2 text-sm tracking-tight">{widget.messName}</Text>
                </View>
                <View className="bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  <Text className="text-orange-600 dark:text-orange-400 text-[9px] font-extrabold uppercase tracking-wide">Live Standings</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <View>
                  <Text className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider">Today's Meals</Text>
                  <Text className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-0.5">{widget.todayMeals} Meals</Text>
                </View>
                <View className="items-end">
                  <Text className="text-slate-400 text-[9px] font-extrabold uppercase tracking-wider">Net Balance</Text>
                  <Text className={`font-extrabold text-sm mt-0.5 ${widget.messBalance && widget.messBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ৳ {widget.messBalance}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View>
              <Text className="text-slate-855 dark:text-slate-150 font-extrabold text-sm mb-1.5">Monthly Budget</Text>
              <View className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-1.5">
                <View 
                  className="bg-teal-500 h-full"
                  style={{ width: `${((widget.monthlyExpenseSpent || 0) / (widget.monthlyExpenseBudget || 1)) * 100}%` }}
                />
              </View>
              <Text className="text-slate-400 text-[10px]">
                Spent: ৳{widget.monthlyExpenseSpent} of ৳{widget.monthlyExpenseBudget}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* 4. Core Features Launcher Grid (Exactly matching the 3:36 screenshot style layout & button circles!) */}
      <View className="px-4 mt-6">
        <Text className="text-base font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Core Campus Tools</Text>
        <View className="flex-row flex-wrap gap-4">
          {FEATURES.map((item, index) => {
            const cardWidth = (width - 50) / 2; // Split into 2 columns
            return (
              <Animated.View 
                key={item.id}
                entering={FadeInUp.delay(160 + index * 40).duration(400)}
                layout={Layout.springify()}
                style={{ width: cardWidth }}
              >
                <TouchableOpacity 
                  onPress={() => onSelectFeature(item.id)}
                  activeOpacity={0.8}
                  className={`rounded-2xl border ${item.border} ${item.bgColor} relative h-36 justify-between flex p-5 shadow-sm`}
                >
                  {/* Top Row: White circle icon & Badge (if any) */}
                  <View className="flex-row justify-between items-start">
                    <View className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 justify-center items-center shadow-xs">
                      <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                    </View>
                    {item.badge && (
                      <View className="bg-purple-600 px-2 py-0.5 rounded-full border border-purple-700/10">
                        <Text className="text-white text-[7px] font-extrabold uppercase">{item.badge}</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Bottom Row: Title + Arrow button circle, and Description below */}
                  <View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-sm tracking-tight flex-1 pr-1.5">
                        {item.title}
                      </Text>
                      <View className={`w-5.5 h-5.5 rounded-full ${item.arrowBg} justify-center items-center shadow-xs`}>
                        <Ionicons name="arrow-forward" size={10} color="white" />
                      </View>
                    </View>
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 leading-tight font-semibold" numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* 5. Live Campus Feed */}
      <View className="px-4 mt-6">
        <Text className="text-base font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Live Campus Feed</Text>
        
        {feed && feed.map((item, index) => {
          const iconInfo = getFeedIconInfo(item.type);
          return (
            <Animated.View
              key={item.id}
              entering={FadeInRight.delay(200 + index * 60).duration(400)}
              className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-xl p-3 mb-2 flex-row items-center shadow-xs"
            >
              {/* Categorized Circle Icon */}
              <View className={`w-8 h-8 rounded-xl ${iconInfo.bg} justify-center items-center mr-3`}>
                <Ionicons name={iconInfo.name as any} size={16} color={iconInfo.color} />
              </View>

              {/* Feed Text Context */}
              <View className="flex-1 mr-2">
                <View className="flex-row items-center mb-0.5">
                  <View className="bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-md mr-1.5">
                    <Text className="text-slate-500 dark:text-slate-400 text-[7px] font-extrabold uppercase tracking-wide">
                      {item.badgeText}
                    </Text>
                  </View>
                  <Text className="text-slate-400 text-[8px] font-bold">{item.timeAgo}</Text>
                </View>
                <Text className="text-slate-900 dark:text-slate-100 font-extrabold text-xs" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] mt-0.5" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>

              {/* Price Widget */}
              {item.price !== undefined && (
                <View className="items-end bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                    ৳ {item.price}
                  </Text>
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}
