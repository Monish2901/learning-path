import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminTests from "@/pages/admin/AdminTests";
import FacultyDashboard from "@/pages/faculty/FacultyDashboard";
import FacultyTests from "@/pages/faculty/FacultyTests";
import FacultySubmissions from "@/pages/faculty/FacultySubmissions";
import FacultyAnalytics from "@/pages/faculty/FacultyAnalytics";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentTests from "@/pages/student/StudentTests";
import StudentResults from "@/pages/student/StudentResults";
import TakeTest from "@/pages/student/TakeTest";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function RoleRedirect() {
  const { user, loading, session } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  const redirectMap: Record<string, string> = { admin: '/admin', faculty: '/faculty', student: '/student' };
  return <Navigate to={redirectMap[user.role] || '/login'} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/login" element={<Login />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/tests" element={<ProtectedRoute allowedRoles={['admin']}><AdminTests /></ProtectedRoute>} />

            {/* Faculty */}
            <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/tests" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyTests /></ProtectedRoute>} />
            <Route path="/faculty/submissions" element={<ProtectedRoute allowedRoles={['faculty']}><FacultySubmissions /></ProtectedRoute>} />
            <Route path="/faculty/analytics" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyAnalytics /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/tests" element={<ProtectedRoute allowedRoles={['student']}><StudentTests /></ProtectedRoute>} />
            <Route path="/student/test/:testId" element={<ProtectedRoute allowedRoles={['student']}><TakeTest /></ProtectedRoute>} />
            <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student']}><StudentResults /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
