"use client"

export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden pl-64">
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  )
}

