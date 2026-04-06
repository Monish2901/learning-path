import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Submission, Test } from '@/types';

export default function StudentResults() {
  const { user } = useAuth();
  const [results, setResults] = useState<(Submission & { test_title: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false });
      
      const testIds = [...new Set((subs || []).map(s => s.test_id))];
      const { data: tests } = await supabase.from('tests').select('id, title').in('id', testIds.length ? testIds : ['']);
      const titleMap: Record<string, string> = {};
      (tests || []).forEach((t: any) => { titleMap[t.id] = t.title; });

      setResults(((subs || []) as Submission[]).map(s => ({
        ...s,
        test_title: titleMap[s.test_id] || 'Unknown Test',
      })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Results</h1>
          <p className="text-muted-foreground mt-1">View your past test results</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : results.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No results yet. Complete a test to see results here.</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {results.map(r => (
              <Card key={r.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{r.test_title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submitted {new Date(r.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {r.score !== null ? (
                      <div>
                        <p className="text-2xl font-bold">{r.score}</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    ) : (
                      <Badge variant="secondary">Pending Review</Badge>
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
