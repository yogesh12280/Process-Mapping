"use client"

import React, { memo, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useUpdateNodeInternals } from '@xyflow/react';
import { Play, CheckCircle2, User, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeType = 'start' | 'end' | 'user' | 'step';
export type NodeShape = 'rectangle' | 'rectangleTan' | 'diamond' | 'preparation' | 'hexagon' | 'hexagonLime';

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
    const baseBorder = "border-2 border-solid border-black";
    const selectionRing = selected ? "ring-4 ring-primary/20" : "";

    // Diamond, Hexagon and Preparation use SVG strokes for borders, so we hide the main container border
    if (shape === 'hexagon' || shape === 'hexagonLime' || shape === 'preparation' || shape === 'diamond') {
      return cn("bg-transparent border-none shadow-none", selected && "ring-4 ring-primary/20 rounded-lg");
    }
    
    // Prioritize specific shape colors for recognized process/detail steps
    if (shape === 'rectangle') return cn(baseBorder, "bg-[#deeaee]", "shadow-sm", selectionRing);
    if (shape === 'rectangleTan') return cn(baseBorder, "bg-[#dac292]", "shadow-sm", selectionRing);

    switch (type) {
      case 'start': return cn(baseBorder, "bg-emerald-50/10", selectionRing);
      case 'end': return cn(baseBorder, "bg-rose-50/10", selectionRing);
      case 'user': return cn(baseBorder, "bg-primary/5", selectionRing);
      default: return cn(baseBorder, "bg-white shadow-sm", selectionRing);
    }
  };

  const getShapeClasses = () => {
    switch (shape) {
      case 'diamond':
      case 'preparation': return "rounded-none w-full h-full";
      case 'hexagon':
      case 'hexagonLime': return "rounded-none w-full h-full";
      case 'rectangleTan':
      default: return "rounded-xl w-full h-full"; // rectangle variants
    }
  };

  const getShapeStyles = (): React.CSSProperties => {
    if (shape === 'hexagon' || shape === 'hexagonLime') {
      return {
        clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
      };
    }
    if (shape === 'diamond') {
      return {
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      };
    }
    return {};
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
          minWidth={shape === 'rectangle' || shape === 'rectangleTan' || shape === 'hexagon' || shape === 'hexagonLime' ? 150 : (shape === 'preparation' ? 115 : 100)} 
          minHeight={shape === 'rectangle' || shape === 'rectangleTan' || shape === 'hexagon' || shape === 'hexagonLime' ? 60 : (shape === 'preparation' ? 80 : 100)} 
          keepAspectRatio={shape !== 'rectangle' && shape !== 'rectangleTan' && shape !== 'preparation' && shape !== 'hexagon' && shape !== 'hexagonLime'}
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

      <div 
        className={cn(
          "flex items-center justify-center p-3 transition-all duration-200 relative z-10",
          getBorder(),
          getShapeClasses()
        )}
        style={getShapeStyles()}
      >
        {(shape === 'hexagon' || shape === 'hexagonLime') && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="drop-shadow-sm">
              <defs>
                <linearGradient id="violetGradientNode" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#5b21b6' }} />
                  <stop offset="100%" style={{ stopColor: '#ffffff' }} />
                </linearGradient>
              </defs>
              <polygon 
                points="10,0 90,0 100,50 90,100 10,100 0,50" 
                fill={shape === 'hexagonLime' ? "#a3e635" : "url(#violetGradientNode)"} 
                stroke="black" 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        )}
        {shape === 'diamond' && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="drop-shadow-sm">
              <polygon 
                points="50,0 100,50 50,100 0,50" 
                fill={type === 'start' ? "#ecfdf5" : (type === 'end' ? "#fff1f2" : (type === 'user' ? "#f8fafc" : "white"))} 
                stroke="black" 
                strokeWidth="2" 
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        )}
        {shape === 'preparation' && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="drop-shadow-sm">
              {/* Back Layer - Hexagon */}
              <polygon 
                points="10,10 90,10 100,50 90,90 10,90 0,50" 
                className="fill-lime-400/50 stroke-black stroke-[2px]"
                vectorEffect="non-scaling-stroke"
              />
              {/* Front Layer - Rectangle */}
              <rect 
                x="2" y="2" width="88" height="80" 
                className="fill-lime-400 stroke-black stroke-[2px]"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        )}
        <div className={cn(
          "flex items-center gap-3 w-full relative z-10",
          shape === 'diamond' ? "flex-col justify-center" : "flex-row justify-center",
        )}>
          <div className={cn(
            "flex flex-col min-w-0 overflow-hidden",
            shape === 'diamond' ? "text-center" : "text-center flex-1"
          )}>
            <p className={cn(
              "text-[10px] font-bold leading-tight uppercase tracking-tight whitespace-normal break-words px-2 text-black",
              shape === 'hexagon' && "drop-shadow-sm"
            )}>
              {label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CustomNode);
