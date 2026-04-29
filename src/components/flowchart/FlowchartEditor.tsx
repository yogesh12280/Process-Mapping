"use client"

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import FlowchartCanvas from './FlowchartCanvas';
import { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection,
  ReactFlowProvider,
  useReactFlow,
  NodeChange,
  applyNodeChanges
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { ArrowLeftToLine, ArrowUpToLine, ArrowRightToLine, ArrowDownToLine, Eye, EyeOff, Diamond, RectangleHorizontal, Hexagon, Box, Edit3, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { NodeShape } from './CustomNode';

const SECTION_WIDTH = 240;
const SECTION_HEIGHT = 450;
const SECTION_GAP = 20;
const NODE_WIDTH = 150;
const NODE_HEIGHT = 60;

interface MenuState {
  id: string;
  top: number;
  left: number;
}

const recalculateSectionPositions = (nds: Node[]) => {
  const sections = nds.filter((n) => n.type === 'sectionNode');
  const otherNodes = nds.filter((n) => n.type !== 'sectionNode');

  // Stable sort: Start -> Users (by current X) -> End
  const startSection = sections.find((s) => s.data.sectionRole === 'start');
  const endSection = sections.find((s) => s.data.sectionRole === 'end');
  const userSections = sections
    .filter((s) => s.data.sectionRole !== 'start' && s.data.sectionRole !== 'end')
    .sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));

  const sortedSections = [
    ...(startSection ? [startSection] : []),
    ...userSections,
    ...(endSection ? [endSection] : []),
  ];

  let currentX = 0;
  const updatedSections = sortedSections.map((s) => {
    const width = (s.measured?.width ?? s.style?.width ?? SECTION_WIDTH) as number;
    const updated = {
      ...s,
      position: { x: currentX, y: 0 },
    };
    currentX += width + SECTION_GAP;
    return updated;
  });

  return [...updatedSections, ...otherNodes];
};

const FlowchartEditorContent = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [isMoveEnabled, setIsMoveEnabled] = useState(false); 
  const [showMiniMap, setShowMiniMap] = useState(false); 
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isEditNodeOpen, setIsEditNodeOpen] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<Node | null>(null);
  const [editedLabel, setEditedLabel] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [isShapeSelectionOpen, setIsShapeSelectionOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { screenToFlowPosition, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChangeState] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const fetchWorkflow = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/workflow');
      if (!response.ok) throw new Error('Failed to fetch workflow');
      const data = await response.json();
      setNodes(data.nodes);
      setEdges(data.edges);
      
      // Short delay to ensure nodes are rendered before fitting view
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setNodes, setEdges, fitView]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const addNewNode = useCallback((parentId: string, shape: NodeShape = 'rectangle', position: { x: number, y: number } = { x: 45, y: 105 }) => {
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'workflowNode',
      data: { 
        label: 'New Step', 
        description: 'This is a core process step in the workflow.',
        type: 'step', 
        shape,
        isLocked: false, 
        targetPos: 'left', 
        sourcePos: 'right',
        showTarget: true,
        showSource: true
      },
      position, 
    width: ['rectangle', 'rectangleTan', 'rectangleRed', 'rectangleGrey', 'hexagon', 'hexagonLime'].includes(shape) ? NODE_WIDTH : (shape === 'preparation' ? 115 : 100),
    height: ['rectangle', 'rectangleTan', 'rectangleRed', 'rectangleGrey', 'hexagon', 'hexagonLime'].includes(shape) ? NODE_HEIGHT : (shape === 'preparation' ? 80 : 100),
      parentId: parentId,
      extent: 'parent',
      draggable: !isLocked && isMoveEnabled,
    };
    setNodes((nds) => [...nds, newNode]);
    setIsShapeSelectionOpen(false);
    setActiveParentId(null);
  }, [isLocked, isMoveEnabled, setNodes]);

  const openShapeSelection = useCallback((parentId: string) => {
    setActiveParentId(parentId);
    setIsShapeSelectionOpen(true);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        
        // Check if any sectionNode changed dimensions or was added/removed
        const hasSectionChange = changes.some(c => {
          const changeType = c.type as string;
          if (changeType === 'dimensions' || changeType === 'remove') {
            const nodeId = (c as any).id;
            const changedNode = nds.find(n => n.id === nodeId);
            return changedNode?.type === 'sectionNode';
          }
          return false;
        });

        if (hasSectionChange) {
          return recalculateSectionPositions(nextNodes);
        }
        return nextNodes;
      });
    },
    [setNodes]
  );

  useEffect(() => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.type === 'sectionNode') {
          return {
            ...node,
            selectable: !isLocked, 
            draggable: false, 
            data: { 
              ...node.data, 
              isLocked, 
              onAddChild: openShapeSelection 
            }
          };
        }
        if (node.type === 'workflowNode') {
          return {
            ...node,
            draggable: !isLocked && isMoveEnabled, 
            data: {
              ...node.data,
              isLocked
            }
          };
        }
        return node;
      })
    );
  }, [isLocked, isMoveEnabled, addNewNode, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (isLocked) return;
      
      const targetNode = nodes.find(n => n.id === params.target);
      const isTargetAtTop = params.targetHandle === 'top' || 
        (params.targetHandle === 'target' && targetNode?.data?.targetPos === 'top');

      // Use 'straight' edge type ONLY for Diamond bottom to another node's top point
      // This fixes the "variation" issue for vertical connections while keeping
      // smoothstep for horizontal ones (like Diamond bottom to a left point)
      const isDiamondVerticalFix = params.sourceHandle === 'bottom' && isTargetAtTop;

      setEdges((eds) => addEdge({ 
        ...params, 
        type: isDiamondVerticalFix ? 'straight' : 'smoothstep',
        animated: true 
      }, eds));
    },
    [setEdges, isLocked, nodes]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (isLocked) return;
      event.preventDefault();
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    [isLocked]
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const handleSave = useCallback(async () => {
    const workflowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
        width: node.width || (node.style?.width as number),
        height: node.height || (node.style?.height as number),
        parentId: node.parentId,
        extent: node.extent,
        draggable: node.draggable,
        style: node.style,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        animated: edge.animated,
        type: edge.type,
      })),
    };

    console.log('Saved Workflow JSON:', JSON.stringify(workflowData, null, 2));

    const promise = fetch('/api/workflow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowData),
    }).then(async (res) => {
      if (!res.ok) throw new Error('Failed to save workflow');
      return res.json();
    });

    toast.promise(promise, {
      loading: 'Saving workflow...',
      success: 'Workflow saved successfully!',
      error: 'Failed to save workflow.',
    });
  }, [nodes, edges]);

  const updateNodeHandle = useCallback((id: string, type: 'target' | 'source', pos: 'left' | 'top' | 'right' | 'bottom') => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const newData = { ...node.data };
          if (type === 'target') {
            newData.targetPos = pos as 'left' | 'top';
          } else {
            newData.sourcePos = pos as 'right' | 'bottom';
          }
          return {
            ...node,
            data: newData,
          };
        }
        return node;
      })
    );
    closeMenu();
  }, [setNodes, closeMenu]);

  const toggleHandleVisibility = useCallback((id: string, type: 'target' | 'source' | 'top' | 'bottom' | 'left' | 'right') => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const newData = { ...node.data };
          if (type === 'target') {
            newData.showTarget = newData.showTarget === false ? true : false;
          } else if (type === 'source') {
            newData.showSource = newData.showSource === false ? true : false;
          } else if (type === 'top') {
            newData.showTop = newData.showTop === false ? true : false;
          } else if (type === 'bottom') {
            newData.showBottom = newData.showBottom === false ? true : false;
          } else if (type === 'left') {
            newData.showLeft = newData.showLeft === false ? true : false;
          } else if (type === 'right') {
            newData.showRight = newData.showRight === false ? true : false;
          }
          return {
            ...node,
            data: newData,
          };
        }
        return node;
      })
    );
    // Don't close menu when toggling visibility for diamond to allow multiple toggles
    const node = nodes.find(n => n.id === id);
    if (node?.data.shape !== 'diamond') {
      closeMenu();
    }
  }, [setNodes, closeMenu, nodes]);

  const updateHandleLabel = useCallback((id: string, type: 'top' | 'bottom' | 'left' | 'right', label: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const newData = { ...node.data };
          if (type === 'top') newData.topLabel = label;
          else if (type === 'bottom') newData.bottomLabel = label;
          else if (type === 'left') newData.leftLabel = label;
          else if (type === 'right') newData.rightLabel = label;
          return { ...node, data: newData };
        }
        return node;
      })
    );
  }, [setNodes]);

  const toggleLock = useCallback(() => setIsLocked((prev) => !prev), []);
  const toggleMove = useCallback(() => setIsMoveEnabled((prev) => !prev), []);
  const toggleMiniMap = useCallback(() => setShowMiniMap((prev) => !prev), []);

  useEffect(() => {
    const handleSaveTrigger = () => {
      handleSave();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('workflow:save', handleSaveTrigger);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('workflow:save', handleSaveTrigger);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;

    setNodes((nds) => {
      const newUserSectionWidth = SECTION_WIDTH + 40;
      // We place it at a high X initially so it sorts correctly at the end but before "End" section
      // The recalculateSectionPositions will fix the exact X
      const maxX = nds
        .filter(n => n.type === 'sectionNode' && n.data.sectionRole !== 'end')
        .reduce((max, n) => Math.max(max, (n.position?.x || 0) + ((n.style?.width as number) || SECTION_WIDTH)), 0);

      const newUserSection: Node = {
        id: `section-user-${Date.now()}`,
        type: 'sectionNode',
        data: { label: newSectionName, isLocked, onAddChild: addNewNode, sectionRole: 'user' },
        position: { x: maxX + SECTION_GAP, y: 0 },
        style: { width: newUserSectionWidth, height: SECTION_HEIGHT },
        selectable: !isLocked,
        draggable: false,
      };

      return recalculateSectionPositions([...nds, newUserSection]);
    });

    setNewSectionName('');
    setIsAddSectionOpen(false);
  };

  const menuNode = useMemo(() => {
    if (!menu) return null;
    return nodes.find((n) => n.id === menu.id);
  }, [menu, nodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Find if we dropped on a section
      const section = nodes.find(n => {
        if (n.type !== 'sectionNode') return false;
        const width = n.style?.width as number || SECTION_WIDTH;
        const height = n.style?.height as number || SECTION_HEIGHT;
        
        return (
          position.x >= n.position.x &&
          position.x <= n.position.x + width &&
          position.y >= n.position.y &&
          position.y <= n.position.y + height
        );
      });

      if (section) {
        // Calculate relative position within the section
        const relativePosition = {
          x: position.x - section.position.x,
          y: position.y - section.position.y,
        };
        
        const isRectangle = ['rectangle', 'rectangleTan', 'rectangleRed', 'rectangleGrey'].includes(type);
        const sectionRole = section.data.sectionRole;

        if (isRectangle && sectionRole !== 'user') {
          return;
        }
        
        if ((type === 'preparation' || type === 'hexagon') && sectionRole !== 'start' && sectionRole !== 'end') {
          return;
        }

        if (type === 'hexagonLime' && sectionRole !== 'end') {
          return;
        }
        
        addNewNode(section.id, type as NodeShape, relativePosition);
      }
    },
    [screenToFlowPosition, nodes, addNewNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Only open edit for workflow nodes, not sections
    if (node.type === 'workflowNode') {
      setNodeToEdit(node);
      setEditedLabel(node.data.label || '');
      setIsEditNodeOpen(true);
    }
  }, []);

  const handleUpdateNodeLabel = () => {
    if (!nodeToEdit || !editedLabel.trim()) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeToEdit.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: editedLabel,
            },
          };
        }
        return node;
      })
    );

    setIsEditNodeOpen(false);
    setNodeToEdit(null);
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const activeParentRole = useMemo(() => {
    if (!activeParentId) return null;
    return nodes.find(n => n.id === activeParentId)?.data?.sectionRole;
  }, [activeParentId, nodes]);

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-row gap-4 relative" onClick={closeMenu}>
      <div className="flex-1 bg-slate-50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-600 animate-pulse uppercase tracking-widest">Loading workflow...</p>
            </div>
          </div>
        )}
        <FlowchartCanvas 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={onNodeContextMenu}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={closeMenu}
          isLocked={isLocked}
          isMoveEnabled={isMoveEnabled}
          showMiniMap={showMiniMap}
          onToggleLock={toggleLock}
          onToggleMove={toggleMove}
          onToggleMiniMap={toggleMiniMap}
          onAddSection={() => setIsAddSectionOpen(true)}
          onDrop={onDrop}
          onDragOver={onDragOver}
        />
      </div>

      {/* Edit Node Dialog */}
      <Dialog open={isEditNodeOpen} onOpenChange={setIsEditNodeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Edit Workflow Step
            </DialogTitle>
            <DialogDescription>
              Update the title of this step or view its details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Step Title
              </Label>
              <Input
                id="title"
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                className="border-slate-200 focus-visible:ring-primary"
                placeholder="Enter step title..."
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Description
              </Label>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 leading-relaxed">
                {nodeToEdit?.data.description || 'No description available for this step.'}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNodeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateNodeLabel}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar with shapes moved to the right */}
      <Card className="w-20 flex flex-col items-center py-1.5 shadow-lg border-slate-200 h-full max-h-screen overflow-hidden">
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <Box className="h-4 w-4 text-primary" />
          <h3 className="text-[8px] font-black uppercase tracking-widest text-primary vertical-rl">SHAPES</h3>
        </div>
        
        {/* Responsive Shapes Container - tighter spacing to prevent overflow */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 w-full min-h-0 px-2 py-1 overflow-hidden mt-2">
          <div 
            className="w-10 h-10 mx-auto flex-shrink flex items-center justify-center rounded-lg bg-[#CEE6FF] border-2 border-[#c9d9df] shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-500 hover:text-blue-500 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, 'rectangle')}
            title="Drag Rectangle Step"
          >
            <RectangleHorizontal className="h-5 w-5 text-black" />
          </div>
          <div 
            className="w-10 h-10 mx-auto flex-shrink flex items-center justify-center rounded-lg bg-[#CEC4DA] border-2 border-[#b8a176] shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-500 hover:text-blue-500 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, 'rectangleTan')}
            title="Drag Tan Rectangle Step"
          >
            <RectangleHorizontal className="h-5 w-5 text-black" />
          </div>
          <div 
            className="w-10 h-10 mx-auto flex-shrink flex items-center justify-center rounded-lg bg-[#EBC8C7] border-2 border-[#b8a176] shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-500 hover:text-blue-500 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, 'rectangleRed')}
            title="Drag Red Rectangle Step"
          >
            <RectangleHorizontal className="h-5 w-5 text-black" />
          </div>
          <div 
            className="w-10 h-10 mx-auto flex-shrink flex items-center justify-center rounded-lg bg-[#DCDCDC] border-2 border-[#b8a176] shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-500 hover:text-blue-500 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, 'rectangleGrey')}
            title="Drag Grey Rectangle Step"
          >
            <RectangleHorizontal className="h-5 w-5 text-black" />
          </div>
          <div 
            className="w-10 h-10 mx-auto flex-shrink flex items-center justify-center rounded-lg bg-[#FFFFCC] border-2 border-slate-100 shadow-sm cursor-grab active:cursor-grabbing hover:border-black hover:bg-[#FFFFCC]/80 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, 'diamond')}
            title="Drag Diamond Step"
          >
            <Diamond className="h-5 w-5 text-black" />
          </div>
          <div 
            className="w-10 h-10 mx-auto flex-shrink flex items-center justify-center rounded-lg bg-[#FCB3FC] border-2 border-pink-100 shadow-sm cursor-grab active:cursor-grabbing hover:border-pink-500 hover:text-pink-500 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, 'hexagon')}
            title="Drag Start/End Hexagon (Start & End Sections)"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-black fill-[#FCB3FC] transition-colors" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8 L20 8 L23 12 L20 16 L4 16 L1 12 Z" strokeWidth="2" />
            </svg>
          </div>
          <div 
            className="w-10 h-10 mx-auto flex-shrink flex items-center justify-center rounded-lg bg-[#CCFFCC] border-2 border-lime-100 shadow-sm cursor-grab active:cursor-grabbing hover:border-lime-500 hover:text-lime-500 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, 'preparation')}
            title="Drag Preparation Step (Start & End Sections)"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-black fill-[#CCFFCC] transition-colors" xmlns="http://www.w3.org/2000/svg">
              {/* Back Layer - Hexagon */}
              <path d="M5 6 L19 6 L22 10 L19 14 L5 14 L2 10 Z" strokeWidth="2" fill="none" transform="translate(1, 2)" />
              {/* Front Layer - Rectangle */}
              <rect x="2" y="2" width="18" height="12" strokeWidth="2" />
            </svg>
          </div>
          <div 
            className="w-10 h-10 mx-auto flex-shrink flex items-center justify-center rounded-lg bg-[#CCFFCC] border-2 border-lime-100 shadow-sm cursor-grab active:cursor-grabbing hover:border-lime-500 hover:text-lime-500 transition-all group"
            draggable
            onDragStart={(e) => onDragStart(e, 'hexagonLime')}
            title="Drag End Hexagon (End Section Only)"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-black fill-[#CCFFCC] transition-colors" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8 L20 8 L22 12 L20 16 L4 16 L2 12 Z" strokeWidth="2" />
            </svg>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-1.5 pb-2 flex-shrink-0 pt-2 border-t border-slate-50 w-full">
          <div className="flex flex-row gap-1 items-center justify-center w-full px-1">
            <Button
              variant="default"
              size="icon"
              className="w-8 h-8 rounded-lg shadow-md bg-primary hover:bg-primary/90 transition-all flex flex-col gap-0 h-auto py-1 flex-1"
              onClick={handleSave}
              title="Save Workflow"
            >
              <Save className="h-3 w-3 text-white" />
              <span className="text-[6px] font-bold uppercase tracking-tighter">Save</span>
            </Button>
            <Button
              variant="default"
              size="icon"
              className="w-8 h-8 rounded-lg shadow-md bg-emerald-600 hover:bg-emerald-700 transition-all flex flex-col gap-0 h-auto py-1 flex-1"
              onClick={handleSave}
              title="Submit Workflow"
            >
              <Check className="h-3 w-3 text-white" />
              <span className="text-[6px] font-bold uppercase tracking-tighter">Submit</span>
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add User Workspace</DialogTitle>
            <DialogDescription>
              Enter the name of the user for whom you want to create a new dedicated process workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-bold">
                User Name
              </Label>
              <Input
                id="name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Sales Manager"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSectionOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSection} disabled={!newSectionName.trim()}>Create Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShapeSelectionOpen} onOpenChange={setIsShapeSelectionOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Node Shape</DialogTitle>
            <DialogDescription>
              Choose a shape for the new step in this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            {activeParentRole === 'user' && (
              <>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 border-2 border-[#c9d9df] bg-[#CEE6FF] hover:border-blue-500 hover:bg-[#CEE6FF]/80 transition-all group"
                  onClick={() => activeParentId && addNewNode(activeParentId, 'rectangle')}
                >
                  <RectangleHorizontal className="h-8 w-8 text-black group-hover:scale-110 transition-transform" />
                  <span className="font-bold uppercase tracking-tight text-[10px] text-black">Process Step</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 border-2 border-[#b8a176] bg-[#CEC4DA] hover:border-blue-500 hover:bg-[#CEC4DA]/80 transition-all group"
                  onClick={() => activeParentId && addNewNode(activeParentId, 'rectangleTan')}
                >
                  <RectangleHorizontal className="h-8 w-8 text-black group-hover:scale-110 transition-transform" />
                  <span className="font-bold uppercase tracking-tight text-[10px] text-black">Detail Step</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 border-2 border-[#b8a176] bg-[#EBC8C7] hover:border-blue-500 hover:bg-[#EBC8C7]/80 transition-all group"
                  onClick={() => activeParentId && addNewNode(activeParentId, 'rectangleRed')}
                >
                  <RectangleHorizontal className="h-8 w-8 text-black group-hover:scale-110 transition-transform" />
                  <span className="font-bold uppercase tracking-tight text-[10px] text-black">Red Step</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 border-2 border-[#b8a176] bg-[#DCDCDC] hover:border-blue-500 hover:bg-[#DCDCDC]/80 transition-all group"
                  onClick={() => activeParentId && addNewNode(activeParentId, 'rectangleGrey')}
                >
                  <RectangleHorizontal className="h-8 w-8 text-black group-hover:scale-110 transition-transform" />
                  <span className="font-bold uppercase tracking-tight text-[10px] text-black">Grey Step</span>
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-2 border-slate-200 bg-[#FFFFCC] hover:border-black hover:bg-[#FFFFCC]/80 transition-all group"
              onClick={() => activeParentId && addNewNode(activeParentId, 'diamond')}
            >
              <Diamond className="h-8 w-8 text-black group-hover:scale-110 transition-transform" />
              <span className="font-bold uppercase tracking-tight text-[10px] text-black">Decision</span>
            </Button>
            
            {(activeParentRole === 'start' || activeParentRole === 'end') && (
              <>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 border-2 border-pink-100 bg-[#FCB3FC] hover:border-pink-500 hover:bg-[#FCB3FC]/80 transition-all group"
                  onClick={() => activeParentId && addNewNode(activeParentId, 'hexagon')}
                >
                  <svg viewBox="0 0 24 24" className="h-8 w-8 stroke-black fill-[#FCB3FC] transition-colors" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.2 8 L22.8 8 L24 12 L22.8 16 L1.2 16 L0 12 Z" strokeWidth="2" />
                  </svg>
                  <span className="font-bold uppercase tracking-tight text-[10px] text-black">Hexagon</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 border-2 border-lime-100 bg-[#CCFFCC] hover:border-lime-500 hover:bg-[#CCFFCC]/80 transition-all group"
                  onClick={() => activeParentId && addNewNode(activeParentId, 'preparation')}
                >
                  <svg viewBox="0 0 24 24" className="h-8 w-8 stroke-black fill-[#CCFFCC] transition-colors" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 6 L19 6 L22 10 L19 14 L5 14 L2 10 Z" strokeWidth="2" fill="none" transform="translate(1, 2)" />
                    <rect x="2" y="2" width="18" height="12" strokeWidth="2" />
                  </svg>
                  <span className="font-bold uppercase tracking-tight text-[10px] text-black">Preparation</span>
                </Button>
              </>
            )}

            {activeParentId === 'section-end' && (
              <Button 
                variant="outline" 
                className="h-24 flex flex-col gap-2 border-2 border-lime-100 bg-[#CCFFCC] hover:border-lime-500 hover:bg-[#CCFFCC]/80 transition-all group"
                onClick={() => activeParentId && addNewNode(activeParentId, 'hexagonLime')}
              >
                <svg viewBox="0 0 24 24" className="h-8 w-8 stroke-black fill-[#CCFFCC] transition-colors" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 8 L20 8 L22 12 L20 16 L4 16 L2 12 Z" strokeWidth="2" />
                </svg>
                <span className="font-bold uppercase tracking-tight text-[10px] text-black">End Hexagon</span>
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsShapeSelectionOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {menu && menuNode && (
        <Card 
          className="fixed z-[100] w-64 shadow-2xl p-2 border-black/20 bg-white/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100"
          style={{ top: menu.top, left: menu.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 mb-3">Handle Configuration</h3>
            
            <div className="space-y-4">
              {menuNode.data.shape === 'diamond' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {/* Top Handle */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-black uppercase opacity-60">Top Point</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-black/5"
                          onClick={() => toggleHandleVisibility(menu.id, 'top')}
                        >
                          {menuNode.data.showTop === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <Input 
                        placeholder="Label (e.g. YES)" 
                        className="h-7 text-[10px] uppercase font-bold border-black/20 focus-visible:ring-black/20"
                        value={menuNode.data.topLabel || ''}
                        onChange={(e) => updateHandleLabel(menu.id, 'top', e.target.value)}
                      />
                    </div>

                    {/* Bottom Handle */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Bottom Point</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleHandleVisibility(menu.id, 'bottom')}
                        >
                          {menuNode.data.showBottom === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <Input 
                        placeholder="Label (e.g. NO)" 
                        className="h-7 text-[10px] uppercase font-bold"
                        value={menuNode.data.bottomLabel || ''}
                        onChange={(e) => updateHandleLabel(menu.id, 'bottom', e.target.value)}
                      />
                    </div>

                    {/* Left Handle */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Left Point</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleHandleVisibility(menu.id, 'left')}
                        >
                          {menuNode.data.showLeft === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <Input 
                        placeholder="Label" 
                        className="h-7 text-[10px] uppercase font-bold"
                        value={menuNode.data.leftLabel || ''}
                        onChange={(e) => updateHandleLabel(menu.id, 'left', e.target.value)}
                      />
                    </div>

                    {/* Right Handle */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Right Point</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleHandleVisibility(menu.id, 'right')}
                        >
                          {menuNode.data.showRight === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                      <Input 
                        placeholder="Label" 
                        className="h-7 text-[10px] uppercase font-bold"
                        value={menuNode.data.rightLabel || ''}
                        onChange={(e) => updateHandleLabel(menu.id, 'right', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Input Point Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Input Point (Start)</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleHandleVisibility(menu.id, 'target')}
                        title={menuNode.data.showTarget === false ? "Show Input Point" : "Hide Input Point"}
                      >
                        {menuNode.data.showTarget === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    {menuNode.data.showTarget !== false && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => updateNodeHandle(menu.id, 'target', menuNode.data.targetPos === 'left' ? 'top' : 'left')}
                      >
                        {menuNode.data.targetPos === 'left' ? <ArrowUpToLine className="mr-2 h-4 w-4" /> : <ArrowLeftToLine className="mr-2 h-4 w-4" />}
                        Move to {menuNode.data.targetPos === 'left' ? 'Top' : 'Left'}
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Output Point Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Output Point (End)</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleHandleVisibility(menu.id, 'source')}
                        title={menuNode.data.showSource === false ? "Show Output Point" : "Hide Output Point"}
                      >
                        {menuNode.data.showSource === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                    {menuNode.data.showSource !== false && (
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => updateNodeHandle(menu.id, 'source', menuNode.data.sourcePos === 'right' ? 'bottom' : 'right')}
                      >
                        {menuNode.data.sourcePos === 'right' ? <ArrowDownToLine className="mr-2 h-4 w-4" /> : <ArrowRightToLine className="mr-2 h-4 w-4" />}
                        Move to {menuNode.data.sourcePos === 'right' ? 'Bottom' : 'Right'}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <Separator className="my-1" />
          <div className="px-3 py-1">
            <p className="text-[10px] text-muted-foreground text-center italic">Handles can be hidden or repositioned</p>
          </div>
        </Card>
      )}
    </div>
  );
};

const FlowchartEditor = () => {
  return (
    <ReactFlowProvider>
      <FlowchartEditorContent />
    </ReactFlowProvider>
  );
};

export default FlowchartEditor;
