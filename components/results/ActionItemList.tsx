"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X } from "lucide-react"
import { getPriorityColor } from "@/lib/utils"
import type { ActionItem } from "@/lib/types"

interface ActionItemListProps {
  items: ActionItem[]
  onChange?: (items: ActionItem[]) => void
}

export function ActionItemList({ items, onChange }: ActionItemListProps) {
  const [localItems, setLocalItems] = useState(items)
  const [newText, setNewText] = useState("")
  const [showInput, setShowInput] = useState(false)

  function toggleDone(id: string) {
    const updated = localItems.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    )
    setLocalItems(updated)
    onChange?.(updated)
  }

  function addItem() {
    if (!newText.trim()) return
    const newItem: ActionItem = {
      id: `action-${Date.now()}`,
      text: newText.trim(),
      priority: 'medium',
      done: false,
    }
    const updated = [...localItems, newItem]
    setLocalItems(updated)
    onChange?.(updated)
    setNewText("")
    setShowInput(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") addItem()
    if (e.key === "Escape") { setShowInput(false); setNewText("") }
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {localItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] ${item.done ? "opacity-50" : ""}`}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleDone(item.id)}
              className="mt-0.5 w-4 h-4 rounded accent-[var(--accent)] cursor-pointer"
            />

            {/* Text + metadata */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.done ? "line-through text-[var(--text3)]" : "text-[var(--text)]"}`}>
                {item.text}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                  style={{
                    color: getPriorityColor(item.priority),
                    backgroundColor: getPriorityColor(item.priority) + '15',
                  }}
                >
                  {item.priority}
                </span>
                {item.assignee && (
                  <span className="text-[10px] text-[var(--text3)]">→ {item.assignee}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add new item */}
      {showInput ? (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--accent)]/20 bg-[var(--card)]">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New action item..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text3)] outline-none"
          />
          <button onClick={() => { setShowInput(false); setNewText("") }} className="text-[var(--text3)] hover:text-[var(--text)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-2 w-full p-2 rounded-lg text-sm text-[var(--text3)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add action item
        </button>
      )}
    </div>
  )
}
