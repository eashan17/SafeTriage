import { Activity, Shield } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo + brand */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <Activity className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight tracking-tight text-foreground">
              SafeTriage
              <span className="ml-1 text-primary">AI</span>
            </span>
            <span className="text-[11px] leading-none text-muted-foreground">
              Human-in-the-Loop Triage
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/5 px-3 py-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-success">System Online</span>
          <Shield className="size-3.5 text-success" />
        </div>
      </div>
    </header>
  );
}
