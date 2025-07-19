"use client";

import { Loader2 } from 'lucide-react';

export function Loader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
        <h1 className="text-2xl font-headline text-foreground">{text}</h1>
      </div>
    </div>
  );
}
