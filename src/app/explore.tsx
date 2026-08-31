import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, useColorScheme, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useUpdateProfile, useChangePassword } from '../features/dashboard/hooks/useDashboardData';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const safeAreaInsets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuthStore();

  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.currentAddress || '');
  const [editDept, setEditDept] = useState(user?.department || '');
  const [editSession, setEditSession] = useState(user?.session || '');

  // Change Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogout = async () => {
    await logout();
  };

  const handleSaveProfile = () => {
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert('Required Fields', 'Full Name and Phone Number are required.');
      return;
    }

    updateProfileMutation.mutate({
      name: editName.trim(),
      phone: editPhone.trim(),
      currentAddress: editAddress.trim(),
      department: editDept.trim(),
      session: editSession.trim()
    }, {
      onSuccess: () => {
        // Sync local authStore session immediately
        updateUser({
          name: editName.trim(),
          phone: editPhone.trim(),
          currentAddress: editAddress.trim(),
          department: editDept.trim(),
          session: editSession.trim()
        });
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
      },
      onError: (err: any) => {
        Alert.alert('Failed', err.response?.data?.error || 'Failed to update profile.');
      }
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required Fields', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Password changed successfully!');
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
      onError: (err: any) => {
        Alert.alert('Failed', err.response?.data?.error || 'Failed to change password.');
      }
    });
  };

  // If user object is null, display brief unauthorized message
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50 dark:bg-slate-955 p-6">
        <Ionicons name="lock-closed-outline" size={48} color="#94A3B8" />
        <Text className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-4 text-center">
          Not Authorized
        </Text>
        <Text className="text-slate-400 text-xs mt-1 text-center">
          Please log in to view your profile details.
        </Text>
      </View>
    );
  }

  const isStudent = user.role === 'student';
  const nameInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  const containerPadding = Platform.select({
    ios: { paddingTop: safeAreaInsets.top, paddingBottom: safeAreaInsets.bottom + 40 },
    android: { paddingTop: safeAreaInsets.top + 16, paddingBottom: safeAreaInsets.bottom + 40 },
    default: { paddingTop: 24, paddingBottom: 40 }
  });

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-slate-50 dark:bg-slate-955"
      contentContainerStyle={containerPadding}
    >
      <View className="px-5">
        
        {/* Header branding */}
        <View className="items-center mb-6">
          <Text className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Profile</Text>
          <Text className="text-slate-400 text-xs mt-1 font-semibold">Manage your account & info</Text>
        </View>

        {/* 1. Large Avatar Profile Header */}
        <Animated.View 
          entering={FadeInUp.delay(100).duration(500)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 items-center shadow-xs mb-5"
        >
          {/* Circular avatar badge */}
          <View className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-955 border border-slate-200/40 dark:border-slate-800 justify-center items-center mb-3">
            <Text className="text-teal-600 dark:text-teal-400 text-3xl font-black">{nameInitial}</Text>
          </View>
          <Text className="text-slate-800 dark:text-slate-100 text-lg font-extrabold tracking-tight">{user.name}</Text>
          <View className="bg-slate-50 dark:bg-slate-955 px-3 py-1 rounded-xl border border-slate-200/40 dark:border-slate-850 mt-2.5">
            <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
              Role: {user.role === 'student' ? 'Student' : 'General User'}
            </Text>
          </View>
        </Animated.View>

        {!isEditing ? (
          // VIEW MODE
          <>
            {/* 2. Personal & Account Details */}
            <Animated.View 
              entering={FadeInUp.delay(150).duration(500)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs mb-5"
            >
              <Text className="text-slate-900 dark:text-white text-xs font-extrabold mb-4 border-b border-slate-50 dark:border-slate-850 pb-2 uppercase tracking-wide">
                📞 Contact Information
              </Text>

              {/* Email Row */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="mail-outline" size={16} color="#0D9488" style={{ marginRight: 12 }} />
                  <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Email Address</Text>
                </View>
                <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">{user.email}</Text>
              </View>

              {/* Phone Row */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="call-outline" size={16} color="#0D9488" style={{ marginRight: 12 }} />
                  <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Mobile Number</Text>
                </View>
                <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">{user.phone}</Text>
              </View>

              {/* Address Row */}
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="location-outline" size={16} color="#0D9488" style={{ marginRight: 12 }} />
                  <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Current Address</Text>
                </View>
                <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold max-w-[50%] text-right" numberOfLines={2}>
                  {user.currentAddress || 'N/A'}
                </Text>
              </View>
            </Animated.View>

            {/* 3. Academic Details (Students Only) */}
            {isStudent && (
              <Animated.View 
                entering={FadeInUp.delay(200).duration(500)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs mb-5"
              >
                <Text className="text-slate-900 dark:text-white text-xs font-extrabold mb-4 border-b border-slate-50 dark:border-slate-850 pb-2 uppercase tracking-wide">
                  🎓 Academic Information
                </Text>

                {/* Polytechnic */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="school-outline" size={16} color="#3B82F6" style={{ marginRight: 12 }} />
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Polytechnic</Text>
                  </View>
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold max-w-[60%] text-right" numberOfLines={1}>
                    {user.instituteName || 'Dhaka Polytechnic Institute'}
                  </Text>
                </View>

                {/* Department */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="git-branch-outline" size={16} color="#3B82F6" style={{ marginRight: 12 }} />
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Department</Text>
                  </View>
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">{user.department}</Text>
                </View>

                {/* Session & Semester */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="calendar-outline" size={16} color="#3B82F6" style={{ marginRight: 12 }} />
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Session / Semester</Text>
                  </View>
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">
                    {user.session} ({user.semester || '5th'})
                  </Text>
                </View>

                {/* Board Roll */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="barcode-outline" size={16} color="#3B82F6" style={{ marginRight: 12 }} />
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Board Roll No.</Text>
                  </View>
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">{user.rollNo}</Text>
                </View>

                {/* Reg No */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="card-outline" size={16} color="#3B82F6" style={{ marginRight: 12 }} />
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Registration No.</Text>
                  </View>
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold">{user.registrationNo || 'N/A'}</Text>
                </View>
              </Animated.View>
            )}

            {/* 4. Action Settings List */}
            <Animated.View 
              entering={FadeInUp.delay(250).duration(500)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-2.5 shadow-xs mb-6"
            >
              {/* Edit Profile */}
              <TouchableOpacity 
                onPress={() => {
                  setEditName(user.name || '');
                  setEditPhone(user.phone || '');
                  setEditAddress(user.currentAddress || '');
                  setEditDept(user.department || '');
                  setEditSession(user.session || '');
                  setIsEditing(true);
                }}
                className="flex-row justify-between items-center p-3 rounded-2xl active:bg-slate-50 dark:active:bg-slate-950"
              >
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-955 justify-center items-center mr-3">
                    <Ionicons name="create-outline" size={15} color="#475569" />
                  </View>
                  <Text className="text-slate-700 dark:text-slate-350 text-xs font-extrabold">Edit Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Change Password */}
              <TouchableOpacity 
                onPress={() => setShowPasswordModal(true)}
                className="flex-row justify-between items-center p-3 rounded-2xl active:bg-slate-50 dark:active:bg-slate-950"
              >
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-955 justify-center items-center mr-3">
                    <Ionicons name="key-outline" size={15} color="#475569" />
                  </View>
                  <Text className="text-slate-700 dark:text-slate-350 text-xs font-extrabold">Change Password</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          // EDIT MODE
          <Animated.View 
            entering={FadeInUp.duration(400)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-xs mb-5"
          >
            <Text className="text-slate-900 dark:text-white text-xs font-extrabold mb-5 border-b border-slate-50 dark:border-slate-850 pb-2 uppercase tracking-wide">
              ✏️ Edit Profile Info
            </Text>

            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Full Name *</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Amanullah Sheikh"
                placeholderTextColor="#94A3B8"
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            {/* Phone Input */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Mobile Number *</Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="e.g. 01712345678"
                placeholderTextColor="#94A3B8"
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            {/* Address Input */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Current Address</Text>
              <TextInput
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="e.g. BPI Hostel, Room 402"
                placeholderTextColor="#94A3B8"
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            {isStudent && (
              <>
                {/* Department Input */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Department</Text>
                  <TextInput
                    value={editDept}
                    onChangeText={setEditDept}
                    placeholder="e.g. Computer Science"
                    placeholderTextColor="#94A3B8"
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </View>

                {/* Session Input */}
                <View className="mb-6">
                  <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Session</Text>
                  <TextInput
                    value={editSession}
                    onChangeText={setEditSession}
                    placeholder="e.g. 2021-22"
                    placeholderTextColor="#94A3B8"
                    className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 px-4 py-2.5 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
                  />
                </View>
              </>
            )}

            {/* Buttons Row */}
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={() => setIsEditing(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 py-3.5 rounded-xl justify-center items-center"
              >
                <Text className="text-slate-700 dark:text-slate-350 text-xs font-extrabold uppercase">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="flex-1 bg-teal-600 py-3.5 rounded-xl justify-center items-center"
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-xs font-extrabold uppercase">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* 5. Logout Button (At the very bottom as standard design guidelines) */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            className="w-full bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 py-3.5 rounded-2xl justify-center items-center flex-row shadow-sm"
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text className="text-rose-600 dark:text-rose-450 text-xs font-extrabold uppercase tracking-wider">
              Log Out
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </View>

      {/* ==========================================================================
          MODAL: CHANGE PASSWORD
          ========================================================================== */}
      <Modal visible={showPasswordModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 pb-10 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-slate-900 dark:text-white text-sm font-extrabold">Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Current Password */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Current Password *</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            {/* New Password */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">New Password *</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Min 6 characters"
                placeholderTextColor="#94A3B8"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            {/* Confirm New Password */}
            <View className="mb-6">
              <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Confirm New Password *</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 px-4 py-3 rounded-xl text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="w-full bg-teal-600 py-3.5 rounded-xl justify-center items-center"
            >
              {changePasswordMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-xs font-extrabold uppercase tracking-wide">Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
