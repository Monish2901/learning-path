import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tests: 0, submissions: 0, students: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { data: tests } = await supabase.from('tests').select('id, assigned_to');
      const testIds = (tests || []).map(t => t.id);
      const allStudents = new Set((tests || []).flatMap(t => (t.assigned_to as string[]) || []));
      
      let subCount = 0;
      if (testIds.length > 0) {
        const { count } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).in('test_id', testIds);
        subCount = count || 0;
      }
      setStats({ tests: tests?.length || 0, submissions: subCount, students: allStudents.size });
    };
    fetch();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">My Tests</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.tests}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Submissions</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.submissions}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Assigned Students</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{stats.students}</p></CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
