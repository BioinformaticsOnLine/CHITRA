'use client';

import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, Save, LogIn } from 'lucide-react';
import { ShareDrawer } from '@/components/share-drawer';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function UserActions({
  onShare,
  onSave,
  onSignOut,
  isVertical
}: {
  onShare: (title: string, isPublic: boolean) => Promise<string | null>;
  onSave: (title: string) => Promise<string | null>;
  onSignOut?: () => void;
  isVertical?: boolean
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  // We can internally handle the save check for user
  const handleSave = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to save.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave("Untitled Visualization");
    } catch (e) {
      console.error(e);
      // Toast is likely handled in parent, but safety check
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-1 p-1.5 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-2xl shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1 p-1.5 bg-white/80 dark:bg-black/40 backdrop-blur-md border-[1.5px] border-indigo-200/50 dark:border-white/20 rounded-2xl shadow-lg",
      isVertical ? "flex-col" : "flex-row"
    )}>
      {isSignedIn ? (
        <>
          <div className="p-1">
            <UserButton afterSignOutUrl="/" />
          </div>

          {isVertical && <Separator orientation="horizontal" className="w-6 my-1 bg-white/20" />}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
            title="Save Visualization"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          </Button>

          <ShareDrawer onShare={onShare} />
        </>
      ) : (
        <SignInButton mode="modal" forceRedirectUrl="/chitra">
          <button
            className={cn(
              "p-2 rounded-lg transition-colors flex items-center gap-2 text-xs",
              !isVertical && "px-3",
              "bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 [&_svg]:stroke-blue-500"
            )}
          >
            <LogIn className="h-4 w-4" />
            {!isVertical && <span>Sign In</span>}
          </button>
        </SignInButton>
      )}
    </div>
  );
}
