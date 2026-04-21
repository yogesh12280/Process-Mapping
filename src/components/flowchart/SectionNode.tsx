"use client"

import React, { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Plus, Play, CheckCircle2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface SectionNodeData {
  label: string;
  onAddChild?: (parentId: string) => void;
  isLocked?: boolean;
}

const SectionNode = ({ id, data, selected }: NodeProps) => {
  const { label, onAddChild, isLocked } = data as unknown as SectionNodeData;
  
  const getIcon = () => {
    if (label === 'Start') return <Play className="h-3 w-3 text-black" fill="currentColor" />;
    if (label === 'End') return <CheckCircle2 className="h-3 w-3 text-black" />;
    return <UserCircle className="h-3 w-3 text-black" />;
  };

  return (
    <>
      {!isLocked && (
        <NodeResizer 
          color="#000000" 
          isVisible={selected} 
          minWidth={200} 
          minHeight={200} 
        />
      )}
      <div className={cn(
        "w-full h-full bg-slate-50/50 border border-dotted rounded-2xl relative group transition-colors",
        selected ? "border-black bg-primary/5 shadow-inner" : "border-slate-400"
      )}>
        <div className="absolute top-4 left-0 right-0 px-4 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-black shadow-sm rounded-full transition-all group-hover:bg-slate-50">
            {getIcon()}
            <span className="text-[10px] font-bold uppercase tracking-widest text-black transition-colors">
              {label}
            </span>
          </div>
          
          {!isLocked && onAddChild && (
            <div className="absolute right-4">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-full bg-white shadow-sm hover:bg-black hover:text-white transition-all border-black cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddChild(id);
                }}
                title={`Add item to ${label}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="w-full h-full" />
      </div>
    </>
  );
};

export default memo(SectionNode);
