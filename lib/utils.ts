// ─── Recall.ai Utility Helpers ────────────────────────────────────────────────

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge Tailwind classes (used by shadcn components) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format seconds into HH:MM:SS */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

/** Format seconds into MM:SS (for compact displays) */
export function formatMinSec(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/** Format a timestamp in seconds to a friendly label like "2:34" */
export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/** Speaker colors palette */
export const SPEAKER_COLORS = ['#7c6ef0', '#f05c5c', '#4ade80', '#fbbf24', '#22d3ee', '#f97316']

/** Get initials from a speaker label */
export function getInitials(label: string): string {
  return label.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

/** Get speaker color by index */
export function getSpeakerColor(index: number): string {
  return SPEAKER_COLORS[index % SPEAKER_COLORS.length]
}

/** Priority badge color mapping */
export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  const map = { high: '#f05c5c', medium: '#fbbf24', low: '#7c6ef0' }
  return map[priority]
}
