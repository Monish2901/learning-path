import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Test, Submission } from '@/types';
import { Clock, CheckCircle2 } from 'lucide-react';

export default function StudentTests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<(Test & { attempted: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: testsData } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
      const { data: subs } = await supabase.from('submissions').select('test_id').eq('student_id', user.id);
      const attemptedSet = new Set((subs || []).map(s => s.test_id));
      setTests(((testsData || []) as Test[]).map(t => ({ ...t, attempted: attemptedSet.has(t.id) })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Tests</h1>
          <p className="text-muted-foreground mt-1">View and attempt your assigned tests</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : tests.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No tests assigned to you yet</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {tests.map(t => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{t.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      {t.duration_minutes && (
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t.duration_minutes} min</span>
                      )}
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {t.attempted ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />Completed
                      </Badge>
                    ) : (
                      <Button onClick={() => navigate(`/student/test/${t.id}`)}>
                        Start Test
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
