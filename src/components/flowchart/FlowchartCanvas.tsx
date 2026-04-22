"use client"

import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  ControlButton,
  ConnectionMode,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import SectionNode from './SectionNode';
import { Lock, Unlock, Move, Map as MapIcon, UserPlus, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

const nodeTypes = {
  workflowNode: CustomNode,
  sectionNode: SectionNode,
};

interface FlowchartCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Connection) => void;
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  isLocked: boolean;
  isMoveEnabled: boolean;
  showMiniMap: boolean;
  onToggleLock: () => void;
  onToggleMove: () => void;
  onToggleMiniMap: () => void;
  onAddSection: () => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
}

const FlowchartCanvas: React.FC<FlowchartCanvasProps> = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onNodeContextMenu,
  onPaneClick,
  isLocked,
  isMoveEnabled,
  showMiniMap,
  onToggleLock,
  onToggleMove,
  onToggleMiniMap,
  onAddSection,
  onNodeDoubleClick,
  onDrop,
  onDragOver
}) => {
  const { fitView } = useReactFlow();

  const defaultEdgeOptions = useMemo(() => ({
    animated: true,
    type: 'smoothstep',
    style: { strokeWidth: 3, stroke: 'hsl(var(--primary))' },
    pathOptions: { borderRadius: 0 },
  }), []);

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 800 });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 100);
    return () => clearTimeout(timer);
  }, [fitView]);

  const canMoveCanvas = !isLocked && isMoveEnabled;

  return (
    <div className="w-full h-full border rounded-2xl overflow-hidden bg-white shadow-inner relative group/canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Strict}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={isLocked ? [] : ['Backspace', 'Delete']}
        minZoom={0.1}
        maxZoom={4}
        selectNodesOnDrag={false}
        nodesDraggable={canMoveCanvas}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        nodesFocusable={!isLocked}
        edgesFocusable={!isLocked}
        panOnDrag={canMoveCanvas}
        selectionOnDrag={!isLocked && !isMoveEnabled}
        panOnScroll={false}
        zoomOnScroll={!isLocked}
        zoomOnPinch={!isLocked}
        zoomOnDoubleClick={!isLocked}
        preventScrolling={true}
      >
        <Background color="#cbd5e1" gap={30} variant="dots" />
        <Controls showInteractive={false} showFitView={false} position="bottom-left">
          <ControlButton 
            onClick={onAddSection} 
            title="Add New User Section"
            className="bg-white hover:bg-slate-50 text-primary border-b-0 rounded-t-md"
            disabled={isLocked}
          >
            <UserPlus className="w-4 h-4" />
          </ControlButton>
          <ControlButton 
            onClick={onToggleLock} 
            title={isLocked ? 'Unlock Workflow' : 'Lock Workflow'}
            className={cn("transition-colors", isLocked ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white')}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </ControlButton>
          <ControlButton 
            onClick={onToggleMove} 
            title={isMoveEnabled ? 'Disable Moving' : 'Enable Moving'}
            className={cn(
              "transition-colors", 
              !isLocked && isMoveEnabled ? 'bg-accent text-white hover:bg-accent/90' : 'bg-white',
              isLocked && 'opacity-50 cursor-not-allowed'
            )}
            disabled={isLocked}
          >
            <Move className="w-4 h-4" />
          </ControlButton>
          <ControlButton 
            onClick={onToggleMiniMap} 
            title={showMiniMap ? 'Hide MiniMap' : 'Show MiniMap'}
            className={cn("transition-colors", showMiniMap ? 'bg-slate-200' : 'bg-white')}
          >
            <MapIcon className="w-4 h-4" />
          </ControlButton>
          <ControlButton 
            onClick={handleFitView} 
            title="Fit View"
            className="bg-white hover:bg-slate-50 text-primary rounded-b-md"
          >
            <Maximize className="w-4 h-4" />
          </ControlButton>
        </Controls>
        {showMiniMap && (
          <MiniMap 
            nodeStrokeWidth={3} 
            zoomable 
            pannable 
            maskColor="rgba(241, 245, 249, 0.7)"
            nodeColor={(n) => {
              if (n.type === 'sectionNode') return '#f1f5f9';
              if (n.data?.type === 'start') return '#10b981';
              if (n.data?.type === 'end') return '#f43f5e';
              return '#3b82f6';
            }}
          />
        )}
      </ReactFlow>
    </div>
  );
};

export default FlowchartCanvas;
