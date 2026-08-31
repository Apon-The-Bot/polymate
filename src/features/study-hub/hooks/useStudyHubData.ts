import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { StudyDocument, StudyFilter } from '../types';

const API_BASE_URL = 'https://bloodhelpbd.com/polymate-api';

const getAuthHeaders = async () => {
  const token = 'mock-jwt-token';
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// ============================================================================
// LOCAL MOCK DATA (DPI Computer Technology Study Material Archive)
// ============================================================================

const mockDocuments: StudyDocument[] = [
  {
    id: 1,
    instituteId: 1,
    uploaderId: 1,
    uploaderName: "Rahat Islam",
    title: "Microprocessor & Interfacing Full Hand-written Note",
    description: "সবগুলো চ্যাপ্টারের সহজ বাংলা ব্যাখ্যা এবং গুরুত্বপূর্ণ চিত্রসহ হ্যান্ড-রাইটিং নোট। পরীক্ষার আগের রাতে রিভিশন দেওয়ার জন্য পারফেক্ট।",
    fileUrl: "https://bloodhelpbd.com/polymate-api/files/microprocessor.pdf",
    fileSize: "4.8 MB",
    category: 'note',
    semester: '5th',
    department: 'Computer',
    subjectCode: "66651",
    subjectName: "Microprocessor & Interfacing",
    createdAt: "2026-07-01"
  },
  {
    id: 2,
    instituteId: 1,
    uploaderId: 2,
    uploaderName: "Asif Raihan",
    title: "Java Programming Language (Java SE Edition)",
    description: "ডিপার্টমেন্টের জাভা প্রোগ্রামিং ক্লাসের অফিসিয়াল স্লাইড এবং এক্সাম্পল প্রোগ্রাম কোড ফাইল।",
    fileUrl: "https://bloodhelpbd.com/polymate-api/files/java-slides.pdf",
    fileSize: "12.2 MB",
    category: 'lecture_pdf',
    semester: '5th',
    department: 'Computer',
    subjectCode: "66652",
    subjectName: "Java Programming",
    createdAt: "2026-06-30"
  },
  {
    id: 3,
    instituteId: 1,
    uploaderId: 3,
    uploaderName: "Sajid Hasan",
    title: "Operating System Board Exam Question Paper (2023)",
    description: "২০২৩ সালের কম্পিউটার ডিপার্টমেন্টের ফাইনাল বোর্ড পরীক্ষার আসল প্রশ্নপত্র। জুম করে পড়ার জন্য হাই-রেজোলিউশন স্ক্যান কপি।",
    fileUrl: "https://bloodhelpbd.com/polymate-api/files/os-board-2023.pdf",
    fileSize: "1.5 MB",
    category: 'board_question',
    semester: '5th',
    department: 'Computer',
    subjectCode: "66653",
    subjectName: "Operating System",
    createdAt: "2026-06-29"
  },
  {
    id: 4,
    instituteId: 1,
    uploaderId: 4,
    uploaderName: "Imran Khan",
    title: "Data Communication & Computer Network Official Syllabus",
    description: "নতুন কারিকুলাম অনুযায়ী কম্পিউটার নেটওয়ার্কিং বিষয়ের বোর্ড সিলেবাস এবং চ্যাপ্টার ভিত্তিক মার্কস ডিস্ট্রিবিউশন গাইড।",
    fileUrl: "https://bloodhelpbd.com/polymate-api/files/dccn-syllabus.pdf",
    fileSize: "2.1 MB",
    category: 'syllabus',
    semester: '5th',
    department: 'Computer',
    subjectCode: "66654",
    subjectName: "Data Communication",
    createdAt: "2026-06-26"
  }
];

/**
 * Fetch study hub documents filtered by category, semester, and search.
 * Falls back to local database emulation if the server database table is empty/offline.
 */
export function useStudyDocuments(filters: StudyFilter) {
  return useQuery<StudyDocument[], Error>({
    queryKey: ['studyDocuments', filters],
    queryFn: async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/study-hub`, {
          headers,
          params: {
            category: filters.category !== 'all' ? filters.category : undefined,
            semester: filters.semester !== 'all' ? filters.semester : undefined,
            search: filters.searchQuery || undefined
          }
        });
        return response.data;
      } catch (err) {
        console.warn("API failed, performing client-side mock search mapping:", (err as any).message);
        
        // Emulate complex search queries locally
        return mockDocuments.filter(item => {
          const matchesCategory = filters.category === 'all' || item.category === filters.category;
          const matchesSemester = filters.semester === 'all' || item.semester === filters.semester;
          
          const searchLower = filters.searchQuery.toLowerCase();
          const matchesSearch = !filters.searchQuery || 
            item.title.toLowerCase().includes(searchLower) ||
            item.subjectName.toLowerCase().includes(searchLower) ||
            item.subjectCode.includes(searchLower);

          return matchesCategory && matchesSemester && matchesSearch;
        });
      }
    }
  });
}

/**
 * Mutation to upload a new study document to the archive.
 * Updates local cache for instant feedback.
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDoc: Omit<StudyDocument, 'id' | 'createdAt' | 'uploaderName' | 'uploaderId' | 'instituteId'>) => {
      try {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_BASE_URL}/study-hub`, newDoc, { headers });
        return response.data;
      } catch (err) {
        console.warn("API failed, adding mock document to local client cache:", (err as any).message);
        return { 
          id: Math.random(), 
          instituteId: 1, 
          uploaderId: 1, 
          uploaderName: "Rahat Islam", 
          createdAt: new Date().toISOString().split('T')[0],
          ...newDoc 
        } as StudyDocument;
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to reload or manually prepend to cache
      queryClient.invalidateQueries({ queryKey: ['studyDocuments'] });
    }
  });
}
