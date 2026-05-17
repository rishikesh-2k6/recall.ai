// ─── Mock Data for Demo / Development ────────────────────────────────────────
// This file provides realistic demo data so the frontend works without a backend.

import type { MeetingResult } from "./types"

export const MOCK_MEETING: MeetingResult = {
  id: "demo-001",
  name: "Q3 Sprint Planning",
  suggestedTitle: "Q3 Sprint Planning — Feature Prioritization",
  stats: {
    duration: 1722,    // 28:42
    speakerCount: 3,
    wordCount: 4218,
    actionItemCount: 5,
  },
  speakers: [
    { id: "s1", label: "Speaker 1", talkTime: 812 },
    { id: "s2", label: "Speaker 2", talkTime: 534 },
    { id: "s3", label: "Speaker 3", talkTime: 376 },
  ],
  transcript: [
    { speaker: "Speaker 1", timestamp: 0, text: "Alright everyone, let's kick off our Q3 sprint planning. We've got a lot to cover today." },
    { speaker: "Speaker 2", timestamp: 8, text: "Before we start, just wanted to flag that the design team has finalized the mockups for the dashboard redesign." },
    { speaker: "Speaker 1", timestamp: 18, text: "Great, that's been a blocker for the frontend team. Let's prioritize that." },
    { speaker: "Speaker 3", timestamp: 26, text: "I think we should also discuss the API migration. The deadline is end of July and we haven't started yet." },
    { speaker: "Speaker 1", timestamp: 35, text: "Good point. Let me pull up the backlog. So for the dashboard redesign, the budget we allocated was around fifty thousand for development." },
    { speaker: "Speaker 2", timestamp: 48, text: "That should be enough if we keep the scope tight. The decision we made last sprint was to use the new component library." },
    { speaker: "Speaker 3", timestamp: 58, text: "Agreed. One action item — can someone set up the new repo structure by Friday?" },
    { speaker: "Speaker 1", timestamp: 67, text: "I'll take that. Also, we need to schedule user testing sessions for the prototype." },
    { speaker: "Speaker 2", timestamp: 78, text: "I can handle the user testing coordination. Should we target next week?" },
    { speaker: "Speaker 1", timestamp: 85, text: "Yes, that works. Moving on to the API migration — what's the current status?" },
    { speaker: "Speaker 3", timestamp: 93, text: "We've mapped out all the endpoints. The main blocker is the auth layer — we need to decide between OAuth 2.0 and the custom token approach." },
    { speaker: "Speaker 1", timestamp: 108, text: "Let's go with OAuth 2.0. It's the industry standard and will save us time in the long run. That's a decision we need to finalize today." },
    { speaker: "Speaker 2", timestamp: 120, text: "Makes sense. I'll update the architecture docs to reflect that decision." },
    { speaker: "Speaker 3", timestamp: 128, text: "One more thing — the QA team flagged some performance issues on the current dashboard. Load times are over 3 seconds on mobile." },
    { speaker: "Speaker 1", timestamp: 140, text: "That's concerning. Let's add a performance audit to the sprint. We should target under 1.5 seconds." },
    { speaker: "Speaker 2", timestamp: 152, text: "I can run Lighthouse audits and set up monitoring. Should be done by midweek." },
    { speaker: "Speaker 1", timestamp: 160, text: "Perfect. Let's wrap up with a quick summary of action items before we close out." },
  ],
  tldr: "The team discussed Q3 priorities focusing on two major initiatives: the dashboard redesign (now unblocked by completed design mockups) and the API migration (deadline end of July). Key decisions were made to adopt OAuth 2.0 for the auth layer and use the new component library for the frontend rebuild. Performance concerns were raised about mobile load times exceeding 3 seconds, prompting a sprint-level performance audit targeting sub-1.5 second loads.",
  keyQuote: "Let's go with OAuth 2.0. It's the industry standard and will save us time in the long run.",
  actionItems: [
    { id: "a1", text: "Set up new repository structure for dashboard redesign", assignee: "Speaker 1", priority: "high", done: false },
    { id: "a2", text: "Coordinate and schedule user testing sessions for next week", assignee: "Speaker 2", priority: "high", done: false },
    { id: "a3", text: "Update architecture docs to reflect OAuth 2.0 decision", assignee: "Speaker 2", priority: "medium", done: false },
    { id: "a4", text: "Run Lighthouse performance audits on current dashboard", assignee: "Speaker 2", priority: "medium", done: false },
    { id: "a5", text: "Begin endpoint mapping for API migration auth layer", assignee: "Speaker 3", priority: "low", done: false },
  ],
  insights: {
    sentiment: "aligned",
    risks: [
      "API migration deadline is tight — end of July with work not yet started",
      "Mobile performance is degraded — 3+ second load times reported by QA",
    ],
    decisions: [
      "Adopt OAuth 2.0 for API migration auth layer",
      "Use new component library for dashboard redesign",
      "Target sub-1.5s load time for mobile dashboard",
    ],
    talkRatio: {
      s1: 47,
      s2: 31,
      s3: 22,
    },
  },
}

// Multiple meetings for history page
export const MOCK_MEETINGS: Array<MeetingResult & { created_at: string }> = [
  { ...MOCK_MEETING, created_at: "2026-05-17T10:00:00Z" },
  {
    ...MOCK_MEETING,
    id: "demo-002",
    name: "Design Review — Mobile App",
    tldr: "Reviewed the mobile app wireframes for the v2 release. The team agreed on a bottom navigation pattern and decided to drop the hamburger menu. Key concerns about accessibility were raised.",
    stats: { duration: 2340, speakerCount: 4, wordCount: 5812, actionItemCount: 3 },
    actionItems: MOCK_MEETING.actionItems.slice(0, 3),
    insights: { ...MOCK_MEETING.insights, sentiment: "uncertain" as const },
    created_at: "2026-05-16T14:30:00Z",
  },
  {
    ...MOCK_MEETING,
    id: "demo-003",
    name: "1:1 with Alex — Career Growth",
    tldr: "Discussed career development goals and upcoming promotion cycle. Alex expressed interest in moving into a tech lead role. Agreed on a 90-day plan with specific deliverables.",
    stats: { duration: 1080, speakerCount: 2, wordCount: 2105, actionItemCount: 4 },
    speakers: MOCK_MEETING.speakers.slice(0, 2),
    insights: { ...MOCK_MEETING.insights, sentiment: "aligned" as const, risks: [] },
    created_at: "2026-05-15T09:00:00Z",
  },
  {
    ...MOCK_MEETING,
    id: "demo-004",
    name: "Client Sync — Acme Corp",
    tldr: "Quarterly business review with Acme Corp. Client expressed concerns about timeline delays on the integration project. Negotiated a 2-week extension and agreed on weekly status calls.",
    stats: { duration: 3600, speakerCount: 5, wordCount: 8100, actionItemCount: 6 },
    insights: { ...MOCK_MEETING.insights, sentiment: "tense" as const },
    created_at: "2026-05-14T16:00:00Z",
  },
  {
    ...MOCK_MEETING,
    id: "demo-005",
    name: "Engineering All-Hands",
    tldr: "Monthly engineering all-hands covering infrastructure costs, hiring pipeline, and Q3 OKRs. Budget for cloud spending approved at $85K/month. Two new senior engineer roles opened.",
    stats: { duration: 2700, speakerCount: 6, wordCount: 6500, actionItemCount: 2 },
    insights: { ...MOCK_MEETING.insights, sentiment: "neutral" as const },
    created_at: "2026-05-12T11:00:00Z",
  },
]
