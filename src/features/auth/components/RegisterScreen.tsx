import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  useColorScheme, 
  Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { useAuthStore } from '../../../store/authStore';

const DEPARTMENTS = ['Computer', 'Civil', 'Mechanical', 'Electrical', 'Electronics', 'Chemical', 'Architecture'];

export default function RegisterScreen() {
  const isDark = useColorScheme() === 'dark';
  const setAuthView = useAuthStore(state => state.setAuthView);
  
  // Registration Form States
  const [role, setRole] = useState<'student' | 'general'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [roll, setRoll] = useState('');
  const [registration, setRegistration] = useState('');
  const [password, setPassword] = useState('');
  
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);
  const [selectedSession, setSelectedSession] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic Polytechnic Picker States
  const [institutes, setInstitutes] = useState<{ id: any; name: string; code: string }[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<{ id: any; name: string } | null>(null);
  const [showInstituteModal, setShowInstituteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customInstituteName, setCustomInstituteName] = useState('');

  // Dynamic Session Picker States
  const [sessionLimit, setSessionLimit] = useState(10);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Load institutes list dynamically
  useEffect(() => {
    const loadInstitutes = async () => {
      try {
        const res = await axios.get('https://bloodhelpbd.com/polymate-api/institutes');
        if (res.data && res.data.success) {
          const list = res.data.institutes;
          setInstitutes(list);
          // Auto-select Dhaka Polytechnic (id = 1) if available
          const dpi = list.find((i: any) => i.id == 1 || i.code === 'DPI');
          if (dpi) setSelectedInstitute({ id: dpi.id, name: dpi.name });
          else if (list.length > 0) setSelectedInstitute({ id: list[0].id, name: list[0].name });
        }
      } catch (err) {
        console.log('Failed to fetch institutes:', err);
        // Fallback seeds
        const fallback = [
          { id: 1, name: 'Dhaka Polytechnic Institute', code: 'DPI' },
          { id: 2, name: 'Chittagong Polytechnic Institute', code: 'CPI' },
          { id: 3, name: 'Mymensingh Polytechnic Institute', code: 'MPI' },
          { id: 4, name: 'Sylhet Polytechnic Institute', code: 'SPI' },
          { id: 5, name: 'Khulna Polytechnic Institute', code: 'KPI' },
          { id: 6, name: 'Rajshahi Polytechnic Institute', code: 'RPI' },
        ];
        setInstitutes(fallback);
        setSelectedInstitute({ id: 1, name: 'Dhaka Polytechnic Institute' });
      }
    };
    loadInstitutes();
  }, []);

  // Generate dynamic sessions descending
  const sessionsList = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const list: string[] = [];
    for (let i = 0; i < sessionLimit; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      const endYearShort = String(endYear).substring(2);
      list.push(`${startYear}-${endYearShort}`);
    }
    return list;
  }, [sessionLimit]);

  // Set default session once the list is generated
  useEffect(() => {
    if (sessionsList.length > 0 && !selectedSession) {
      setSelectedSession(sessionsList[0]);
    }
  }, [sessionsList, selectedSession]);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !address) {
      Alert.alert('Required Fields', 'Please fill in all basic registration fields including address.');
      return;
    }

    if (role === 'student') {
      if (!roll || !registration) {
        Alert.alert('Required Fields', 'Please fill in all student information fields.');
        return;
      }
      if (roll.length < 6 || registration.length < 6) {
        Alert.alert('Validation Error', 'Roll and Registration numbers must be at least 6 digits.');
        return;
      }
      if (!selectedInstitute) {
        Alert.alert('Required Fields', 'Please select your polytechnic institute.');
        return;
      }
      if (selectedInstitute.id === 'other' && !customInstituteName.trim()) {
        Alert.alert('Required Fields', 'Please enter your custom institute name.');
        return;
      }
    }

    try {
      setLoading(true);
      
      const payload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        current_address: address.trim(),
        password: password,
        role: role
      };

      if (role === 'student' && selectedInstitute) {
        payload.roll_no = parseInt(roll);
        payload.registration_no = parseInt(registration);
        payload.department = selectedDept;
        payload.session = selectedSession;
        payload.institute_id = selectedInstitute.id;
        
        if (selectedInstitute.id === 'other') {
          payload.custom_institute_name = customInstituteName.trim();
        }
      }

      const response = await axios.post('https://bloodhelpbd.com/polymate-api/register.php', payload);

      if (response.data && response.data.success) {
        Alert.alert('Success', 'Account created successfully! You can login now.', [
          { text: 'OK', onPress: () => setAuthView('login') }
        ]);
      } else {
        Alert.alert('Registration Error', response.data.error || 'Failed to register account.');
      }
    } catch (error: any) {
      console.log('Registration request failed:', error.message);
      const errorMsg = error.response?.data?.error || 'Unable to connect to PolyMate servers. Please try again.';
      Alert.alert('Registration Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Filter institutes based on search query
  const filteredInstitutes = institutes.filter(inst => 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inst.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50 dark:bg-slate-955"
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 40, paddingHorizontal: 24 }}
        className="flex-1"
      >
        {/* Header branding */}
        <View className="items-center mb-5">
          <Text className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Account</Text>
          <Text className="text-slate-400 text-xs mt-1 font-semibold">Join PolyMate Community</Text>
        </View>

        {/* Role Segmented Toggle Controller */}
        <View className="flex-row bg-slate-200/60 dark:bg-slate-900 p-1.5 rounded-2xl mb-5 border border-slate-350/10">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRole('student')}
            className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
            style={role === 'student' ? {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 2,
              elevation: 2,
            } : undefined}
          >
            <Ionicons name="school-sharp" size={15} color={role === 'student' ? '#0D9488' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text className={`text-[11px] font-extrabold ${role === 'student' ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
              Student (শিক্ষার্থী)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRole('general')}
            className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
            style={role === 'general' ? {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.3 : 0.08,
              shadowRadius: 2,
              elevation: 2,
            } : undefined}
          >
            <Ionicons name="people-sharp" size={15} color={role === 'general' ? '#0D9488' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text className={`text-[11px] font-extrabold ${role === 'general' ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
              General (অন্যান্য ইউজার)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Form container */}
        <View className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-3xl shadow-sm mb-6">
          
          {/* Full Name */}
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Full Name *</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="person-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
              <TextInput
                placeholder="e.g. Amanullah Sheikh"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* Email Address */}
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Email Address *</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="mail-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
              <TextInput
                placeholder="e.g. name@gmail.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* Phone Number */}
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Phone Number *</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="call-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
              <TextInput
                placeholder="e.g. 017xxxxxxxx"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* Current Address */}
          <View className="mb-4">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Current Address (বর্তমান ঠিকানা) *</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="location-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
              <TextInput
                placeholder="e.g. Kuniapara, Tejgaon, Dhaka"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>
          </View>

          {/* Conditional Student-Specific Fields */}
          {role === 'student' && (
            <View>
              {/* Grid for Roll & Reg */}
              <View className="flex-row justify-between mb-4">
                {/* Roll */}
                <View style={{ width: '48%' }}>
                  <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Board Roll *</Text>
                  <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-3.5 py-2.5 rounded-xl flex-row items-center">
                    <TextInput
                      placeholder="Roll No."
                      placeholderTextColor="#94A3B8"
                      value={roll}
                      onChangeText={setRoll}
                      keyboardType="number-pad"
                      className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
                    />
                  </View>
                </View>

                {/* Registration */}
                <View style={{ width: '48%' }}>
                  <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Registration *</Text>
                  <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-3.5 py-2.5 rounded-xl flex-row items-center">
                    <TextInput
                      placeholder="Reg No."
                      placeholderTextColor="#94A3B8"
                      value={registration}
                      onChangeText={setRegistration}
                      keyboardType="number-pad"
                      className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
                    />
                  </View>
                </View>
              </View>

              {/* Dynamic Polytechnic Institute Picker */}
              <View className="mb-4">
                <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Polytechnic Institute *</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowInstituteModal(true)}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3.5 rounded-xl flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="business-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
                    <Text className="text-slate-800 dark:text-white text-xs font-semibold flex-1" numberOfLines={1}>
                      {selectedInstitute ? selectedInstitute.name : 'Select Polytechnic'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Custom Write-In Input for "Other" Polytechnic */}
              {selectedInstitute?.id === 'other' && (
                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Enter Institute Name *</Text>
                  <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
                    <Ionicons name="school-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
                    <TextInput
                      placeholder="e.g. My Custom Institute name"
                      placeholderTextColor="#94A3B8"
                      value={customInstituteName}
                      onChangeText={setCustomInstituteName}
                      className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
                    />
                  </View>
                </View>
              )}

              {/* Department Selector */}
              <View className="mb-4">
                <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Department *</Text>
                <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 rounded-xl overflow-hidden py-1 px-1 flex-row">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {DEPARTMENTS.map(dept => (
                      <TouchableOpacity
                        key={dept}
                        onPress={() => setSelectedDept(dept)}
                        className="px-3 py-2 rounded-lg mx-1"
                        style={{
                          backgroundColor: selectedDept === dept ? '#0D9488' : (isDark ? '#1E293B' : '#F1F5F9')
                        }}
                      >
                        <Text className={`text-[9px] font-extrabold ${selectedDept === dept ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>{dept}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Dynamic Session Dropdown Selector */}
              <View className="mb-4">
                <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Session *</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowSessionModal(true)}
                  className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-3.5 rounded-xl flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
                    <Text className="text-slate-800 dark:text-white text-xs font-semibold">
                      {selectedSession ? selectedSession : 'Select Session'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Password */}
          <View className="mb-6">
            <Text className="text-slate-400 text-[10px] font-extrabold uppercase mb-1.5">Password *</Text>
            <View className="bg-slate-50 dark:bg-slate-955 border border-slate-200/60 dark:border-slate-850 px-4 py-2.5 rounded-xl flex-row items-center">
              <Ionicons name="lock-closed-outline" size={16} color="#64748B" style={{ marginRight: 12 }} />
              <TextInput
                placeholder="Min 6 characters"
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

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRegister}
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
                <Text className="text-white text-xs font-extrabold uppercase tracking-wider">Register Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Navigate back to login */}
          <View className="flex-row justify-center items-center mt-2">
            <Text className="text-slate-400 text-[11px] font-semibold">Already have an account? </Text>
            <TouchableOpacity onPress={() => setAuthView('login')}>
              <Text className="text-teal-600 dark:text-teal-400 text-[11px] font-extrabold">Log In</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Polytechnic Picker Modal */}
      <Modal
        visible={showInstituteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInstituteModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl h-[80%] px-5 pt-6 pb-10">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-base font-extrabold text-slate-900 dark:text-white">Select Polytechnic</Text>
              <TouchableOpacity onPress={() => { setShowInstituteModal(false); setSearchQuery(''); }}>
                <Ionicons name="close-circle-sharp" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-2 flex-row items-center mb-4">
              <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 10 }} />
              <TextInput
                placeholder="Search Polytechnic..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-slate-800 dark:text-white text-xs font-semibold"
              />
            </View>

            {/* Scrollable list */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {filteredInstitutes.map(inst => (
                <TouchableOpacity
                  key={inst.id}
                  onPress={() => {
                    setSelectedInstitute({ id: inst.id, name: inst.name });
                    setShowInstituteModal(false);
                    setSearchQuery('');
                  }}
                  className="py-4 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center"
                >
                  <Text className="text-slate-800 dark:text-slate-200 text-xs font-bold flex-1 pr-3">
                    {inst.name} ({inst.code})
                  </Text>
                  {selectedInstitute?.id === inst.id && (
                    <Ionicons name="checkmark-circle" size={18} color="#0D9488" />
                  )}
                </TouchableOpacity>
              ))}

              {/* "Other" trigger */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedInstitute({ id: 'other', name: 'Other / General (অন্যান্য / সাধারণ)' });
                  setShowInstituteModal(false);
                  setSearchQuery('');
                }}
                className="py-4 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center"
              >
                <Text className="text-teal-600 dark:text-teal-400 text-xs font-extrabold flex-1">
                  Other / General (অন্যান্য / সাধারণ)
                </Text>
                {selectedInstitute?.id === 'other' && (
                  <Ionicons name="checkmark-circle" size={18} color="#0D9488" />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Session Picker Modal */}
      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[60%] px-5 pt-6 pb-10">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-base font-extrabold text-slate-900 dark:text-white">Select Academic Session</Text>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <Ionicons name="close-circle-sharp" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Scrollable list */}
            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {sessionsList.map(sess => (
                <TouchableOpacity
                  key={sess}
                  onPress={() => {
                    setSelectedSession(sess);
                    setShowSessionModal(false);
                  }}
                  className="py-4 border-b border-slate-100 dark:border-slate-800 flex-row justify-between items-center"
                >
                  <Text className="text-slate-850 dark:text-slate-200 text-xs font-bold">
                    {sess}
                  </Text>
                  {selectedSession === sess && (
                    <Ionicons name="checkmark-circle" size={18} color="#0D9488" />
                  )}
                </TouchableOpacity>
              ))}

              {/* Load older button */}
              <TouchableOpacity
                onPress={() => setSessionLimit(limit => limit + 10)}
                className="py-4 mt-2 bg-slate-50 dark:bg-slate-950 rounded-xl items-center justify-center flex-row"
              >
                <Ionicons name="add" size={16} color="#0D9488" style={{ marginRight: 6 }} />
                <Text className="text-teal-600 dark:text-teal-400 text-xs font-extrabold">
                  See Older Sessions (পুরাতন সেশন দেখুন)
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
