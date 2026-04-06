import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Test, Question, User } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function FacultyTests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', assigned_to: [] as string[], duration_minutes: '' });
  const [saving, setSaving] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  // Questions management
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qForm, setQForm] = useState({ type: 'mcq' as string, question_text: '', options: ['', '', '', ''], correct_answer: '' });

  const fetchTests = async () => {
    const { data } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
    setTests((data || []) as Test[]);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'student');
    setStudents((data || []) as User[]);
  };

  useEffect(() => {
    fetchTests();
    fetchStudents();
  }, []);

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        assigned_to: form.assigned_to,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
        created_by: user!.id,
      };
      if (editingTest) {
        const { error } = await supabase.from('tests').update(payload).eq('id', editingTest.id);
        if (error) throw error;
        toast.success('Test updated');
      } else {
        const { error } = await supabase.from('tests').insert(payload);
        if (error) throw error;
        toast.success('Test created');
      }
      setOpen(false);
      setEditingTest(null);
      setForm({ title: '', assigned_to: [], duration_minutes: '' });
      fetchTests();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm('Delete this test and all its questions?')) return;
    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Test deleted'); fetchTests(); }
  };

  const openEdit = (test: Test) => {
    setEditingTest(test);
    setForm({ title: test.title, assigned_to: test.assigned_to || [], duration_minutes: test.duration_minutes?.toString() || '' });
    setOpen(true);
  };

  // Questions
  const openQuestions = async (test: Test) => {
    setSelectedTest(test);
    const { data } = await supabase.from('questions').select('*').eq('test_id', test.id).order('created_at');
    setQuestions((data || []) as Question[]);
    setQuestionsOpen(true);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qForm.question_text) { toast.error('Question text required'); return; }
    try {
      const payload: any = {
        test_id: selectedTest!.id,
        type: qForm.type,
        question_text: qForm.question_text,
        correct_answer: qForm.correct_answer || null,
        options: qForm.type === 'mcq' ? qForm.options.filter(o => o.trim()) : null,
      };
      const { error } = await supabase.from('questions').insert(payload);
      if (error) throw error;
      toast.success('Question added');
      setQForm({ type: 'mcq', question_text: '', options: ['', '', '', ''], correct_answer: '' });
      const { data } = await supabase.from('questions').select('*').eq('test_id', selectedTest!.id).order('created_at');
      setQuestions((data || []) as Question[]);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    await supabase.from('questions').delete().eq('id', qId);
    setQuestions(questions.filter(q => q.id !== qId));
    toast.success('Question removed');
  };

  const toggleStudent = (sid: string) => {
    setForm(f => ({
      ...f,
      assigned_to: f.assigned_to.includes(sid)
        ? f.assigned_to.filter(s => s !== sid)
        : [...f.assigned_to, sid]
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Tests</h1>
            <p className="text-muted-foreground mt-1">Create and manage your assessments</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingTest(null); setForm({ title: '', assigned_to: [], duration_minutes: '' }); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Create Test</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTest ? 'Edit Test' : 'Create Test'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveTest} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes, optional)</Label>
                  <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} placeholder="No time limit" />
                </div>
                <div className="space-y-2">
                  <Label>Assign Students</Label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2">
                    {students.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No students available</p>
                    ) : students.map(s => (
                      <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                        <input
                          type="checkbox"
                          checked={form.assigned_to.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="rounded"
                        />
                        {s.name} ({s.email})
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : tests.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No tests yet. Create your first test!</TableCell></TableRow>
                ) : tests.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell><Badge variant="secondary">{t.assigned_to?.length || 0}</Badge></TableCell>
                    <TableCell>{t.duration_minutes ? `${t.duration_minutes} min` : 'No limit'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openQuestions(t)} title="Questions">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTest(t.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Questions Dialog */}
        <Dialog open={questionsOpen} onOpenChange={setQuestionsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Questions: {selectedTest?.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {questions.map((q, i) => (
                <Card key={q.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant={q.type === 'mcq' ? 'default' : 'secondary'} className="mb-2">{q.type.toUpperCase()}</Badge>
                        <p className="font-medium">Q{i+1}: {q.question_text}</p>
                        {q.type === 'mcq' && q.options && (
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {(q.options as string[]).map((opt, oi) => (
                              <li key={oi} className={opt === q.correct_answer ? 'text-green-600 font-medium' : ''}>
                                {String.fromCharCode(65 + oi)}. {opt} {opt === q.correct_answer && '✓'}
                              </li>
                            ))}
                          </ul>
                        )}
                        {q.type === 'descriptive' && q.correct_answer && (
                          <p className="mt-1 text-sm text-muted-foreground">Key: {q.correct_answer}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-dashed">
                <CardHeader><CardTitle className="text-base">Add Question</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={qForm.type} onValueChange={(v) => setQForm({ ...qForm, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq">MCQ</SelectItem>
                          <SelectItem value="descriptive">Descriptive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Textarea value={qForm.question_text} onChange={(e) => setQForm({ ...qForm, question_text: e.target.value })} required />
                    </div>
                    {qForm.type === 'mcq' && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {qForm.options.map((opt, i) => (
                          <Input
                            key={i}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            value={opt}
                            onChange={(e) => {
                              const opts = [...qForm.options];
                              opts[i] = e.target.value;
                              setQForm({ ...qForm, options: opts });
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>{qForm.type === 'mcq' ? 'Correct Answer (must match one option exactly)' : 'Answer Key (reference)'}</Label>
                      <Input value={qForm.correct_answer} onChange={(e) => setQForm({ ...qForm, correct_answer: e.target.value })} />
                    </div>
                    <Button type="submit">Add Question</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
