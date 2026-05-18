"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sun, Moon, Monitor, Key, User, Trash2, Bell, Shield } from "lucide-react"
import { toast } from "sonner"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  theme: "dark" | "light"
  onThemeChange: (theme: "dark" | "light") => void
}

const TABS = [
  { id: "general", label: "General", icon: Monitor },
  { id: "profile", label: "Profile", icon: User },
  { id: "api", label: "API Keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: Shield },
]

export function SettingsModal({ open, onClose, theme, onThemeChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [language, setLanguage] = useState("en")
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyBrowser, setNotifyBrowser] = useState(false)
  const [name, setName] = useState("Rishikesh")
  const [email, setEmail] = useState("rishikesh@example.com")

  function handleDeleteAccount() {
    if (!confirm("Are you absolutely sure? This will permanently delete your account and all your meetings.")) return
    toast.promise(
      fetch("/api/account/delete", { method: "POST" }),
      {
        loading: "Deleting account...",
        success: "Account deleted. Goodbye!",
        error: "Failed to delete account.",
      }
    )
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--border2)] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-base font-semibold text-[var(--text)]">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Left tabs */}
                <div className="w-44 border-r border-[var(--border)] py-3 flex-shrink-0">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left relative
                        ${tab.id === "danger" ? "mt-auto" : ""}
                        ${activeTab === tab.id
                          ? tab.id === "danger"
                            ? "text-[var(--red)] bg-[var(--red)]/8 font-medium"
                            : "text-[var(--accent)] bg-[var(--accent)]/8 font-medium"
                          : tab.id === "danger"
                            ? "text-[var(--red)]/70 hover:text-[var(--red)] hover:bg-[var(--red)]/5"
                            : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
                        }
                      `}
                    >
                      {activeTab === tab.id && (
                        <span className="absolute right-0 top-0 h-full w-0.5 bg-[var(--accent)] rounded-l-full" />
                      )}
                      <tab.icon className="w-4 h-4 flex-shrink-0" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Right content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* General */}
                  {activeTab === "general" && (
                    <div className="space-y-5">
                      <Section title="Appearance">
                        <p className="text-xs text-[var(--text3)] mb-3">Choose your preferred color theme.</p>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { value: "dark", label: "Dark", icon: Moon },
                            { value: "light", label: "Light", icon: Sun },
                          ] as const).map(({ value, label, icon: Icon }) => (
                            <button
                              key={value}
                              onClick={() => onThemeChange(value)}
                              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                theme === value
                                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                  : "border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)] hover:text-[var(--text)]"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {label}
                            </button>
                          ))}
                        </div>
                      </Section>

                      <Section title="Language">
                        <select
                          value={language}
                          onChange={e => setLanguage(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]/50 transition-colors"
                        >
                          <option value="en">English</option>
                          <option value="hi">Hindi</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </Section>
                    </div>
                  )}

                  {/* Profile */}
                  {activeTab === "profile" && (
                    <div className="space-y-4">
                      <Section title="Profile Details">
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-14 h-14 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xl font-bold text-[var(--accent)]">
                            {name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text)]">{name}</p>
                            <p className="text-xs text-[var(--text3)]">Free Plan · 5 meetings used</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Field label="Display Name">
                            <input
                              value={name}
                              onChange={e => setName(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]/50 transition-colors"
                            />
                          </Field>
                          <Field label="Email">
                            <input
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]/50 transition-colors"
                            />
                          </Field>
                        </div>
                        <button
                          onClick={() => toast.success("Profile updated!")}
                          className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors"
                        >
                          Save Changes
                        </button>
                      </Section>
                    </div>
                  )}

                  {/* API Keys */}
                  {activeTab === "api" && (
                    <div className="space-y-4">
                      <Section title="API Configuration">
                        <p className="text-xs text-[var(--text3)] mb-4">These keys power your AI transcription and analysis pipeline.</p>
                        <div className="space-y-3">
                          {[
                            { label: "Groq API Key", placeholder: "gsk_...", hint: "For Whisper transcription" },
                            { label: "NVIDIA API Key", placeholder: "nvapi-...", hint: "For Llama 3 analysis" },
                            { label: "Notion Integration Token", placeholder: "secret_...", hint: "For Notion export" },
                          ].map(field => (
                            <Field key={field.label} label={field.label}>
                              <input
                                type="password"
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-sm text-[var(--text)] font-mono outline-none focus:border-[var(--accent)]/50 transition-colors"
                              />
                              <p className="mt-1 text-[10px] text-[var(--text3)]">{field.hint}</p>
                            </Field>
                          ))}
                        </div>
                        <button
                          onClick={() => toast.success("API keys saved!")}
                          className="mt-3 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors"
                        >
                          Save Keys
                        </button>
                      </Section>
                    </div>
                  )}

                  {/* Notifications */}
                  {activeTab === "notifications" && (
                    <Section title="Notification Preferences">
                      <div className="space-y-3">
                        <Toggle
                          label="Email notifications"
                          description="Get a summary email after each meeting"
                          checked={notifyEmail}
                          onChange={setNotifyEmail}
                        />
                        <Toggle
                          label="Browser notifications"
                          description="Desktop alerts when processing is done"
                          checked={notifyBrowser}
                          onChange={setNotifyBrowser}
                        />
                      </div>
                    </Section>
                  )}

                  {/* Danger Zone */}
                  {activeTab === "danger" && (
                    <Section title="Danger Zone">
                      <div className="p-4 rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/5 space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--red)]">Delete Account</p>
                          <p className="text-xs text-[var(--text3)] mt-1">
                            Permanently delete your account and all meeting data. This action cannot be undone.
                          </p>
                        </div>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--red)] text-white text-sm font-medium hover:bg-[var(--red)]/90 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete My Account
                        </button>
                      </div>
                    </Section>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text3)] mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text2)] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
      <div>
        <p className="text-sm text-[var(--text)]">{label}</p>
        <p className="text-xs text-[var(--text3)] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-[var(--accent)]" : "bg-[var(--bg3)]"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  )
}
