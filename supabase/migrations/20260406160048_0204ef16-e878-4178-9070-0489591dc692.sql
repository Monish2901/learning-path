
-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tests table
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to UUID[] DEFAULT '{}',
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mcq', 'descriptive')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score NUMERIC,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, test_id)
);

-- Security definer function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = _user_id;
$$;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Admins can do everything with users" ON public.users
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Faculty can read students" ON public.users
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'faculty');

-- TESTS policies
CREATE POLICY "Admins full access to tests" ON public.tests
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Faculty manage own tests" ON public.tests
  FOR ALL USING (public.get_user_role(auth.uid()) = 'faculty' AND created_by = auth.uid());

CREATE POLICY "Students view assigned tests" ON public.tests
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'student' 
    AND auth.uid() = ANY(assigned_to)
  );

-- QUESTIONS policies
CREATE POLICY "Admins full access to questions" ON public.questions
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Faculty manage own test questions" ON public.questions
  FOR ALL USING (
    public.get_user_role(auth.uid()) = 'faculty' 
    AND test_id IN (SELECT id FROM public.tests WHERE created_by = auth.uid())
  );

CREATE POLICY "Students view questions for assigned tests" ON public.questions
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'student' 
    AND test_id IN (SELECT id FROM public.tests WHERE auth.uid() = ANY(assigned_to))
  );

-- SUBMISSIONS policies
CREATE POLICY "Admins full access to submissions" ON public.submissions
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Faculty view submissions for own tests" ON public.submissions
  FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'faculty' 
    AND test_id IN (SELECT id FROM public.tests WHERE created_by = auth.uid())
  );

CREATE POLICY "Students manage own submissions" ON public.submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students insert own submissions" ON public.submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- Create admin user creation function (for edge function use)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  _user_id UUID,
  _name TEXT,
  _email TEXT,
  _role TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (_user_id, _name, _email, _role);
END;
$$;
