import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import Animated, { FadeInUp, Layout, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useStudyDocuments } from '../hooks/useStudyHubData';
import { StudyDocument, StudyFilter } from '../types';

// Format category text
const formatCategory = (cat: string) => {
  switch (cat) {
    case 'note': return 'Notes';
    case 'lecture_pdf': return 'Lectures';
    case 'board_question': return 'Board Qs';
    default: return 'Syllabus';
  }
};

// Category style mapping
const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'note': return { text: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-100 dark:border-teal-900/30', color: '#0D9488' };
    case 'lecture_pdf': return { text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-100 dark:border-blue-900/30', color: '#2563EB' };
    case 'board_question': return { text: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-100 dark:border-rose-900/30', color: '#E11D48' };
    default: return { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-900/30', color: '#D97706' };
  }
};

export default function StudyHubDashboard() {
  const [filters, setFilters] = useState<StudyFilter>({
    category: 'all',
    semester: 'all',
    department: 'Computer',
    searchQuery: ''
  });

  const { data: docs, isLoading } = useStudyDocuments(filters);

  // States to track simulated downloads
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);
  const [downloadedDocs, setDownloadedDocs] = useState<Record<number, boolean>>({});
  
  // Reanimated progress value (0 to 1)
  const downloadProgress = useSharedValue(0);

  const startSimulatedDownload = (doc: StudyDocument) => {
    if (downloadingDocId !== null) return; // Prevent concurrent downloads

    setDownloadingDocId(doc.id);
    downloadProgress.value = 0;
    
    // Animate progress bar over 1.8 seconds
    downloadProgress.value = withTiming(1, { duration: 1800 }, (finished) => {
      if (finished) {
        // Run on main thread callback to trigger URL open and success state
        React.runOnJS(handleDownloadComplete)(doc);
      }
    });
  };

  const handleDownloadComplete = (doc: StudyDocument) => {
    setDownloadedDocs(prev => ({ ...prev, [doc.id]: true }));
    setDownloadingDocId(null);
    
    // Open file URL
    Linking.openURL(doc.fileUrl).catch(() => {
      Alert.alert('Error', 'Unable to open document link.');
    });
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${downloadProgress.value * 100}%`
  }));

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* A. Search Bar */}
      <View className="px-4 pt-4">
        <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-4 py-3 rounded-2xl flex-row items-center shadow-sm">
          <Ionicons name="search-sharp" size={18} color="#94A3B8" />
          <TextInput 
            value={filters.searchQuery}
            onChangeText={(text) => setFilters({ ...filters, searchQuery: text })}
            placeholder="Search notes, java, microprocessor..."
            placeholderTextColor="#94A3B8"
            className="ml-3 text-slate-800 dark:text-white flex-1 text-sm font-semibold"
          />
          {filters.searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setFilters({ ...filters, searchQuery: '' })}>
              <Ionicons name="close-circle-sharp" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* B. Horizontally Scrollable Category Pills */}
      <View className="pt-4 pb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {['all', 'note', 'lecture_pdf', 'board_question', 'syllabus'].map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setFilters({ ...filters, category: c as any })}
              className={`px-4 py-2 rounded-full mr-2.5 border ${
                filters.category === c
                  ? 'bg-teal-600 border-teal-600 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800'
              }`}
              activeOpacity={0.8}
            >
              <Text className={`font-bold text-xs ${filters.category === c ? 'text-white' : 'text-slate-650 dark:text-slate-400'}`}>
                {c === 'all' ? 'All Archive' : formatCategory(c)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* C. Horizontally Scrollable Semesters */}
      <View className="py-2 border-b border-slate-200/30 dark:border-slate-800/30">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {['all', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setFilters({ ...filters, semester: s as any })}
              className={`px-3 py-1.5 rounded-xl mr-2 ${
                filters.semester === s
                  ? 'bg-teal-50 border border-teal-500/20 dark:bg-teal-950/20'
                  : 'bg-transparent border border-transparent'
              }`}
              activeOpacity={0.8}
            >
              <Text className={`font-bold text-xs ${filters.semester === s ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>
                {s === 'all' ? 'All Semesters' : `${s} Sem`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* D. Document List View */}
      <ScrollView 
        className="flex-1 px-4 mt-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-slate-400 text-sm font-semibold">Loading archive...</Text>
          </View>
        ) : docs && docs.length > 0 ? (
          docs.map((doc, index) => {
            const catStyle = getCategoryColor(doc.category);
            const isDownloading = downloadingDocId === doc.id;
            const isDownloaded = downloadedDocs[doc.id];
            
            return (
              <Animated.View
                key={doc.id}
                entering={FadeInUp.delay(index * 60).duration(400)}
                layout={Layout.springify()}
                className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/80 rounded-3xl p-5 mb-4 shadow-sm relative overflow-hidden"
              >
                {/* Simulated Download Progress Bar */}
                {isDownloading && (
                  <View className="absolute left-0 right-0 bottom-0 h-1.5 bg-slate-100 dark:bg-slate-800">
                    <Animated.View style={animatedProgressStyle} className="h-full bg-teal-500" />
                  </View>
                )}

                <View className="flex-row justify-between items-center mb-3">
                  <View className={`px-2.5 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.border}`}>
                    <Text className={`font-extrabold text-[9px] uppercase tracking-wide ${catStyle.text}`}>
                      {formatCategory(doc.category)}
                    </Text>
                  </View>
                  <Text className="text-slate-400 text-[10px] font-bold">Subject: {doc.subjectCode}</Text>
                </View>

                <Text className="text-slate-800 dark:text-slate-100 font-extrabold text-base mb-1" numberOfLines={1}>
                  {doc.title}
                </Text>
                <Text className="text-slate-400 text-xs font-semibold" numberOfLines={1}>
                  {doc.subjectName}
                </Text>

                <View className="flex-row justify-between items-center pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <View className="flex-row items-center">
                    <View className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 justify-center items-center mr-2">
                      <Ionicons name="person-circle-outline" size={14} color="#94A3B8" />
                    </View>
                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                      By: {doc.uploaderName} ({doc.fileSize || 'N/A'})
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => startSimulatedDownload(doc)}
                    disabled={isDownloading}
                    className={`px-4 py-2 rounded-xl flex-row items-center border ${
                      isDownloaded 
                        ? 'bg-emerald-50 border-emerald-250 dark:bg-emerald-950/20' 
                        : 'bg-teal-600 border-teal-600 dark:bg-teal-750'
                    }`}
                    activeOpacity={0.8}
                  >
                    {isDownloading ? (
                      <>
                        <Ionicons name="cloud-download-sharp" size={14} color="#0D9488" />
                        <Text className="text-teal-600 dark:text-teal-400 font-extrabold text-xs ml-1.5">Downloading...</Text>
                      </>
                    ) : isDownloaded ? (
                      <>
                        <Ionicons name="checkmark-done" size={14} color="#10B981" />
                        <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs ml-1.5">Opened</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="arrow-down-circle-sharp" size={14} color="white" />
                        <Text className="text-white font-extrabold text-xs ml-1.5">Download</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-4">No documents found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
