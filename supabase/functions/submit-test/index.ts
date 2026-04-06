import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const studentId = claimsData.claims.sub as string;

    const { testId, answers } = await req.json();
    if (!testId || !answers) {
      return new Response(JSON.stringify({ error: "testId and answers required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify student role
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", studentId)
      .single();

    if (!userProfile || userProfile.role !== "student") {
      return new Response(JSON.stringify({ error: "Only students can submit tests" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already submitted
    const { data: existing } = await supabaseAdmin
      .from("submissions")
      .select("id")
      .eq("student_id", studentId)
      .eq("test_id", testId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Already submitted this test" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify test is assigned to student
    const { data: test } = await supabaseAdmin
      .from("tests")
      .select("assigned_to")
      .eq("id", testId)
      .single();

    if (!test || !(test.assigned_to as string[]).includes(studentId)) {
      return new Response(JSON.stringify({ error: "Test not assigned to you" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch questions with correct answers (server-side only)
    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("id, type, correct_answer")
      .eq("test_id", testId);

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions found for this test" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-grade MCQs
    let mcqCorrect = 0;
    let mcqTotal = 0;
    let hasDescriptive = false;

    for (const q of questions) {
      if (q.type === "mcq") {
        mcqTotal++;
        const studentAnswer = answers[q.id];
        if (studentAnswer && studentAnswer === q.correct_answer) {
          mcqCorrect++;
        }
      } else if (q.type === "descriptive") {
        hasDescriptive = true;
      }
    }

    // Score: MCQ score only; null if there are descriptive questions and no MCQs
    const score = mcqTotal > 0 ? mcqCorrect : null;

    // Insert submission
    const { error: insertError } = await supabaseAdmin
      .from("submissions")
      .insert({
        student_id: studentId,
        test_id: testId,
        answers,
        score,
      });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        score,
        mcqCorrect,
        mcqTotal,
        hasDescriptive,
        message: hasDescriptive
          ? `MCQ Score: ${mcqCorrect}/${mcqTotal}. Descriptive answers pending review.`
          : `Score: ${mcqCorrect}/${mcqTotal}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
