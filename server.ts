import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Constants consistent with client
  const SECTION_WIDTH = 240;
  const SECTION_HEIGHT = 450;
  const SECTION_GAP = 20;
  const NODE_WIDTH = 150;
  const NODE_HEIGHT = 60;

  // In-memory storage for workflow
  let currentWorkflow: any = null;

  // API Route for initial workflow data
  app.get("/api/workflow", (req, res) => {
    if (currentWorkflow) {
      return res.json(currentWorkflow);
    }
    
    const timestamp = Date.now();
    const startId = `section-start-${timestamp}`;
    const user1Id = `section-user1-${timestamp}`;
    const user2Id = `section-user2-${timestamp}`;
    const endSectionId = `section-end-${timestamp}`;

    const nodes = [
      {
        id: startId,
        type: 'sectionNode',
        data: { label: 'Start', sectionRole: 'start' },
         position: { x: 0, y: 0 },
        style: { width: SECTION_WIDTH, height: SECTION_HEIGHT },
        selectable: true,
        draggable: false,
      },
      {
        id: user1Id,
        type: 'sectionNode',
        data: { label: 'User 1', sectionRole: 'user' },
        position: { x: 0, y: 0 },
        style: { width: SECTION_WIDTH + 40, height: SECTION_HEIGHT },
        selectable: true,
        draggable: false,
      },
      {
        id: user2Id,
        type: 'sectionNode',
        data: { label: 'User 2', sectionRole: 'user' },
        position: { x: 0, y: 0 },
        style: { width: SECTION_WIDTH + 40, height: SECTION_HEIGHT },
        selectable: true,
        draggable: false,
      },
      {
        id: endSectionId,
        type: 'sectionNode',
        data: { label: 'End', sectionRole: 'end' },
        position: { x: 0, y: 0 },
        style: { width: SECTION_WIDTH, height: SECTION_HEIGHT },
        selectable: true,
        draggable: false,
      },
      {
        id: 'node-start',
        type: 'workflowNode',
        data: { label: 'Start Process', description: 'Initiation point for the complete business workflow.', type: 'start', shape: 'hexagon', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
        position: { x: 45, y: 75 },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        parentId: startId,
        extent: 'parent',
        draggable: false,
      },
      {
        id: 'node-review',
        type: 'workflowNode',
        data: { label: 'Initial Review', description: 'Reviewing the submitted documentation for completeness.', type: 'user', shape: 'rectangle', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
        position: { x: 45, y: 75 },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        parentId: user1Id,
        extent: 'parent',
        draggable: false,
      },
      {
        id: 'node-detail-check',
        type: 'workflowNode',
        data: { label: 'Detail Verification', description: 'Cross-referencing details with the central registry.', type: 'user', shape: 'rectangleTan', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
        position: { x: 45, y: 195 },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        parentId: user1Id,
        extent: 'parent',
        draggable: false,
      },
      {
        id: 'node-decision',
        type: 'workflowNode',
        data: { label: 'Approval Required?', description: 'Outcome determination based on standard criteria.', type: 'user', shape: 'diamond', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true, showTop: true, showBottom: true, showLeft: true, showRight: true },
        position: { x: 45, y: 75 },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        parentId: user2Id,
        extent: 'parent',
        draggable: false,
      },
      {
        id: 'node-end',
        type: 'workflowNode',
        data: { label: 'Process Complete', description: 'The finalization state where all outputs are archived.', type: 'end', shape: 'hexagonLime', targetPos: 'left', sourcePos: 'right', showTarget: true, showSource: true },
        position: { x: 45, y: 75 },
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        parentId: endSectionId,
        extent: 'parent',
        draggable: false,
      },
    ];

    const edges = [
      { id: 'e-start-review', source: 'node-start', sourceHandle: 'source', target: 'node-review', targetHandle: 'target', animated: true },
      { id: 'e-review-detail', source: 'node-review', sourceHandle: 'source', target: 'node-detail-check', targetHandle: 'target' },
      { id: 'e-detail-decision', source: 'node-detail-check', sourceHandle: 'source', target: 'node-decision', targetHandle: 'top', animated: true },
      { id: 'e-decision-end', source: 'node-decision', sourceHandle: 'right', target: 'node-end', targetHandle: 'target', animated: true },
    ];

    res.json({ nodes, edges });
  });

  app.post("/api/workflow", (req, res) => {
    currentWorkflow = req.body;
    console.log("Workflow saved successfully");
    res.json({ status: "success", message: "Workflow saved" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
