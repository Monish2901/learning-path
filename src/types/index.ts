export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty' | 'student';
  created_at: string;
}

export interface Test {
  id: string;
  title: string;
  created_by: string;
  assigned_to: string[];
  duration_minutes: number | null;
  created_at: string;
}

export interface Question {
  id: string;
  test_id: string;
  type: 'mcq' | 'descriptive';
  question_text: string;
  options: string[] | null;
  correct_answer: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  student_id: string;
  test_id: string;
  answers: Record<string, string>;
  score: number | null;
  submitted_at: string;
}
