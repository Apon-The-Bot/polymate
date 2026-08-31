import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeDashboard from '../features/dashboard/components/HomeDashboard';
import MessDashboard from '../features/mess-manager/components/MessDashboard';
import RoomFinderDashboard from '../features/room-finder/components/RoomFinderDashboard';
import StudyHubDashboard from '../features/study-hub/components/StudyHubDashboard';
import MarketplaceDashboard from '../features/marketplace/components/MarketplaceDashboard';
import ExpenseTrackerDashboard from '../features/expense-tracker/components/ExpenseTrackerDashboard';
import LostFoundDashboard from '../features/lost-found/components/LostFoundDashboard';
import ProfileScreen from './explore';

import { useUserContextWidget } from '../features/dashboard/hooks/useDashboardData';
import { useAuthStore } from '../store/authStore';

type ActiveView = 'dashboard' | 'mess_manager' | 'mess_finder' | 'study_hub' | 'marketplace' | 'expense_tracker' | 'lost_found' | 'profile';

const TABS = [
  { view: 'dashboard' as ActiveView, label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { view: 'mess_manager' as ActiveView, label: 'Mess', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { view: 'marketplace' as ActiveView, label: 'Market', icon: 'cart-outline', activeIcon: 'cart' },
  { view: 'expense_tracker' as ActiveView, label: 'Expenses', icon: 'wallet-outline', activeIcon: 'wallet' },
];

export default function HomeScreen() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { data: widget } = useUserContextWidget();
  const currentUser = useAuthStore(state => state.user);
  
  const nameInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U';

  const handleSelectFeature = (featureId: string) => {
    if (featureId === 'mess_manager') {
      setActiveView('mess_manager');
    } else if (featureId === 'mess_finder') {
      setActiveView('mess_finder');
    } else if (featureId === 'study_hub') {
      setActiveView('study_hub');
    } else if (featureId === 'marketplace') {
      setActiveView('marketplace');
    } else if (featureId === 'expense_tracker') {
      setActiveView('expense_tracker');
    } else if (featureId === 'lost_found') {
      setActiveView('lost_found');
    }
  };

  const getHeaderTitle = () => {
    if (activeView === 'mess_manager') return 'Mess Manager';
    if (activeView === 'mess_finder') return 'Mess & Room Finder';
    if (activeView === 'study_hub') return 'Study Hub';
    if (activeView === 'marketplace') return 'Student Marketplace';
    if (activeView === 'expense_tracker') return 'Personal Expense Tracker';
    if (activeView === 'lost_found') return 'Campus Lost & Found';
    return '';
  };

  const isCoreView = ['dashboard', 'mess_manager', 'marketplace', 'expense_tracker'].includes(activeView);
  const activeIndex = activeView === 'dashboard' ? 0 :
                      activeView === 'mess_manager' ? 1 :
                      activeView === 'marketplace' ? 2 :
                      activeView === 'expense_tracker' ? 3 : -1;

  const renderHeader = () => {
    if (activeView === 'profile') return null; // ProfileScreen renders its own header with back support

    if (isCoreView) {
      return (
        <View className="flex-row justify-between items-center px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
          <View>
            <Text className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Welcome,</Text>
            <Text className="text-slate-800 dark:text-white text-lg font-extrabold tracking-tight mt-0.5">{currentUser?.name || 'Student'}</Text>
            <Text className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">{currentUser?.instituteName || 'Polytechnic Institute'}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setActiveView('profile')}
            className="w-11 h-11 rounded-full bg-teal-50 dark:bg-teal-950 border-2 border-teal-600/20 justify-center items-center overflow-hidden shadow-xs"
          >
            <Text className="text-teal-600 dark:text-teal-400 text-lg font-black">{nameInitial}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Detail/Sub-dashboard Header Bar with Back Button
    return (
      <View className="flex-row justify-between items-center px-4 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <TouchableOpacity 
          onPress={() => setActiveView('dashboard')}
          className="flex-row items-center w-20"
        >
          <Ionicons name="arrow-back" size={20} color="#0D6F73" />
          <Text className="text-xs font-bold text-teal-600 ml-1">Home</Text>
        </TouchableOpacity>
        <Text className="text-sm font-black text-slate-800 dark:text-white flex-1 text-center">{getHeaderTitle()}</Text>
        <View className="w-20" />
      </View>
    );
  };

  const renderBottomTabBar = () => {
    if (!isCoreView || activeIndex === -1) return null;

    return (
      <View className="h-[64px] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex-row relative justify-around items-center px-2 pb-safe">
        {/* Curved Cutout Mask Circle */}
        <View 
          className="w-[56px] h-[56px] rounded-full bg-slate-50 dark:bg-slate-955 absolute"
          style={{
            top: -24,
            left: `${activeIndex * 25 + 12.5}%`,
            marginLeft: -28,
            zIndex: 1,
          }}
        />

        {/* Floating Bubble Active Icon */}
        <View 
          className="w-[46px] h-[46px] rounded-full bg-teal-600 absolute justify-center items-center shadow-lg"
          style={{
            top: -18,
            left: `${activeIndex * 25 + 12.5}%`,
            marginLeft: -23,
            zIndex: 2,
            shadowColor: '#0D6F73',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 5,
          }}
        >
          <Ionicons name={TABS[activeIndex].activeIcon} size={20} color="white" />
        </View>

        {/* Inactive Tab Triggers */}
        {TABS.map((tab, idx) => {
          const isActive = idx === activeIndex;
          return (
            <TouchableOpacity
              key={tab.view}
              onPress={() => setActiveView(tab.view)}
              className="flex-1 items-center justify-center h-full"
              style={{ zIndex: 3 }}
            >
              {isActive ? (
                // Blank space placeholder for the active bubble
                <View className="h-6 w-6" />
              ) : (
                <View className="items-center justify-center">
                  <Ionicons name={tab.icon} size={20} color="#94A3B8" />
                  <Text className="text-[9px] font-bold text-slate-400 mt-1">{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {renderHeader()}
      
      <View style={styles.flex1}>
        {activeView === 'dashboard' && <HomeDashboard onSelectFeature={handleSelectFeature} />}
        {activeView === 'mess_manager' && <MessDashboard messId={widget?.hasActiveMess && widget.messId ? widget.messId : 0} />}
        {activeView === 'mess_finder' && <RoomFinderDashboard />}
        {activeView === 'study_hub' && <StudyHubDashboard />}
        {activeView === 'marketplace' && <MarketplaceDashboard />}
        {activeView === 'expense_tracker' && <ExpenseTrackerDashboard />}
        {activeView === 'lost_found' && <LostFoundDashboard />}
        {activeView === 'profile' && <ProfileScreen onBack={() => setActiveView('dashboard')} />}
      </View>

      {renderBottomTabBar()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex1: {
    flex: 1,
  }
});
