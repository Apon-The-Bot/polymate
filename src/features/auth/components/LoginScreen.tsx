import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';
import axios from 'axios';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onNavigateToRegister }: LoginScreenProps) {
  const loginAction = useAuthStore(state => state.login);
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!credential || !password) {
      Alert.alert('Required Fields', 'Please enter your Board Roll number / Email and Password.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('https://bloodhelpbd.com/polymate-api/login.php', {
        roll_or_email: credential.trim(),
        password: password
      });

      if (response.data && response.data.success) {
        const { user, token } = response.data;
        await loginAction(user, token);
      } else {
        Alert.alert('Authentication Error', response.data.error || 'Invalid credentials.');
      }
    } catch (error: any) {
      console.log('Login request failed:', error.message);
      const errorMsg = error.response?.data?.error || 'Unable to connect to PolyMate servers. Please check connection.';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50 dark:bg-slate-950"
    >
      <View className="flex-1 justify-center px-6 relative">
        
        {/* Top visual decoration */}
        <View className="absolute top-10 left-[-30] w-48 h-48 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-2xl" />
        <View className="absolute bottom-10 right-[-30] w-64 h-64 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-2xl" />

        {/* Header Branding section */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-3xl bg-teal-600 justify-center items-center shadow-lg shadow-teal-600/30 mb-4">
            <Ionicons name="sparkles-sharp" size={28} color="white" />
          </View>
          <Text className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">PolyMate</Text>
          <Text className="text-slate-400 text-xs font-semibold mt-1"> Dhaka Polytechnic Companion App </Text>
        </View>

        {/* Card Wrapper */}
        <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          
          <Text className="text-base font-extrabold text-slate-900 dark:text-white mb-6">Welcome Back</Text>

          {/* Roll/Email Input */}
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-2">Board Roll / Email</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="person-outline" size={16} color="#64748B" className="mr-3" />
              <TextInput
                placeholder="e.g. 123456 or name@gmail.com"
                placeholderTextColor="#94A3B8"
                value={credential}
                onChangeText={setCredential}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-2">Password</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="lock-closed-outline" size={16} color="#64748B" className="mr-3" />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-2">
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button with LinearGradient for sleek design */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
            className="rounded-xl overflow-hidden mb-4 shadow-sm"
          >
            <LinearGradient
              colors={['#0D9488', '#0F766E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-xs font-extrabold uppercase tracking-wider">Log In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Navigate to signup button */}
          <View className="flex-row justify-center items-center mt-2">
            <Text className="text-slate-400 text-[11px] font-semibold">New to PolyMate? </Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text className="text-teal-600 dark:text-teal-400 text-[11px] font-extrabold">Create Account</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Demo login helper */}
        <View className="mt-8 bg-amber-50 dark:bg-amber-955/10 border border-amber-250/20 dark:border-amber-900/30 rounded-2xl p-4">
          <View className="flex-row items-center mb-1">
            <Ionicons name="information-circle-sharp" size={14} color="#D97706" className="mr-1.5" />
            <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-extrabold uppercase tracking-wide">Developer Demo account</Text>
          </View>
          <Text className="text-slate-500 dark:text-slate-300 text-[10px] leading-relaxed">
            Use Board Roll: <Text className="font-bold text-slate-800 dark:text-white">123456</Text> and Password: <Text className="font-bold text-slate-800 dark:text-white">password123</Text> to bypass setup.
          </Text>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradientButton: {
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
});
