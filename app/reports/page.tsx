export default function ReportsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-card p-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage your reports
        </p>
      </div>
      <div className="flex-1 p-6">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            Reports content will go here.
          </p>
        </div>
      </div>
    </div>
  )
}

