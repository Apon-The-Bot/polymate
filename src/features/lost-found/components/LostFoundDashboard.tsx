import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Linking, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useLostFoundItems, useReportLostFoundItem, useToggleItemStatus } from '../hooks/useLostFoundData';
import { LostFoundItem, LostFoundFilterCategory, LostFoundFilterType } from '../types';

const CATEGORIES: { value: LostFoundItem['category']; label: string; icon: string; bg: string; color: string; border: string }[] = [
  { value: 'electronics', label: 'Electronics', icon: 'laptop-sharp', bg: 'bg-indigo-50 dark:bg-indigo-950/20', color: '#4F46E5', border: 'border-indigo-100 dark:border-indigo-900/30' },
  { value: 'documents', label: 'ID & Cards', icon: 'card-sharp', bg: 'bg-rose-50 dark:bg-rose-955/20', color: '#E11D48', border: 'border-rose-100 dark:border-rose-900/30' },
  { value: 'books', label: 'Books', icon: 'book-sharp', bg: 'bg-blue-50 dark:bg-blue-955/20', color: '#2563EB', border: 'border-blue-100 dark:border-blue-900/30' },
  { value: 'personal_items', label: 'Personal Items', icon: 'key-sharp', bg: 'bg-amber-50 dark:bg-amber-955/20', color: '#D97706', border: 'border-amber-100 dark:border-amber-900/30' },
  { value: 'others', label: 'Others', icon: 'pricetag-sharp', bg: 'bg-slate-100 dark:bg-slate-800/40', color: '#64748B', border: 'border-slate-200/20 dark:border-slate-850' }
];

// Mapped strictly to the 6 valid student names constraint
const STUDENT_NAMES = ["Amanullah Sheikh", "Apon", "Asha", "Jihad", "Jerin", "Rhythm"];

export default function LostFoundDashboard() {
  const { data: items = [], isLoading } = useLostFoundItems();
  const reportItemMutation = useReportLostFoundItem();
  const toggleStatusMutation = useToggleItemStatus();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<LostFoundFilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<LostFoundFilterCategory>('all');

  // Add Item Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemType, setItemType] = useState<LostFoundItem['type']>('lost');
  const [itemCategory, setItemCategory] = useState<LostFoundItem['category']>('electronics');
  const [itemDesc, setItemDesc] = useState('');
  const [itemLocation, setItemLocation] = useState('');
  const [itemContact, setItemContact] = useState('');
  const [itemReporter, setItemReporter] = useState(STUDENT_NAMES[0]); // Limited strictly to student names list

  // Filter listings
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const getCategoryInfo = (category: string) => {
    const found = CATEGORIES.find(c => c.value === category);
    return found || CATEGORIES[4];
  };

  const handleReportItem = () => {
    if (!itemTitle || !itemDesc || !itemLocation || !itemContact) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    reportItemMutation.mutate({
      title: itemTitle,
      type: itemType,
      category: itemCategory,
      description: itemDesc,
      location: itemLocation,
      contactNumber: itemContact,
      reporterName: itemReporter
    }, {
      onSuccess: () => {
        setItemTitle('');
        setItemDesc('');
        setItemLocation('');
        setItemContact('');
        setItemReporter(STUDENT_NAMES[0]);
        setIsModalVisible(false);
        Alert.alert('Success', 'Listing added successfully.');
      }
    });
  };

  const handleCallReporter = (phoneNumber: string) => {
    const cleanNum = phoneNumber.replace(/[^0-9]/g, '');
    const url = `tel:${cleanNum}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Calling is not supported on this device.');
        }
      });
  };

  const handleWhatsAppChat = (item: LostFoundItem) => {
    const cleanNum = item.contactNumber.replace(/[^0-9]/g, '');
    const formattedNum = cleanNum.startsWith('0') ? cleanNum.substring(1) : cleanNum;
    
    const message = `Hello ${item.reporterName}, I saw your post on PolyMate about the ${item.type} item "${item.title}" reported at ${item.location}. Is it found/returned?`;
    const url = `https://wa.me/880${formattedNum}?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp is not installed or supported.');
        }
      });
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      
      {/* 1. Header Filters & Search bar */}
      <View className="bg-white dark:bg-slate-900 px-4 pt-3 pb-3.5 border-b border-slate-200/50 dark:border-slate-800/80">
        
        {/* Search Input */}
        <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/50 dark:border-slate-850 px-3.5 py-2 rounded-xl flex-row items-center mb-3">
          <Ionicons name="search-sharp" size={15} color="#94A3B8" />
          <TextInput
            placeholder="Search lost IDs, keys, calculators..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-2 flex-1 text-xs font-semibold text-slate-800 dark:text-white"
          />
        </View>

        {/* Horizontal Type Filters (All, Lost, Found) */}
        <View className="flex-row mb-3">
          {(['all', 'lost', 'found'] as const).map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              className={`flex-1 py-2 rounded-lg items-center border mx-1 ${selectedType === type ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white' : 'bg-slate-50 dark:bg-slate-950 border-slate-200/40 dark:border-slate-850'}`}
            >
              <Text className={`text-[10px] font-extrabold capitalize ${selectedType === type ? 'text-white dark:text-slate-950' : 'text-slate-500'}`}>
                {type === 'all' ? 'All Items' : type === 'lost' ? 'Lost (হারানো)' : 'Found (প্রাপ্তি)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scrollable Categories List */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
          <TouchableOpacity
            onPress={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full border mr-2 ${selectedCategory === 'all' ? 'bg-teal-500 border-teal-500' : 'bg-slate-50 border-slate-200/40 dark:bg-slate-950 dark:border-slate-850'}`}
          >
            <Text className={`text-[10px] font-bold ${selectedCategory === 'all' ? 'text-white' : 'text-slate-500'}`}>All Types</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              onPress={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-full border mr-2 flex-row items-center ${selectedCategory === cat.value ? 'bg-teal-500 border-teal-500' : 'bg-slate-50 border-slate-200/40 dark:bg-slate-950 dark:border-slate-850'}`}
            >
              <Ionicons name={cat.icon as any} size={11} color={selectedCategory === cat.value ? 'white' : cat.color} className="mr-1" />
              <Text className={`text-[10px] font-bold ${selectedCategory === cat.value ? 'text-white' : 'text-slate-500'}`}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </View>

      {/* 2. Listings Feed */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {filteredItems.length === 0 ? (
          <View className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-3xl py-16 items-center justify-center">
            <View className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-950 justify-center items-center mb-3">
              <Ionicons name="search-outline" size={24} color="#94A3B8" />
            </View>
            <Text className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">No notices posted</Text>
            <Text className="text-slate-400 text-xs mt-1 text-center px-6">No lost/found notices match your search or filter options.</Text>
          </View>
        ) : (
          filteredItems.map((item, index) => {
            const isLost = item.type === 'lost';
            const isResolved = item.status === 'resolved';
            const catInfo = getCategoryInfo(item.category);

            return (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(index * 30).duration(300)}
                layout={Layout.springify()}
                className={`bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-3xl p-5 mb-4 relative ${isResolved ? 'opacity-60' : ''}`}
              >
                
                {/* Top Row: Type badge, Category tag, and toggle resolve check */}
                <View className="flex-row justify-between items-center mb-2.5">
                  <View className="flex-row items-center">
                    {/* Lost / Found Badge */}
                    <View className={`px-2.5 py-0.5 rounded-md mr-2 ${isLost ? 'bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30' : 'bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-100 dark:border-emerald-900/30'}`}>
                      <Text className={`text-[8px] font-extrabold uppercase ${isLost ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isLost ? 'Lost (হারানো)' : 'Found (প্রাপ্তি)'}
                      </Text>
                    </View>

                    {/* Category tag */}
                    <View className={`px-2 py-0.5 rounded-md flex-row items-center ${catInfo.bg} border ${catInfo.border}`}>
                      <Ionicons name={catInfo.icon as any} size={10} color={catInfo.color} className="mr-1" />
                      <Text className="text-[8px] font-extrabold uppercase" style={{ color: catInfo.color }}>
                        {catInfo.label}
                      </Text>
                    </View>
                  </View>

                  {/* Resolve mark option */}
                  <TouchableOpacity
                    onPress={() => toggleStatusMutation.mutate({ itemId: item.id, currentStatus: item.status })}
                    className={`w-7 h-7 rounded-xl justify-center items-center ${isResolved ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    <Ionicons 
                      name={isResolved ? "checkmark-sharp" : "checkmark-outline"} 
                      size={14} 
                      color={isResolved ? "white" : "#64748B"} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Listing Title */}
                <Text 
                  style={{ textDecorationLine: isResolved ? 'line-through' : 'none' }}
                  className="text-slate-900 dark:text-white font-extrabold text-sm tracking-tight mb-1.5"
                >
                  {item.title}
                </Text>

                {/* Description */}
                <Text className="text-slate-500 dark:text-slate-300 text-xs font-semibold leading-relaxed mb-4">
                  {item.description}
                </Text>

                {/* Bottom Row: Location, Reporter Details, and Call / WhatsApp Action Buttons */}
                <View className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-row justify-between items-center">
                  
                  {/* Location & Reporter Info */}
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="location-sharp" size={12} color="#94A3B8" />
                      <Text className="text-slate-400 text-[10px] ml-1 font-bold" numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                    <Text className="text-slate-400 text-[9px] font-extrabold uppercase">
                      Rep: {item.reporterName} • {item.reportedDate}
                    </Text>
                  </View>

                  {/* CTAs */}
                  <View className="flex-row gap-2">
                    {/* Call Button */}
                    <TouchableOpacity
                      onPress={() => handleCallReporter(item.contactNumber)}
                      className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 justify-center items-center"
                    >
                      <Ionicons name="call-sharp" size={15} color="#475569" />
                    </TouchableOpacity>

                    {/* WhatsApp pre-filled CTA */}
                    <TouchableOpacity
                      onPress={() => handleWhatsAppChat(item)}
                      className="w-9 h-9 rounded-full bg-emerald-500 justify-center items-center"
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="white" />
                    </TouchableOpacity>
                  </View>

                </View>

              </Animated.View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsModalVisible(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-teal-600 rounded-full justify-center items-center shadow-lg shadow-teal-600/30 z-30"
      >
        <Ionicons name="add-sharp" size={28} color="white" />
      </TouchableOpacity>

      {/* Post Listing Modal Form */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
          />
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 border-t border-slate-200/50 dark:border-slate-800">
            <View className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full align-self-center mx-auto mb-5" />

            <Text className="text-lg font-extrabold text-slate-950 dark:text-white mb-4 tracking-tight">
              Report Lost/Found Item
            </Text>

            {/* Type selector: Lost vs Found */}
            <View className="flex-row bg-slate-100 dark:bg-slate-950 p-2 rounded-xl mb-4">
              <TouchableOpacity
                onPress={() => setItemType('lost')}
                className={`flex-1 py-2 rounded-lg items-center ${itemType === 'lost' ? 'bg-rose-500' : ''}`}
              >
                <Text className={`text-xs font-extrabold ${itemType === 'lost' ? 'text-white' : 'text-slate-500'}`}>Lost (হারিয়েছি)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setItemType('found')}
                className={`flex-1 py-2 rounded-lg items-center ${itemType === 'found' ? 'bg-emerald-500' : ''}`}
              >
                <Text className={`text-xs font-extrabold ${itemType === 'found' ? 'text-white' : 'text-slate-500'}`}>Found (পেয়েছি)</Text>
              </TouchableOpacity>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                Item Title *
              </Text>
              <TextInput
                placeholder="e.g. Casio Calculator, Room 102 keys"
                placeholderTextColor="#94A3B8"
                value={itemTitle}
                onChangeText={setItemTitle}
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
              />
            </View>

            {/* Category selection */}
            <View className="mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                Category *
              </Text>
              <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1 px-1 flex-row">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => setItemCategory(cat.value)}
                      className={`px-3.5 py-2 rounded-lg mx-1 ${itemCategory === cat.value ? 'bg-teal-600' : 'bg-slate-100 dark:bg-slate-800'}`}
                    >
                      <Text className={`text-[9px] font-extrabold capitalize ${itemCategory === cat.value ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                Description Details *
              </Text>
              <TextInput
                placeholder="e.g. Misplaced on 5th floor corridor, case is blue, has sticker..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={itemDesc}
                onChangeText={setItemDesc}
                textAlignVertical="top"
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white h-20"
              />
            </View>

            {/* Location & Contact Grid */}
            <View className="flex-row justify-between mb-4">
              {/* Location */}
              <View style={{ width: '48%' }}>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                  Last Location *
                </Text>
                <TextInput
                  placeholder="e.g. Canteen bench"
                  placeholderTextColor="#94A3B8"
                  value={itemLocation}
                  onChangeText={setItemLocation}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                />
              </View>

              {/* Contact Number */}
              <View style={{ width: '48%' }}>
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                  Contact Number *
                </Text>
                <TextInput
                  placeholder="e.g. 017xxxxxxxx"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={itemContact}
                  onChangeText={setItemContact}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                />
              </View>
            </View>

            {/* Reporter (Dropdown selector strictly matching 6 names constraint) */}
            <View className="mb-6">
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-2">
                Reporter Identity *
              </Text>
              <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1 px-1">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {STUDENT_NAMES.map(name => (
                    <TouchableOpacity
                      key={name}
                      onPress={() => setItemReporter(name)}
                      className={`px-3 py-2 rounded-lg mx-1 ${itemReporter === name ? 'bg-teal-600' : 'bg-slate-100 dark:bg-slate-800'}`}
                    >
                      <Text className={`text-[9px] font-extrabold ${itemReporter === name ? 'text-white' : 'text-slate-500'}`}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Form Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-3.5 rounded-xl justify-center items-center border border-slate-200/20"
              >
                <Text className="text-slate-700 dark:text-slate-350 text-xs font-extrabold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReportItem}
                disabled={reportItemMutation.isPending}
                className="flex-1 bg-teal-600 py-3.5 rounded-xl justify-center items-center"
              >
                <Text className="text-white text-xs font-extrabold">
                  {reportItemMutation.isPending ? 'Submitting...' : 'Submit Notice'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
