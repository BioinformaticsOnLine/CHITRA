'use client';

import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Share2, Copy, Trash2, Eye, EyeOff, ExternalLink, RefreshCw } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShareDrawerProps {
  onShare: (title: string, isPublic: boolean) => Promise<string | null>;
  user?: any; // Kept for compatibility, but not used directly
}

export function ShareDrawer({ onShare }: ShareDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Convex Query for real-time list
  const visualizations = useQuery(api.visualizations.listMyVisualizations);

  // Convex Mutations
  const deleteViz = useMutation(api.visualizations.deleteVisualization);
  const toggleViz = useMutation(api.visualizations.toggleVisibility);

  const handleShare = async () => {
    if (!title) {
      toast.error('Please enter a title for your shared link.');
      return;
    }
    const shareUrl = await onShare(title, isPublic);
    if (shareUrl) {
      setTitle('');
      setIsPublic(true);
      // No need to manually refetch, Convex is reactive
    }
  };

  const getLink = (id: string) => `${window.location.origin}${window.location.pathname}?shareId=${id}`;

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleTogglePublic = async (id: Id<"visualizations">) => {
    try {
      await toggleViz({ id });
      toast.success("Visibility updated");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    }
  };

  const handleDelete = async (id: Id<"visualizations">) => {
    try {
      if (confirm("Are you sure you want to delete this visualization?")) {
        await deleteViz({ id });
        toast.success("Visualization deleted");
      }
    } catch (error) {
      console.error("Error deleting visualization:", error);
      toast.error("Failed to delete visualization");
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <Share2 className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Share Your Visualization</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create New Share Link</h3>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Human vs. Mouse Synteny"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="is-public">Publicly accessible</Label>
            </div>
            <Button onClick={handleShare} className="w-full sm:w-auto">Create Share Link</Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Shared Links</h3>

            {visualizations === undefined ? (
              <div className="flex justify-center p-4">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : visualizations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/20">
                No saved visualizations yet.
              </div>
            ) : (
              <div className="space-y-3">
                {visualizations.map((viz) => (
                  <div
                    key={viz.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-card text-card-foreground shadow-sm gap-3"
                  >
                    <div className="space-y-1 overflow-hidden min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate" title={viz.title}>
                          {viz.title}
                        </h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${viz.isPublic
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                          {viz.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(viz.creationTime).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex bg-muted/50 rounded-md border border-border self-start sm:self-center">
                      <div className="flex border-r border-border">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none first:rounded-l-md hover:bg-background"
                                onClick={() => copyLink(getLink(viz.id))}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy Link</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none hover:bg-background"
                                onClick={() => window.open(getLink(viz.id), '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Open</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <div className="flex">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-none hover:bg-background ${viz.isPublic ? 'text-green-600' : 'text-gray-500'}`}
                                onClick={() => handleTogglePublic(viz.id)}
                              >
                                {viz.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{viz.isPublic ? 'Make Private' : 'Make Public'}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none last:rounded-r-md hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDelete(viz.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
