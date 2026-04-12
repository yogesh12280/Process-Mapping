"use client"

import React, { useCallback, useState, useEffect, useMemo } from 'react';
import FlowchartCanvas from './FlowchartCanvas';
import { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection 
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
import { ArrowLeftToLine, ArrowUpToLine, ArrowRightToLine, ArrowDownToLine, Eye, EyeOff, Square, Circle, Diamond, RectangleHorizontal } from 'lucide-react';
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

const FlowchartEditor = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [isMoveEnabled, setIsMoveEnabled] = useState(false); 
  const [showMiniMap, setShowMiniMap] = useState(false); 
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isShapeSelectionOpen, setIsShapeSelectionOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const addNewNode = useCallback((parentId: string, shape: NodeShape = 'rectangle') => {
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'workflowNode',
      data: { 
        label: 'New Step', 
        type: 'step', 
        shape,
        isLocked: false, 
        targetPos: 'left', 
        sourcePos: 'right',
        showTarget: true,
        showSource: true
      },
      position: { x: 45, y: 105 }, 
      width: shape === 'rectangle' ? NODE_WIDTH : 100,
      height: shape === 'rectangle' ? NODE_HEIGHT : 100,
      parentId: parentId,
      extent: 'parent',
      draggable: !isLocked && isMoveEnabled,
    };
    setNodes((nds) => [...nds, newNode]);
    setIsShapeSelectionOpen(false);
    setActiveParentId(null);
  }, [isLocked, isMoveEnabled]);

  const openShapeSelection = useCallback((parentId: string) => {
    setActiveParentId(parentId);
    setIsShapeSelectionOpen(true);
  }, []);

  const INITIAL_NODES: Node[] = [
    {
      id: 'section-start',
      type: 'sectionNode',
      data: { label: 'Start' },
      position: { x: 0, y: 0 },
      style: { width: SECTION_WIDTH, height: SECTION_HEIGHT },
      selectable: true,
      draggable: false,
    },
    {
      id: 'section-user1',
      type: 'sectionNode',
      data: { label: 'User 1' },
      position: { x: SECTION_WIDTH + SECTION_GAP, y: 0 },
      style: { width: SECTION_WIDTH + 40, height: SECTION_HEIGHT },
      selectable: true,
      draggable: false,
    },
    {
      id: 'section-user2',
      type: 'sectionNode',
      data: { label: 'User 2' },
      position: { x: (SECTION_WIDTH + SECTION_GAP) * 2 + 40, y: 0 },
      style: { width: SECTION_WIDTH + 40, height: SECTION_HEIGHT },
      selectable: true,
      draggable: false,
    },
    {
      id: 'section-end',
      type: 'sectionNode',
      data: { label: 'End' },
      position: { x: (SECTION_WIDTH + SECTION_GAP) * 3 + 80, y: 0 },
      style: { width: SECTION_WIDTH, height: SECTION_HEIGHT },
      selectable: true,
      draggable: false,
    },
    {
      id: 'node-start',
      type: 'workflowNode',
      data: { label: 'Initialize Request', type: 'start', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
      position: { x: 45, y: 75 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      parentId: 'section-start',
      extent: 'parent',
      draggable: false,
    },
    {
      id: 'node-u1-1',
      type: 'workflowNode',
      data: { label: 'Verify Details', type: 'user', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
      position: { x: 45, y: 75 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      parentId: 'section-user1',
      extent: 'parent',
      draggable: false,
    },
    {
      id: 'node-u1-2',
      type: 'workflowNode',
      data: { label: 'Submit Proof', type: 'user', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
      position: { x: 45, y: 195 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      parentId: 'section-user1',
      extent: 'parent',
      draggable: false,
    },
    {
      id: 'node-u2-1',
      type: 'workflowNode',
      data: { label: 'Is Valid?', type: 'user', shape: 'diamond', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
      position: { x: 70, y: 60 },
      width: 100,
      height: 100,
      parentId: 'section-user2',
      extent: 'parent',
      draggable: false,
    },
    {
      id: 'node-u2-2',
      type: 'workflowNode',
      data: { label: 'Approve Request', type: 'user', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
      position: { x: 45, y: 195 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      parentId: 'section-user2',
      extent: 'parent',
      draggable: false,
    },
    {
      id: 'node-end',
      type: 'workflowNode',
      data: { label: 'Archive Record', type: 'end', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
      position: { x: 45, y: 75 },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      parentId: 'section-end',
      extent: 'parent',
      draggable: false,
    },
  ];

  const INITIAL_EDGES: Edge[] = [
    { id: 'e-start-u1', source: 'node-start', sourceHandle: 'source', target: 'node-u1-1', targetHandle: 'target', animated: true },
    { id: 'e-u1-1-u1-2', source: 'node-u1-1', sourceHandle: 'source', target: 'node-u1-2', targetHandle: 'target' },
    { id: 'e-u1-2-u2-1', source: 'node-u1-2', sourceHandle: 'source', target: 'node-u2-1', targetHandle: 'top', animated: true },
    { id: 'e-u2-1-u2-2', source: 'node-u2-1', sourceHandle: 'right', target: 'node-u2-2', targetHandle: 'target' },
    { id: 'e-u2-2-end', source: 'node-u2-2', sourceHandle: 'source', target: 'node-end', targetHandle: 'target', animated: true },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

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

  const toggleLock = useCallback(() => setIsLocked((prev) => !prev), []);
  const toggleMove = useCallback(() => setIsMoveEnabled((prev) => !prev), []);
  const toggleMiniMap = useCallback(() => setShowMiniMap((prev) => !prev), []);

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;

    setNodes((nds) => {
      const endSection = nds.find((n) => n.id === 'section-end');
      if (!endSection) return nds;

      const currentEndX = endSection.position.x;
      const newUserSectionWidth = SECTION_WIDTH + 40;
      const shiftAmount = newUserSectionWidth + SECTION_GAP;

      const newUserSection: Node = {
        id: `section-user-${Date.now()}`,
        type: 'sectionNode',
        data: { label: newSectionName, isLocked, onAddChild: addNewNode },
        position: { x: currentEndX, y: 0 },
        style: { width: newUserSectionWidth, height: SECTION_HEIGHT },
        selectable: !isLocked,
        draggable: false,
      };

      return nds.map((node) => {
        if (node.id === 'section-end') {
          return { ...node, position: { x: node.position.x + shiftAmount, y: node.position.y } };
        }
        return node;
      }).concat(newUserSection);
    });

    setNewSectionName('');
    setIsAddSectionOpen(false);
  };

  const menuNode = useMemo(() => {
    if (!menu) return null;
    return nodes.find((n) => n.id === menu.id);
  }, [menu, nodes]);

  return (
    <div className="w-full h-[calc(100vh-140px)] flex flex-col relative" onClick={closeMenu}>
      <div className="flex-1 bg-slate-50 rounded-3xl shadow-xl overflow-hidden border border-slate-200 relative">
        <FlowchartCanvas 
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={closeMenu}
          isLocked={isLocked}
          isMoveEnabled={isMoveEnabled}
          showMiniMap={showMiniMap}
          onToggleLock={toggleLock}
          onToggleMove={toggleMove}
          onToggleMiniMap={toggleMiniMap}
          onAddSection={() => setIsAddSectionOpen(true)}
        />
      </div>

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
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => activeParentId && addNewNode(activeParentId, 'rectangle')}
            >
              <RectangleHorizontal className="h-8 w-8 text-primary" />
              <span className="font-bold uppercase tracking-tight text-[10px]">Rectangle</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => activeParentId && addNewNode(activeParentId, 'square')}
            >
              <Square className="h-8 w-8 text-primary" />
              <span className="font-bold uppercase tracking-tight text-[10px]">Square</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => activeParentId && addNewNode(activeParentId, 'circle')}
            >
              <Circle className="h-8 w-8 text-primary" />
              <span className="font-bold uppercase tracking-tight text-[10px]">Circle</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => activeParentId && addNewNode(activeParentId, 'diamond')}
            >
              <Diamond className="h-8 w-8 text-primary" />
              <span className="font-bold uppercase tracking-tight text-[10px]">Diamond</span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsShapeSelectionOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {menu && menuNode && (
        <Card 
          className="fixed z-[100] w-64 shadow-2xl p-2 border-primary/20 bg-white/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100"
          style={{ top: menu.top, left: menu.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Handle Configuration</h3>
            
            <div className="space-y-4">
              {menuNode.data.shape === 'diamond' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Top</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleHandleVisibility(menu.id, 'top')}
                    >
                      {menuNode.data.showTop === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Bottom</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleHandleVisibility(menu.id, 'bottom')}
                    >
                      {menuNode.data.showBottom === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Left</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleHandleVisibility(menu.id, 'left')}
                    >
                      {menuNode.data.showLeft === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Right</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleHandleVisibility(menu.id, 'right')}
                    >
                      {menuNode.data.showRight === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
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

export default FlowchartEditor;
