import { MeetingProvider } from "@/contexts/meeting-context"
import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"

export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MeetingProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </MeetingProvider>
  )
}
