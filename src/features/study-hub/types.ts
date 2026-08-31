// TypeScript Interfaces for Study Hub Domain

export interface StudyDocument {
  id: number;
  instituteId: number;
  uploaderId: number;
  uploaderName: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize?: string; // E.g., '2.4 MB'
  category: 'note' | 'lecture_pdf' | 'board_question' | 'syllabus';
  semester: '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | '8th';
  department: string;
  subjectCode: string;
  subjectName: string;
  createdAt: string;
}

export interface StudyFilter {
  category: 'all' | 'note' | 'lecture_pdf' | 'board_question' | 'syllabus';
  semester: 'all' | '1st' | '2nd' | '3rd' | '4th' | '5th' | '6th' | '7th' | '8th';
  department: string;
  searchQuery: string;
}
