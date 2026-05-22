import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceRole);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const GEMINI_SYNTHESIS_PROMPT = `Analyze the attached audio recording of this meeting. Your job is to generate a comprehensive meeting summary, extract key takeaways, and output a detailed, speaker-diarized transcript.

CRITICAL INSTRUCTIONS:
1. Detect all unique speakers in the audio and list them in the "speakers" array with estimated speak times (in seconds). Assign them diarized names like "Speaker 1", "Speaker 2", etc.
2. Transcribe the meeting line-by-line with timestamps (in seconds from start) and speaker attribution. Format each line inside the "transcript" array.
3. Write a high-level summary inside the "tldr" field.
4. Extract actionable items into the "actionItems" array, specifying text, priority (high, medium, or low), and assignee (if mentioned, otherwise null).
5. Extract sentiment (aligned, tense, uncertain, neutral), risk list, and decision list inside the "insights" object.

You must respond in strict JSON matching this structure:
{
  "name": "Descriptive title of the meeting (max 6 words)",
  "tldr": "2-3 sentence executive summary",
  "keyQuote": "Most important quote from the call",
  "speakers": [
    { "id": "s1", "label": "Speaker 1", "talkTime": 120 }
  ],
  "transcript": [
    { "speaker": "Speaker 1", "timestamp": 0, "text": "Welcome to the sync." }
  ],
  "actionItems": [
    { "text": "Update the database config", "priority": "high", "assignee": "Dave" }
  ],
  "insights": {
    "sentiment": "aligned",
    "meetingType": "Daily Standup",
    "risks": ["Database deprecation schedule is tight"],
    "decisions": ["Agreed to migrate to Supabase pgvector"]
  }
}`;

export async function processMeetingAudio(audioFilePath: string, scheduleId: string, userId: string) {
  console.log(`[Gemini Processor] Starting transcription pipeline for file: ${audioFilePath}`);

  try {
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found at path: ${audioFilePath}`);
    }

    if (!geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }

    // 1. Upload the raw audio recording to Gemini File API
    console.log("[Gemini Processor] Uploading audio recording to Gemini File API...");
    const audioFile = await ai.files.upload({
      file: audioFilePath,
      mimeType: "audio/wav",
    });
    console.log(`[Gemini Processor] Upload completed successfully. URI: ${audioFile.uri}`);

    // 2. Perform speaker-diarized transcription and synthesis
    console.log("[Gemini Processor] Querying Gemini 1.5 Flash cognitive engine...");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        audioFile,
        { text: GEMINI_SYNTHESIS_PROMPT }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    if (!response.text) {
      throw new Error("Failed to receive transcript/notes response from Gemini AI.");
    }

    const aiResult = JSON.parse(response.text);
    console.log("[Gemini Processor] AI analysis and diarization completed successfully!");

    // 3. Upload raw audio file to Supabase Storage
    console.log("[Gemini Processor] Uploading recording to Supabase Storage bucket...");
    const meetingId = crypto.randomUUID();
    const fileBuffer = fs.readFileSync(audioFilePath);
    const fileName = `${meetingId}.wav`;
    const bucketName = "meetings-audio";

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: "audio/wav",
        cacheControl: "3600",
        upsert: true
      });

    let audioUrl = "";
    if (uploadError) {
      console.error(`[Gemini Processor] Supabase Storage upload warning: ${uploadError.message}`);
    } else {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      audioUrl = data.publicUrl;
      console.log(`[Gemini Processor] Storage upload completed. Public URL: ${audioUrl}`);
    }

    // Calculate total duration in seconds from the transcript timestamps or file stats
    const transcriptLines = aiResult.transcript || [];
    const duration = transcriptLines.length > 0 
      ? Math.round(transcriptLines[transcriptLines.length - 1].timestamp + 5) 
      : 60;

    const formattedMeeting = {
      id: meetingId,
      user_id: userId,
      name: aiResult.name || "Untitled Autopilot Meeting",
      duration,
      transcript: transcriptLines,
      tldr: aiResult.tldr || "No summary generated.",
      key_quote: aiResult.keyQuote || "",
      action_items: (aiResult.actionItems || []).map((item: any) => ({
        id: crypto.randomUUID(),
        text: item.text,
        assignee: item.assignee || null,
        priority: item.priority || "medium",
        done: false
      })),
      speakers: aiResult.speakers || [{ id: "s1", label: "Speaker 1", talkTime: duration }],
      insights: {
        sentiment: aiResult.insights?.sentiment || "neutral",
        meetingType: aiResult.insights?.meetingType || "General Discussion",
        risks: aiResult.insights?.risks || [],
        decisions: aiResult.insights?.decisions || []
      },
      audio_url: audioUrl,
      created_at: new Date().toISOString()
    };

    // 4. Save completed meeting details to database
    console.log("[Gemini Processor] Persisting meeting row in meetings table...");
    const { error: dbError } = await supabase
      .from("meetings")
      .insert(formattedMeeting);

    if (dbError) {
      throw new Error(`Supabase Database Insert Error: ${dbError.message}`);
    }

    // 5. Update schedule status to completed
    console.log(`[Gemini Processor] Updating bot schedule ${scheduleId} to completed.`);
    const { error: updateError } = await supabase
      .from("bot_schedules")
      .update({
        status: "completed",
        meeting_id: meetingId,
        updated_at: new Date().toISOString()
      })
      .eq("id", scheduleId);

    if (updateError) {
      console.error(`[Gemini Processor] Warning: Failed to update bot schedule: ${updateError.message}`);
    }

    // Cleanup: Delete temporary audio file from worker container disk
    try {
      fs.unlinkSync(audioFilePath);
      console.log(`[Gemini Processor] Cleaned up temporary recording file: ${audioFilePath}`);
    } catch (cleanupErr) {
      console.warn(`[Gemini Processor] Warning: Failed to clean up ${audioFilePath}`);
    }

    return formattedMeeting;
  } catch (error: any) {
    console.error("[Gemini Processor Error]:", error);
    
    // Mark schedule as failed in database
    await supabase
      .from("bot_schedules")
      .update({
        status: "failed",
        error_message: error.message || "Failed in Gemini synthesis pipeline",
        updated_at: new Date().toISOString()
      })
      .eq("id", scheduleId);

    throw error;
  }
}
