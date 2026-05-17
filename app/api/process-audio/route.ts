import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize OpenAI client to point to NVIDIA NIM
const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;
    const name = formData.get("name") as string || "New Meeting";
    
    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // =========================================================================
    // PHASE 1: TRANSCRIPTION (Groq Whisper)
    // =========================================================================
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });
    
    // Map verbose_json output to transcript format
    const segments = (transcription as any).segments || [];
    const transcript = segments.length > 0 
      ? segments.map((seg: any) => ({
          speaker: "Speaker", // Diarization is mocked by default
          timestamp: Math.round(seg.start),
          text: seg.text.trim(),
        }))
      : [{ speaker: "Speaker", timestamp: 0, text: transcription.text }];

    const fullText = transcription.text;
    const wordCount = fullText.split(/\s+/).length;
    const duration = (transcription as any).duration || segments[segments.length - 1]?.end || 60;

    // =========================================================================
    // PHASE 2: LLM ANALYSIS (NVIDIA Llama 3)
    // =========================================================================
    const prompt = `
      Analyze this meeting transcript and provide a strict JSON response with the following structure:
      {
        "tldr": "A 2-3 sentence summary of the meeting.",
        "keyQuote": "The most important or impactful quote from the transcript.",
        "actionItems": [
          { "text": "Task description", "assignee": "Name or null", "priority": "high|medium|low" }
        ],
        "insights": {
          "sentiment": "aligned|tense|uncertain|neutral",
          "risks": ["Risk 1", "Risk 2"],
          "decisions": ["Decision 1", "Decision 2"]
        }
      }

      Transcript:
      ${fullText}
    `;

    const completion = await nvidia.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct", 
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const llmResult = JSON.parse(completion.choices[0].message.content || "{}");

    // =========================================================================
    // PHASE 3: RESULT ASSEMBLY & PERSISTENCE (Supabase)
    // =========================================================================
    const meetingId = crypto.randomUUID();
    let audioUrl = "";

    // Initialize Supabase Admin Client
    const supabase = createAdminClient();

    // 1. Upload audio recording to Supabase Storage
    const bucketName = "meetings-audio";
    const fileName = `${meetingId}.webm`;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: "audio/webm",
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) {
        console.error("Supabase Storage Upload Error:", uploadError.message);
      } else {
        // Retrieve Public URL
        const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        audioUrl = data.publicUrl;
      }
    } catch (storageErr) {
      console.error("Error setting up audio upload:", storageErr);
    }

    const result = {
      id: meetingId,
      name,
      created_at: new Date().toISOString(),
      stats: {
        duration: Math.round(duration),
        speakerCount: 1, 
        wordCount,
        actionItemCount: llmResult.actionItems?.length || 0,
      },
      speakers: [{ id: "s1", label: "Speaker 1", talkTime: Math.round(duration) }],
      transcript,
      tldr: llmResult.tldr || "No summary generated.",
      keyQuote: llmResult.keyQuote || "",
      actionItems: (llmResult.actionItems || []).map((item: any) => ({
        id: crypto.randomUUID(),
        text: item.text,
        assignee: item.assignee,
        priority: item.priority || "medium",
        done: false,
      })),
      insights: {
        sentiment: llmResult.insights?.sentiment || "neutral",
        risks: llmResult.insights?.risks || [],
        decisions: llmResult.insights?.decisions || [],
        talkRatio: { s1: 100 },
      },
    };

    // 2. Persist the meeting details to 'meetings' table
    const { error: dbError } = await supabase
      .from("meetings")
      .insert({
        id: result.id,
        name: result.name,
        duration: result.stats.duration,
        transcript: result.transcript,
        tldr: result.tldr,
        key_quote: result.keyQuote,
        action_items: result.actionItems,
        speakers: result.speakers,
        insights: result.insights,
        audio_url: audioUrl,
        created_at: result.created_at
      });

    if (dbError) {
      console.error("Supabase Database Insert Error:", dbError.message);
    }

    return NextResponse.json({ ...result, audioUrl });
  } catch (error: any) {
    console.error("Error processing audio:", error);
    return NextResponse.json({ error: error.message || "Failed to process audio" }, { status: 500 });
  }
}
