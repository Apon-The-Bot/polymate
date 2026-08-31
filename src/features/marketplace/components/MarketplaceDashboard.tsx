import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, Modal, KeyboardAvoidingView, Platform, Alert, Linking, Switch } from 'react-native';
import Animated, { FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useMarketplaceListings, useCreateListing } from '../hooks/useMarketplaceData';
import { MarketplaceListing, ListingCategory, SortOption, ConditionFilter } from '../types';

const { width } = Dimensions.get('window');

const CATEGORIES: { value: ListingCategory; label: string; icon: string }[] = [
  { value: 'all', label: 'All Items', icon: 'grid-sharp' },
  { value: 'books_notes', label: 'Books & Notes', icon: 'book-sharp' },
  { value: 'drawing_tools', label: 'Drawing Tools', icon: 'construct-sharp' },
  { value: 'electronics', label: 'Electronics', icon: 'hardware-chip-sharp' },
  { value: 'mess_furniture', label: 'Mess Furniture', icon: 'bed-sharp' },
  { value: 'cycles_bikes', label: 'Cycles & Bikes', icon: 'bicycle-sharp' },
  { value: 'others', label: 'Others', icon: 'cart-sharp' }
];

export default function MarketplaceDashboard() {
  const { data: listings = [], isLoading } = useMarketplaceListings();
  const createListingMutation = useCreateListing();

  // Search, Category, and Advanced Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterCondition, setFilterCondition] = useState<ConditionFilter>('all');
  const [filterNegotiableOnly, setFilterNegotiableOnly] = useState(false);
  
  // Show/Hide Filter Panel
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Selected Detail Modal
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  
  // Create Form State
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'books_notes' | 'drawing_tools' | 'electronics' | 'mess_furniture' | 'cycles_bikes' | 'others'>('books_notes');
  const [formCondition, setFormCondition] = useState<'new' | 'like_new' | 'good' | 'fair'>('like_new');
  const [formPrice, setFormPrice] = useState('');
  const [formNegotiable, setFormNegotiable] = useState(false);
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // 1. Filter and Sort Logic
  const filteredListings = listings
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesCondition = filterCondition === 'all' || item.condition === filterCondition;
      const matchesNegotiable = !filterNegotiableOnly || item.isNegotiable;
      return matchesSearch && matchesCategory && matchesCondition && matchesNegotiable;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      // Default: Newest first (id desc or createdAt desc)
      return b.id - a.id;
    });

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return { label: 'Brand New', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' };
      case 'like_new': return { label: 'Like New', bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' };
      case 'good': return { label: 'Good', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' };
      default: return { label: 'Fair', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'books_notes': return { name: 'book-sharp', bg: 'bg-blue-100/50 dark:bg-blue-950/40', color: '#3B82F6' };
      case 'drawing_tools': return { name: 'construct-sharp', bg: 'bg-emerald-100/50 dark:bg-emerald-950/40', color: '#10B981' };
      case 'electronics': return { name: 'hardware-chip-sharp', bg: 'bg-orange-100/50 dark:bg-orange-950/40', color: '#F97316' };
      case 'mess_furniture': return { name: 'bed-sharp', bg: 'bg-purple-100/50 dark:bg-purple-950/40', color: '#8B5CF6' };
      case 'cycles_bikes': return { name: 'bicycle-sharp', bg: 'bg-rose-100/50 dark:bg-rose-950/40', color: '#F43F5E' };
      default: return { name: 'cart-sharp', bg: 'bg-slate-100/60 dark:bg-slate-800/40', color: '#64748B' };
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = CATEGORIES.find(c => c.value === category);
    return found ? found.label : 'Other';
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate a phone call on this device.');
    });
  };

  const handleWhatsApp = (phone: string, title: string) => {
    // Format bangladeshi phone numbers to start with 88
    let cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '88' + cleanPhone;
    }
    const message = `Assalamu Alaikum, I am interested in your item "${title}" listed on PolyMate. Is it still available?`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on this device.');
    });
  };

  const handleCreateListing = () => {
    if (!formTitle || !formPrice || !formPhone || !formLocation || !formDesc) {
      Alert.alert('Validation Error', 'Please fill in all the required fields.');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than zero.');
      return;
    }

    createListingMutation.mutate({
      title: formTitle,
      category: formCategory,
      condition: formCondition,
      price: priceNum,
      isNegotiable: formNegotiable,
      sellerPhone: formPhone,
      location: formLocation,
      description: formDesc,
      images: []
    }, {
      onSuccess: () => {
        // Reset states
        setFormTitle('');
        setFormCategory('books_notes');
        setFormCondition('like_new');
        setFormPrice('');
        setFormNegotiable(false);
        setFormPhone('');
        setFormLocation('');
        setFormDesc('');
        setIsCreateModalVisible(false);
        Alert.alert('Success', 'Your item has been successfully listed on the marketplace.');
      }
    });
  };

  const cardWidth = (width - 44) / 2; // Split into 2 columns with paddings

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      
      {/* Header bar and controls (Bikroy / FB Marketplace Inspired) */}
      <View className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/80 px-4 pt-3 pb-3">
        {/* Quick action bar */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center bg-teal-50 dark:bg-teal-950/20 px-3 py-1 rounded-full border border-teal-100/50 dark:border-teal-900/30">
            <Ionicons name="location-sharp" size={13} color="#0D9488" />
            <Text className="text-teal-700 dark:text-teal-400 text-[10px] font-extrabold ml-1 uppercase">Dhaka Polytechnic</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex-row items-center px-3 py-1 rounded-full border ${
              showFilterPanel 
                ? 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700' 
                : 'border-slate-200/60 dark:border-slate-800'
            }`}
          >
            <Ionicons name="funnel-sharp" size={12} color="#475569" />
            <Text className="text-slate-600 dark:text-slate-300 text-[10px] font-extrabold ml-1 uppercase">Filter / Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Search input field */}
        <View className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl flex-row items-center">
          <Ionicons name="search-sharp" size={16} color="#94A3B8" />
          <TextInput 
            placeholder="Search books, cycles, chairs, calculators..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-2.5 text-slate-800 dark:text-white flex-1 text-xs font-semibold"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle-sharp" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Panel (Slide Down Effect) */}
        {showFilterPanel && (
          <Animated.View 
            entering={FadeInUp.duration(300)}
            className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80"
          >
            {/* Sort options */}
            <View className="mb-3">
              <Text className="text-slate-400 text-[9px] font-extrabold uppercase mb-1.5 tracking-wider">Sort by Price/Date</Text>
              <View className="flex-row">
                {(['newest', 'price_low', 'price_high'] as const).map(opt => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSortBy(opt)}
                    className={`px-3 py-1.5 rounded-lg mr-2 border ${
                      sortBy === opt 
                        ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white' 
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200/40 dark:border-slate-800'
                    }`}
                  >
                    <Text className={`text-[9px] font-extrabold ${
                      sortBy === opt ? 'text-white dark:text-slate-950' : 'text-slate-500'
                    }`}>
                      {opt === 'newest' ? 'Newest Arrivals' : opt === 'price_low' ? 'Price: Low to High' : 'Price: High to Low'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Condition Filters */}
            <View className="mb-3">
              <Text className="text-slate-400 text-[9px] font-extrabold uppercase mb-1.5 tracking-wider">Condition</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {(['all', 'new', 'like_new', 'good', 'fair'] as const).map(cond => (
                  <TouchableOpacity
                    key={cond}
                    onPress={() => setFilterCondition(cond)}
                    className={`px-3 py-1.5 rounded-lg border ${
                      filterCondition === cond 
                        ? 'bg-teal-600 border-teal-600' 
                        : 'bg-slate-50 dark:bg-slate-850 border-slate-200/40 dark:border-slate-800'
                    }`}
                  >
                    <Text className={`text-[9px] font-extrabold ${
                      filterCondition === cond ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {cond === 'all' ? 'All Conditions' : cond === 'like_new' ? 'Like New' : cond.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Negotiable Filter */}
            <View className="flex-row items-center justify-between pt-1">
              <View>
                <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">Negotiable Items Only</Text>
                <Text className="text-slate-400 text-[9px]">Only show listings open to bargaining</Text>
              </View>
              <Switch
                value={filterNegotiableOnly}
                onValueChange={setFilterNegotiableOnly}
                trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
                thumbColor={Platform.OS === 'android' ? '#F1F5F9' : undefined}
              />
            </View>
          </Animated.View>
        )}

        {/* Horizontal Category Selection Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mt-3.5"
          contentContainerStyle={{ paddingRight: 10, paddingBottom: 2 }}
        >
          {CATEGORIES.map((item) => {
            const isSelected = selectedCategory === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setSelectedCategory(item.value)}
                className={`flex-row items-center px-3.5 py-1.5 rounded-lg mr-2 border ${
                  isSelected 
                    ? 'bg-teal-600 border-teal-600' 
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/40 dark:border-slate-800'
                }`}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={12} 
                  color={isSelected ? 'white' : '#64748B'} 
                  className="mr-1.5"
                />
                <Text className={`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Listings Grid */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="flex-row flex-wrap justify-between">
          {filteredListings.length === 0 ? (
            <View className="w-full py-20 items-center justify-center">
              <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 justify-center items-center mb-3">
                <Ionicons name="cart-outline" size={32} color="#94A3B8" />
              </View>
              <Text className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">No items found</Text>
              <Text className="text-slate-400 text-xs mt-1 text-center px-6 leading-relaxed">
                Try clearing search filters or be the first to sell engineering books, tools, and calculators!
              </Text>
            </View>
          ) : (
            filteredListings.map((item, index) => {
              const cond = getConditionLabel(item.condition);
              const catIcon = getCategoryIcon(item.category);
              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInUp.delay(index * 40).duration(400)}
                  style={{ width: cardWidth }}
                  className="mb-4"
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setSelectedListing(item)}
                    className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs"
                  >
                    {/* Placeholder Canvas Image Container */}
                    <View className="h-28 bg-slate-50 dark:bg-slate-950/60 justify-center items-center relative">
                      <View className={`w-11 h-11 rounded-full ${catIcon.bg} justify-center items-center`}>
                        <Ionicons name={catIcon.name as any} size={20} color={catIcon.color} />
                      </View>
                      
                      {/* Condition Tag Overlay */}
                      <View className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md border ${cond.bg} border-slate-200/10`}>
                        <Text className={`text-[8px] font-extrabold uppercase ${cond.text}`}>
                          {cond.label}
                        </Text>
                      </View>

                      {/* Negotiable Indicator Badge */}
                      {item.isNegotiable && (
                        <View className="absolute bottom-2.5 left-2.5 bg-teal-600 px-1.5 py-0.5 rounded">
                          <Text className="text-white text-[7px] font-bold uppercase">Negotiable</Text>
                        </View>
                      )}
                    </View>

                    {/* Meta Content Section */}
                    <View className="p-3">
                      <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        {getCategoryLabel(item.category)}
                      </Text>
                      <Text className="text-xs font-extrabold text-slate-855 dark:text-slate-100 mt-0.5 tracking-tight h-8" numberOfLines={2}>
                        {item.title}
                      </Text>

                      {/* Location marker */}
                      <View className="flex-row items-center mt-2.5">
                        <Ionicons name="location-outline" size={10} color="#94A3B8" />
                        <Text className="text-slate-400 text-[8px] font-bold ml-0.5" numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-slate-50 dark:border-slate-850">
                        <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                          ৳ {item.price}
                        </Text>
                        <Text className="text-slate-400 text-[8px] font-bold">
                          {item.sellerName}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) to Add Items */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsCreateModalVisible(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-teal-600 rounded-full justify-center items-center shadow-lg shadow-teal-600/30 z-30"
      >
        <Ionicons name="add-sharp" size={28} color="white" />
      </TouchableOpacity>

      {/* 1. Modal: Advanced Item Details Bottom Sheet */}
      <Modal
        visible={selectedListing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedListing(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1}
            onPress={() => setSelectedListing(null)}
          />
          {selectedListing && (
            <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 border-t border-slate-200/50 dark:border-slate-800">
              {/* Drag bar indicator */}
              <View className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full align-self-center mx-auto mb-5" />

              {/* Tag header */}
              <View className="flex-row justify-between items-center mb-2.5">
                <View className="flex-row items-center bg-teal-50 dark:bg-teal-950/20 px-2.5 py-0.5 rounded-lg border border-teal-100/50 dark:border-teal-900/30">
                  <Text className="text-teal-600 dark:text-teal-400 text-[9px] font-extrabold uppercase">
                    {getCategoryLabel(selectedListing.category)}
                  </Text>
                </View>
                <Text className="text-slate-400 text-[9px] font-bold">
                  Posted: {selectedListing.createdAt}
                </Text>
              </View>

              {/* Title */}
              <Text className="text-lg font-extrabold text-slate-950 dark:text-white mb-3 leading-tight">
                {selectedListing.title}
              </Text>

              {/* Info details blocks */}
              <View className="flex-row flex-wrap gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <View className="bg-slate-50 dark:bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-850 items-start">
                  <Text className="text-slate-400 text-[8px] font-extrabold uppercase">Price</Text>
                  <Text className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ৳ {selectedListing.price} {selectedListing.isNegotiable && <Text className="text-[10px] font-bold text-slate-400">(Nego)</Text>}
                  </Text>
                </View>

                <View className="bg-slate-50 dark:bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-850 items-start">
                  <Text className="text-slate-400 text-[8px] font-extrabold uppercase">Condition</Text>
                  <Text className={`text-xs font-extrabold mt-0.5 uppercase ${getConditionLabel(selectedListing.condition).text}`}>
                    {getConditionLabel(selectedListing.condition).label}
                  </Text>
                </View>

                <View className="bg-slate-50 dark:bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-850 items-start flex-1">
                  <Text className="text-slate-400 text-[8px] font-extrabold uppercase">📍 Location</Text>
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold mt-0.5" numberOfLines={1}>
                    {selectedListing.location}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <Text className="text-slate-400 text-[9px] font-extrabold uppercase mb-2">Details Description</Text>
              <Text className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed font-semibold mb-6">
                {selectedListing.description}
              </Text>

              {/* Seller details card and contact actions */}
              <View className="bg-slate-50 dark:bg-slate-950/60 p-4.5 rounded-xl border border-slate-100 dark:border-slate-850 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-teal-500/10 justify-center items-center mr-3 border border-teal-500/20">
                      <Text className="text-teal-600 dark:text-teal-400 font-extrabold text-sm">
                        {selectedListing.sellerName.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-slate-855 dark:text-slate-200 font-extrabold text-xs">
                        {selectedListing.sellerName}
                      </Text>
                      <Text className="text-slate-400 text-[10px] mt-0.5">
                        Dhaka Polytechnic Student
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Double CTA Contacts */}
                <View className="flex-row gap-2.5">
                  <TouchableOpacity
                    onPress={() => handleCall(selectedListing.sellerPhone)}
                    activeOpacity={0.8}
                    className="flex-1 bg-slate-900 dark:bg-white py-3.5 rounded-xl flex-row justify-center items-center"
                  >
                    <Ionicons name="call-sharp" size={14} color={Platform.OS === 'ios' ? 'white' : '#0F172A'} />
                    <Text className="text-white dark:text-slate-950 text-xs font-extrabold ml-2">Direct Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleWhatsApp(selectedListing.sellerPhone, selectedListing.title)}
                    activeOpacity={0.8}
                    className="flex-1 bg-emerald-600 py-3.5 rounded-xl flex-row justify-center items-center"
                  >
                    <Ionicons name="logo-whatsapp" size={15} color="white" />
                    <Text className="text-white text-xs font-extrabold ml-2">WhatsApp Chat</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedListing(null)}
                className="w-full bg-slate-100 dark:bg-slate-800 py-3.5 rounded-xl justify-center items-center border border-slate-200/20"
              >
                <Text className="text-slate-700 dark:text-slate-300 text-xs font-extrabold">Close Window</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* 2. Modal: Create Listing Form Modal */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60"
        >
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1}
            onPress={() => setIsCreateModalVisible(false)}
          />
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[90%] border-t border-slate-200/50 dark:border-slate-800">
            <View className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full align-self-center mx-auto mb-5" />

            <Text className="text-lg font-extrabold text-slate-950 dark:text-white mb-4 tracking-tight">
              Sell on PolyMate Marketplace
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              
              {/* Title */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">
                  Listing Title *
                </Text>
                <TextInput
                  placeholder="e.g. T-Square scale, Phoenix Cycle, Bed sheet"
                  placeholderTextColor="#94A3B8"
                  value={formTitle}
                  onChangeText={setFormTitle}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                />
              </View>

              {/* Category selector */}
              <View className="mb-4">
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">
                  Item Category *
                </Text>
                <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1.5 px-1">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {(['books_notes', 'drawing_tools', 'electronics', 'mess_furniture', 'cycles_bikes', 'others'] as const).map(cat => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setFormCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg mx-1 ${formCategory === cat ? 'bg-teal-600' : 'bg-slate-100 dark:bg-slate-800'}`}
                      >
                        <Text className={`text-[9px] font-extrabold capitalize ${formCategory === cat ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {cat.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Grid: Condition and Location */}
              <View className="flex-row justify-between mb-4">
                {/* Condition */}
                <View style={{ width: '48%' }}>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">
                    Condition *
                  </Text>
                  <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1 px-1">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {(['new', 'like_new', 'good', 'fair'] as const).map(cond => (
                        <TouchableOpacity
                          key={cond}
                          onPress={() => setFormCondition(cond)}
                          className={`px-3 py-1.5 rounded-lg mx-1 ${formCondition === cond ? 'bg-teal-600' : 'bg-slate-100 dark:bg-slate-800'}`}
                        >
                          <Text className={`text-[9px] font-extrabold capitalize ${formCondition === cond ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {cond === 'like_new' ? 'Like New' : cond.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Location */}
                <View style={{ width: '48%' }}>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">
                    📍 Location Area *
                  </Text>
                  <TextInput
                    placeholder="e.g. Polytechnic Mor"
                    placeholderTextColor="#94A3B8"
                    value={formLocation}
                    onChangeText={setFormLocation}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  />
                </View>
              </View>

              {/* Grid: Price and Phone */}
              <View className="flex-row justify-between mb-4">
                {/* Price */}
                <View style={{ width: '48%' }}>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">
                    Price (৳) *
                  </Text>
                  <TextInput
                    placeholder="Price value"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={formPrice}
                    onChangeText={setFormPrice}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  />
                </View>

                {/* Contact Phone */}
                <View style={{ width: '48%' }}>
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">
                    WhatsApp / Phone No. *
                  </Text>
                  <TextInput
                    placeholder="e.g. 017xxxxxxxx"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={formPhone}
                    onChangeText={setFormPhone}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                  />
                </View>
              </View>

              {/* Negotiable Toggle & Description */}
              <View className="flex-row items-center justify-between mb-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/30">
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">Negotiable Price</Text>
                  <Text className="text-slate-400 text-[8px]">Open to reasonable bargaining</Text>
                </View>
                <Switch
                  value={formNegotiable}
                  onValueChange={setFormNegotiable}
                  trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
                  thumbColor={Platform.OS === 'android' ? '#F1F5F9' : undefined}
                />
              </View>

              {/* Description */}
              <View className="mb-4.5">
                <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">
                  Item Description *
                </Text>
                <TextInput
                  placeholder="Describe item condition, inclusions, pick up location..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  value={formDesc}
                  onChangeText={setFormDesc}
                  textAlignVertical="top"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-white h-24"
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setIsCreateModalVisible(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-3.5 rounded-xl justify-center items-center border border-slate-200/20"
              >
                <Text className="text-slate-700 dark:text-slate-350 text-xs font-extrabold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateListing}
                disabled={createListingMutation.isPending}
                className="flex-1 bg-teal-600 py-3.5 rounded-xl justify-center items-center"
              >
                <Text className="text-white text-xs font-extrabold">
                  {createListingMutation.isPending ? 'Publishing...' : 'Publish Listing'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
