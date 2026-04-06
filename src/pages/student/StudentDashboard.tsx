import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ assigned: 0, attempted: 0, pending: 0 });

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: tests } = await supabase.from('tests').select('id');
      const testIds = (tests || []).map(t => t.id);
      const { data: subs } = await supabase.from('submissions').select('test_id').eq('student_id', user.id);
      const attemptedIds = new Set((subs || []).map(s => s.test_id));
      setStats({
        assigned: testIds.length,
        attempted: attemptedIds.size,
        pending: testIds.length - attemptedIds.size,
      });
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Assigned Tests</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.assigned}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Attempted</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-500">{stats.attempted}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-primary">{stats.pending}</p></CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
