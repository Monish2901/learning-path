import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Clock, AlertTriangle } from 'lucide-react';
import { Test, Question } from '@/types';

export default function TakeTest() {
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      // Check if already submitted
      const { data: existing } = await supabase
        .from('submissions')
        .select('id')
        .eq('test_id', testId!)
        .eq('student_id', user!.id)
        .maybeSingle();
      
      if (existing) {
        toast.error('You have already submitted this test');
        navigate('/student/tests');
        return;
      }

      const { data: testData } = await supabase.from('tests').select('*').eq('id', testId!).single();
      if (!testData) { navigate('/student/tests'); return; }
      setTest(testData as Test);

      // Don't expose correct_answer to student — only get question_text, options, type
      const { data: qData } = await supabase
        .from('questions')
        .select('id, test_id, type, question_text, options, created_at')
        .eq('test_id', testId!)
        .order('created_at');
      
      // Randomize MCQ options
      const processedQ = ((qData || []) as Question[]).map(q => {
        if (q.type === 'mcq' && q.options) {
          const shuffled = [...(q.options as string[])].sort(() => Math.random() - 0.5);
          return { ...q, options: shuffled };
        }
        return q;
      });
      setQuestions(processedQ);
      
      if ((testData as Test).duration_minutes) {
        setTimeLeft((testData as Test).duration_minutes! * 60);
      }
      setLoading(false);
    };
    fetch();
  }, [testId, user]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-test', {
        body: { testId: testId!, answers },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Test submitted! Score: ${data.score}`);
      navigate('/student/results');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
      setSubmitting(false);
    }
  }, [answers, testId, submitting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{test?.title}</h1>
            <p className="text-muted-foreground mt-1">{questions.length} questions</p>
          </div>
          {timeLeft !== null && (
            <Badge variant={timeLeft < 60 ? 'destructive' : 'secondary'} className="text-lg px-4 py-2 gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </Badge>
          )}
        </div>

        {timeLeft !== null && timeLeft < 60 && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Less than 1 minute remaining!</span>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={q.type === 'mcq' ? 'default' : 'secondary'}>{q.type.toUpperCase()}</Badge>
                  <CardTitle className="text-base">Question {i + 1}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 font-medium">{q.question_text}</p>
                {q.type === 'mcq' && q.options ? (
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                  >
                    {(q.options as string[]).map((opt, oi) => (
                      <div key={oi} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={opt} id={`${q.id}-${oi}`} />
                        <Label htmlFor={`${q.id}-${oi}`} className="cursor-pointer flex-1">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Textarea
                    placeholder="Type your answer here..."
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    rows={4}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
