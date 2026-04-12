"use client"

import React, { memo, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useUpdateNodeInternals } from '@xyflow/react';
import { Play, CheckCircle2, User, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeType = 'start' | 'end' | 'user' | 'step';
export type NodeShape = 'rectangle' | 'square' | 'diamond' | 'circle';

export interface CustomNodeData {
  label: string;
  type: NodeType;
  shape?: NodeShape;
  isLocked?: boolean;
  targetPos?: 'left' | 'top';
  sourcePos?: 'right' | 'bottom';
  showTarget?: boolean;
  showSource?: boolean;
  // Diamond specific handle visibility
  showTop?: boolean;
  showBottom?: boolean;
  showLeft?: boolean;
  showRight?: boolean;
  topLabel?: string;
  bottomLabel?: string;
  leftLabel?: string;
  rightLabel?: string;
}

const CustomNode = ({ id, data, selected }: NodeProps) => {
  const { 
    label, 
    type, 
    shape = 'rectangle',
    isLocked, 
    targetPos = 'left', 
    sourcePos = 'right',
    showTarget = true,
    showSource = true,
    showTop = true,
    showBottom = true,
    showLeft = true,
    showRight = true,
    topLabel,
    bottomLabel,
    leftLabel,
    rightLabel
  } = data as unknown as CustomNodeData;

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, shape, targetPos, sourcePos, showTarget, showSource, showTop, showBottom, showLeft, showRight, topLabel, bottomLabel, leftLabel, rightLabel, updateNodeInternals]);

  const getIcon = () => {
    switch (type) {
      case 'start': return <Play className="w-4 h-4 text-emerald-600" />;
      case 'end': return <CheckCircle2 className="w-4 h-4 text-rose-600" />;
      case 'user': return <User className="w-4 h-4 text-primary" />;
      default: return <Box className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getBorder = () => {
    if (selected) return "border-primary ring-4 ring-primary/20 bg-white";
    switch (type) {
      case 'start': return "border-emerald-200 bg-emerald-50/10";
      case 'end': return "border-rose-200 bg-rose-50/10";
      case 'user': return "border-primary/20 bg-primary/5";
      default: return "border-slate-200 bg-white";
    }
  };

  const getShapeClasses = () => {
    switch (shape) {
      case 'square': return "rounded-none aspect-square w-full h-full";
      case 'circle': return "rounded-full aspect-square w-full h-full";
      case 'diamond': return "rounded-none rotate-45 w-[70.7%] h-[70.7%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      default: return "rounded-xl w-full h-full"; // rectangle
    }
  };

  const baseHandleStyle: React.CSSProperties = {
    width: '10px',
    height: '10px',
    background: 'hsl(var(--primary))',
    border: '2px solid white',
    zIndex: 1000,
  };

  return (
    <div className="w-full h-full relative group/node overflow-visible flex items-center justify-center">
      {!isLocked && (
        <NodeResizer 
          color="hsl(var(--primary))" 
          isVisible={selected} 
          minWidth={shape === 'rectangle' ? 150 : 100} 
          minHeight={shape === 'rectangle' ? 60 : 100} 
          keepAspectRatio={shape !== 'rectangle'}
        />
      )}

      {/* Handles for Diamond (4 points) or standard (2 points) */}
      {shape === 'diamond' ? (
        <>
          {showTop && (
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
              {topLabel && <span className="text-[8px] font-bold text-primary bg-white px-1 rounded border border-primary/20 mb-1 whitespace-nowrap -translate-y-full absolute top-0">{topLabel}</span>}
              <Handle type="target" position={Position.Top} id="top" style={baseHandleStyle} className="hover:scale-125 transition-transform shadow-sm !bg-primary" />
            </div>
          )}
          {showBottom && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <Handle type="source" position={Position.Bottom} id="bottom" style={baseHandleStyle} className="hover:scale-125 transition-transform shadow-sm !bg-primary" />
              {bottomLabel && <span className="text-[8px] font-bold text-primary bg-white px-1 rounded border border-primary/20 mt-1 whitespace-nowrap translate-y-full absolute bottom-0">{bottomLabel}</span>}
            </div>
          )}
          {showLeft && (
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 flex items-center">
              {leftLabel && <span className="text-[8px] font-bold text-primary bg-white px-1 rounded border border-primary/20 mr-1 whitespace-nowrap -translate-x-full absolute left-0">{leftLabel}</span>}
              <Handle type="source" position={Position.Left} id="left" style={baseHandleStyle} className="hover:scale-125 transition-transform shadow-sm !bg-primary" />
            </div>
          )}
          {showRight && (
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 flex items-center">
              <Handle type="source" position={Position.Right} id="right" style={baseHandleStyle} className="hover:scale-125 transition-transform shadow-sm !bg-primary" />
              {rightLabel && <span className="text-[8px] font-bold text-primary bg-white px-1 rounded border border-primary/20 ml-1 whitespace-nowrap translate-x-full absolute right-0">{rightLabel}</span>}
            </div>
          )}
        </>
      ) : (
        <>
          {showTarget && (
            <Handle 
              type="target" 
              id="target"
              position={targetPos === 'top' ? Position.Top : Position.Left} 
              style={baseHandleStyle}
              className="hover:scale-125 transition-transform shadow-sm !bg-primary"
            />
          )}
          {showSource && (
            <Handle 
              type="source" 
              id="source"
              position={sourcePos === 'bottom' ? Position.Bottom : Position.Right} 
              style={baseHandleStyle}
              className="hover:scale-125 transition-transform shadow-sm !bg-primary"
            />
          )}
        </>
      )}

      <div className={cn(
        "flex items-center justify-center p-3 border-2 shadow-sm transition-all duration-200 hover:shadow-md relative z-10",
        getBorder(),
        getShapeClasses()
      )}>
        <div className={cn(
          "flex items-center gap-3 w-full",
          shape === 'diamond' ? "flex-col justify-center -rotate-45" : "flex-row justify-start",
        )}>
          <div className={cn(
            "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-white border group-hover/node:scale-110 transition-transform",
            type === 'start' && "border-emerald-100",
            type === 'end' && "border-rose-100"
          )}>
            {getIcon()}
          </div>
          <div className={cn(
            "flex flex-col min-w-0 overflow-hidden",
            shape === 'diamond' ? "text-center" : "flex-1"
          )}>
            <p className="text-[10px] font-bold text-foreground leading-tight uppercase tracking-tight whitespace-normal break-words">
              {label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CustomNode);
