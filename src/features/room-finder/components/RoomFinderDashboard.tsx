import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRoomListings } from '../hooks/useRoomFinderData';
import { RoomListing, RoomFilter } from '../types';

// Room type formatting helper
const formatRoomType = (type: string) => {
  switch (type) {
    case 'mess_seat': return 'Mess Seat';
    case 'single_room': return 'Single Room';
    case 'sublet': return 'Sublet';
    default: return 'Apartment';
  }
};

// Room badge colors mapping
const getRoomTypeColor = (type: string) => {
  switch (type) {
    case 'mess_seat': return { text: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-100 dark:border-teal-900/30' };
    case 'single_room': return { text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-100 dark:border-blue-900/30' };
    case 'sublet': return { text: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-100 dark:border-indigo-900/30' };
    default: return { text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/30' };
  }
};

export default function RoomFinderDashboard() {
  // Query Filters state
  const [filters, setFilters] = useState<RoomFilter>({
    type: 'all',
    maxRent: 10000
  });

  // Selected item detail overlay state
  const [selectedRoom, setSelectedRoom] = useState<RoomListing | null>(null);

  const { data: rooms, isLoading } = useRoomListings(filters);

  // Trigger Native Dialer call
  const handleCallHost = (phone: string) => {
    const telUrl = `tel:${phone}`;
    Linking.canOpenURL(telUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(telUrl);
        } else {
          Alert.alert('Error', 'Call operation is not supported on this device');
        }
      })
      .catch(() => Alert.alert('Error', 'An error occurred while launching call dialer'));
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {selectedRoom ? (
        // -------------------------------------------------------------
        // DETAIL VIEW OVERLAY
        // -------------------------------------------------------------
        <Animated.ScrollView 
          entering={FadeInUp.duration(300)}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Back Action button */}
          <TouchableOpacity 
            onPress={() => setSelectedRoom(null)}
            className="flex-row items-center mb-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 self-start px-3.5 py-2 rounded-xl shadow-sm"
          >
            <Ionicons name="arrow-back" size={20} color="#0D9488" />
            <Text className="text-slate-800 dark:text-slate-200 font-bold ml-2">Back to Listings</Text>
          </TouchableOpacity>

          {/* Details Card Container */}
          <View className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            {/* Header Badge */}
            <View className="flex-row justify-between items-center mb-4">
              <View className={`px-3 py-1 rounded-xl border ${getRoomTypeColor(selectedRoom.type).bg} ${getRoomTypeColor(selectedRoom.type).border}`}>
                <Text className={`font-bold text-xs ${getRoomTypeColor(selectedRoom.type).text}`}>
                  {formatRoomType(selectedRoom.type)}
                </Text>
              </View>
              <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-lg">
                ৳ {selectedRoom.rentAmount}/mo
              </Text>
            </View>

            <Text className="text-slate-900 dark:text-white text-xl font-extrabold mb-3 leading-snug">
              {selectedRoom.title}
            </Text>

            {/* Location & Seats Metadata */}
            <View className="flex-row items-center mb-3">
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1.5 font-semibold flex-1" numberOfLines={1}>
                {selectedRoom.location}
              </Text>
            </View>

            <View className="flex-row items-center mb-6 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-900">
              <Ionicons name="people-outline" size={18} color="#0D9488" />
              <Text className="text-slate-700 dark:text-slate-300 text-xs ml-2 font-bold">
                Available Seats: {selectedRoom.seatCount}
              </Text>
            </View>

            {/* Description */}
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Description</Text>
            <Text className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed mb-6 font-medium">
              {selectedRoom.description}
            </Text>

            {/* Host info and call CTA */}
            <View className="pt-5 border-t border-slate-100 dark:border-slate-800 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-900/30 justify-center items-center mr-3">
                  <Text className="text-teal-700 dark:text-teal-300 font-bold">{selectedRoom.hostName.charAt(0)}</Text>
                </View>
                <View>
                  <Text className="text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wide">Host</Text>
                  <Text className="text-slate-900 dark:text-white font-extrabold text-sm mt-0.5">{selectedRoom.hostName}</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => handleCallHost(selectedRoom.contactPhone)}
                className="bg-teal-600 dark:bg-teal-750 px-4 py-2.5 rounded-2xl flex-row items-center shadow-sm"
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={16} color="white" />
                <Text className="text-white font-bold text-sm ml-2">Call Owner</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.ScrollView>
      ) : (
        // -------------------------------------------------------------
        // LISTINGS VIEW
        // -------------------------------------------------------------
        <View className="flex-1">
          {/* A. Horizontally Scrollable Filter Pills */}
          <View className="pt-4 pb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
              {['all', 'mess_seat', 'single_room', 'sublet', 'apartment'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setFilters({ ...filters, type: t as any })}
                  className={`px-4 py-2 rounded-full mr-2.5 border ${
                    filters.type === t
                      ? 'bg-teal-600 border-teal-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800'
                  }`}
                  activeOpacity={0.8}
                >
                  <Text className={`font-bold text-xs ${filters.type === t ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                    {t === 'all' ? 'All Types' : formatRoomType(t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* B. Budget Selectors */}
          <View className="px-4 py-2 flex-row justify-between gap-2.5">
            {[10000, 1500, 3000, 8000].map(amt => (
              <TouchableOpacity
                key={amt}
                onPress={() => setFilters({ ...filters, maxRent: amt })}
                className={`flex-1 py-2 rounded-xl border items-center ${
                  filters.maxRent === amt
                    ? 'bg-teal-50 border-teal-500 dark:bg-teal-950/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/40 dark:border-slate-800'
                }`}
                activeOpacity={0.8}
              >
                <Text className={`text-[10px] font-bold ${filters.maxRent === amt ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {amt === 10000 ? 'Any Budget' : `Under ৳${amt}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* C. Vertical List of Listings */}
          <ScrollView 
            className="flex-1 px-4 mt-4"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View className="flex-1 justify-center items-center py-20">
                <Text className="text-slate-400 text-sm font-semibold">Scanning listings...</Text>
              </View>
            ) : rooms && rooms.length > 0 ? (
              rooms.map((room, index) => (
                <Animated.View
                  key={room.id}
                  entering={FadeInUp.delay(index * 60).duration(400)}
                  layout={Layout.springify()}
                  className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-3xl p-5 mb-4 shadow-sm"
                >
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => setSelectedRoom(room)}
                  >
                    {/* Item category header */}
                    <View className="flex-row justify-between items-center mb-3">
                      <View className={`px-2.5 py-0.5 rounded-md border ${getRoomTypeColor(room.type).bg} ${getRoomTypeColor(room.type).border}`}>
                        <Text className={`font-extrabold text-[9px] uppercase tracking-wide ${getRoomTypeColor(room.type).text}`}>
                          {formatRoomType(room.type)}
                        </Text>
                      </View>
                      <Text className="text-slate-400 text-[10px] font-semibold">Available</Text>
                    </View>

                    {/* Title & rent */}
                    <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-base mb-1" numberOfLines={1}>
                      {room.title}
                    </Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm mb-3">
                      ৳ {room.rentAmount}/mo
                    </Text>

                    {/* Location Metadata */}
                    <View className="flex-row items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Ionicons name="location-outline" size={14} color="#94A3B8" />
                      <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold ml-1.5 flex-1" numberOfLines={1}>
                        {room.location}
                      </Text>
                      
                      <View className="flex-row items-center bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                        <Text className="text-slate-600 dark:text-slate-400 text-[9px] font-bold">Seats: {room.seatCount}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="sad-outline" size={48} color="#94A3B8" />
                <Text className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-4">No listings match filters.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
