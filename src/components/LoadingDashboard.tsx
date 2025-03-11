'use client'

export default function LoadingDashboard() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-background">
      <div className="w-full max-w-5xl p-4">
        {/* Mock dashboard UI */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border border-border">
          <div className="flex border-b border-border">
            <div className="w-1/3 p-3 border-r border-border">
              <div className="h-8 w-4/5 bg-muted rounded mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex">
                    <div className="h-16 w-full bg-muted/50 rounded flex items-center p-2 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-primary/20 mr-2"></div>
                      <div className="flex-1">
                        <div className="h-3 w-full bg-muted rounded mb-2"></div>
                        <div className="h-2 w-4/5 bg-muted rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-2/3 p-4">
              <div className="h-8 w-3/5 bg-muted rounded mb-6 animate-pulse"></div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-muted/50 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-muted/50 rounded animate-pulse"></div>
                <div className="h-4 w-4/5 bg-muted/50 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-muted/50 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse"></div>
              </div>
              <div className="mt-8 space-y-2">
                <div className="h-10 w-1/3 bg-primary/20 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
