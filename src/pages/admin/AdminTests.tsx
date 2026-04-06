import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Test } from '@/types';

export default function AdminTests() {
  const [tests, setTests] = useState<(Test & { creator_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
      const testsTyped = (data || []) as Test[];
      const creatorIds = [...new Set(testsTyped.map(t => t.created_by))];
      const { data: users } = await supabase.from('users').select('id, name').in('id', creatorIds.length ? creatorIds : ['']);
      const nameMap: Record<string, string> = {};
      (users || []).forEach((u: any) => { nameMap[u.id] = u.name; });
      setTests(testsTyped.map(t => ({ ...t, creator_name: nameMap[t.created_by] || 'Unknown' })));
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Tests</h1>
          <p className="text-muted-foreground mt-1">System-wide test overview</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : tests.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No tests</TableCell></TableRow>
                ) : tests.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{t.creator_name}</TableCell>
                    <TableCell>{t.assigned_to?.length || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
