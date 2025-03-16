'use client';

import React, { useState } from 'react';
import { Maximize2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExpandedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  triggerLabel?: string;
  placeholder?: string;
}

export function ExpandedTextEditor({
  value,
  onChange,
  title,
  triggerLabel = 'Expand',
  placeholder = 'Enter text...',
}: ExpandedTextEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleOpen = () => {
    setLocalValue(value);
    setIsOpen(true);
  };

  const handleSave = () => {
    onChange(localValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        variant="secondary" 
        size="sm" 
        className="flex items-center gap-1 shrink-0 ml-1 px-2 py-1 h-8 w-8 sm:w-auto" 
        onClick={handleOpen}
        title={triggerLabel}
      >
        <Maximize2 className="h-4 w-4" />
        <span className="hidden sm:inline">{triggerLabel}</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col w-[95vw] sm:w-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 mb-4">
            <Textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              placeholder={placeholder}
              className="min-h-[60vh] w-full resize-none font-mono text-sm p-4"
            />
          </ScrollArea>
          
          <div className="flex flex-wrap justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              size="sm"
              className="px-2 py-1 h-9 text-xs sm:text-sm sm:h-10 sm:px-4"
            >
              <X className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              size="sm"
              className="px-2 py-1 h-9 text-xs sm:text-sm sm:h-10 sm:px-4"
            >
              <Save className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
