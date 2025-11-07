import { create } from 'zustand';

export const useFlowStore = create((set, get) => ({
  // Nodes and edges
  nodes: [],
  edges: [],
  
  // Selected node for properties panel
  selectedNode: null,
  
  // Flow metadata
  flowName: 'Untitled Flow',
  flowId: null,
  
  // Actions
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setFlowName: (name) => set({ flowName: name }),
  setFlowId: (id) => set({ flowId: id }),
  
  // Update node data
  updateNodeData: (nodeId, newData) => set((state) => ({
    nodes: state.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    ),
  })),
  
  // Add node
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),
  
  // Remove node
  removeNode: (nodeId) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== nodeId),
    edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
  })),
  
  // Clear flow
  clearFlow: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    flowName: 'Untitled Flow',
    flowId: null,
  }),
  
  // Load flow
  loadFlow: (flow) => set({
    nodes: flow.nodes || [],
    edges: flow.edges || [],
    flowName: flow.name || 'Untitled Flow',
    flowId: flow.id || null,
  }),
  
  // Get flow JSON
  getFlowJSON: () => {
    const state = get();
    return {
      id: state.flowId,
      name: state.flowName,
      nodes: state.nodes,
      edges: state.edges,
      createdAt: new Date().toISOString(),
    };
  },
}));
