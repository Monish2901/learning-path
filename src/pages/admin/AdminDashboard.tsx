import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, ClipboardList, GraduationCap } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ admins: 0, faculty: 0, students: 0, tests: 0, submissions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, testsRes, subsRes] = await Promise.all([
        supabase.from('users').select('role'),
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
      ]);
      const users = usersRes.data || [];
      setStats({
        admins: users.filter(u => u.role === 'admin').length,
        faculty: users.filter(u => u.role === 'faculty').length,
        students: users.filter(u => u.role === 'student').length,
        tests: testsRes.count || 0,
        submissions: subsRes.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: 'Admins', value: stats.admins, icon: Users, color: 'text-destructive' },
    { label: 'Faculty', value: stats.faculty, icon: GraduationCap, color: 'text-primary' },
    { label: 'Students', value: stats.students, icon: Users, color: 'text-green-500' },
    { label: 'Tests', value: stats.tests, icon: FileText, color: 'text-accent' },
    { label: 'Submissions', value: stats.submissions, icon: ClipboardList, color: 'text-warning' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and management</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
