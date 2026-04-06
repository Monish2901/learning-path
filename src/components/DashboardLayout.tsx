import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, Users, FileText, GraduationCap, 
  LogOut, ClipboardList, BarChart3, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navConfig: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'All Tests', href: '/admin/tests', icon: FileText },
  ],
  faculty: [
    { label: 'Dashboard', href: '/faculty', icon: LayoutDashboard },
    { label: 'My Tests', href: '/faculty/tests', icon: FileText },
    { label: 'Submissions', href: '/faculty/submissions', icon: ClipboardList },
    { label: 'Analytics', href: '/faculty/analytics', icon: BarChart3 },
  ],
  student: [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'My Tests', href: '/student/tests', icon: BookOpen },
    { label: 'Results', href: '/student/results', icon: GraduationCap },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const navItems = navConfig[user.role] || [];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const roleBadgeColors: Record<string, string> = {
    admin: 'bg-destructive/10 text-destructive',
    faculty: 'bg-primary/10 text-primary',
    student: 'bg-green-500/10 text-green-600',
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-lg font-bold tracking-tight font-['Space_Grotesk']">
            SLDAS
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Learning Assessment</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${roleBadgeColors[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
