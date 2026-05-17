"use client"

import { Briefcase, Users, Headphones, Lightbulb, GraduationCap, Phone } from "lucide-react"
import type { RecorderSettings as Settings } from "@/lib/types"

export interface MeetingTemplate {
  id: string
  label: string
  icon: React.ElementType
  description: string
  settings: Partial<Settings>
  nameSuggestion: string
}

export const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    id: "standup",
    label: "Standup",
    icon: Users,
    description: "Daily standup / sync",
    settings: { diarize: true, actions: true, style: "bullet" },
    nameSuggestion: "Daily Standup",
  },
  {
    id: "interview",
    label: "Interview",
    icon: Briefcase,
    description: "Candidate interview",
    settings: { diarize: true, actions: false, style: "detailed" },
    nameSuggestion: "Interview",
  },
  {
    id: "lecture",
    label: "Lecture",
    icon: GraduationCap,
    description: "Class / workshop",
    settings: { diarize: false, actions: false, style: "detailed" },
    nameSuggestion: "Lecture Notes",
  },
  {
    id: "sales",
    label: "Sales Call",
    icon: Phone,
    description: "Client / prospect call",
    settings: { diarize: true, actions: true, style: "detailed" },
    nameSuggestion: "Sales Call",
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    icon: Lightbulb,
    description: "Ideation session",
    settings: { diarize: true, actions: true, style: "bullet" },
    nameSuggestion: "Brainstorm Session",
  },
  {
    id: "podcast",
    label: "Podcast",
    icon: Headphones,
    description: "Podcast / recording",
    settings: { diarize: true, actions: false, style: "detailed" },
    nameSuggestion: "Podcast Episode",
  },
]

interface MeetingTemplatePickerProps {
  onSelect: (template: MeetingTemplate) => void
}

export function MeetingTemplatePicker({ onSelect }: MeetingTemplatePickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
        Meeting Templates
      </p>
      <div className="grid grid-cols-3 gap-2">
        {MEETING_TEMPLATES.map(template => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-all group"
          >
            <template.icon className="w-4 h-4 text-[var(--text3)] group-hover:text-[var(--accent)] transition-colors" />
            <span className="text-[10px] font-medium text-[var(--text2)] group-hover:text-[var(--text)] transition-colors">
              {template.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
