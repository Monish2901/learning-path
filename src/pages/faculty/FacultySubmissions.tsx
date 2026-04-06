import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Test, Submission, User } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function FacultySubmissions() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [submissions, setSubmissions] = useState<(Submission & { student_name?: string })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('tests').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setTests((data || []) as Test[]);
    });
  }, []);

  useEffect(() => {
    if (!selectedTestId) return;
    setLoading(true);
    const fetchSubs = async () => {
      const { data: subs } = await supabase.from('submissions').select('*').eq('test_id', selectedTestId).order('submitted_at', { ascending: false });
      const subsTyped = (subs || []) as Submission[];
      // Fetch student names
      const studentIds = [...new Set(subsTyped.map(s => s.student_id))];
      const { data: students } = await supabase.from('users').select('id, name').in('id', studentIds);
      const nameMap: Record<string, string> = {};
      (students || []).forEach((s: any) => { nameMap[s.id] = s.name; });
      setSubmissions(subsTyped.map(s => ({ ...s, student_name: nameMap[s.student_id] || 'Unknown' })));
      setLoading(false);
    };
    fetchSubs();
  }, [selectedTestId]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Submissions</h1>
          <p className="text-muted-foreground mt-1">Review student test submissions</p>
        </div>

        <Select value={selectedTestId} onValueChange={setSelectedTestId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a test to view submissions" />
          </SelectTrigger>
          <SelectContent>
            {tests.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTestId && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : submissions.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No submissions yet</TableCell></TableRow>
                  ) : submissions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.student_name}</TableCell>
                      <TableCell>
                        {s.score !== null ? (
                          <Badge variant="default">{s.score}</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(s.submitted_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
