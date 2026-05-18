import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { HfInference } from "@huggingface/inference"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  const hf = new HfInference(process.env.HF_TOKEN)
  const nvidia = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: "https://integrate.api.nvidia.com/v1",
  })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { query } = await req.json()

  // 1. Embed the user's query
  const queryEmbedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: query,
  }) as number[]

  // 2. Vector similarity search in Supabase
  const admin = createAdminClient()
  const { data: chunks } = await admin.rpc("match_meeting_embeddings", {
    query_embedding: queryEmbedding,
    match_user_id: user.id,
    match_threshold: 0.65,
    match_count: 6,
  })

  if (!chunks || chunks.length === 0) {
    return NextResponse.json({ answer: "I couldn't find anything in your meeting history related to that question." })
  }

  // 3. Answer the question using the retrieved context
  const context = chunks.map((c: any) => c.chunk_text).join("\n\n---\n\n")
  const completion = await nvidia.chat.completions.create({
    model: "meta/llama-3.1-70b-instruct",
    messages: [
      { role: "system", content: "You are a helpful assistant that answers questions about past meeting notes. Answer concisely based only on the provided context. If the context doesn't contain the answer, say so." },
      { role: "user", content: `Context from past meetings:\n\n${context}\n\nQuestion: ${query}` },
    ],
    temperature: 0.2,
  })

  return NextResponse.json({ answer: completion.choices[0].message.content })
}
