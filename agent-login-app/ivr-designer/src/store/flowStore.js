import { create } from 'zustand';

export const useFlowStore = create((set, get) => ({
  // Nodes and edges
  nodes: [],
  edges: [],
  
  // Selected node for properties panel
  selectedNode: null,
  
  // COPY-BASED EDITING: Node copy for isolated editing
  nodeBeingEdited: null,
  isEditingMode: false,
  
  // AGGRESSIVE CANVAS BLOCKING during editing
  blockCanvasInteractions: false,
  
  // Flow metadata
  flowName: 'Untitled Flow',
  flowId: null,
  
  // Debug logging
  debugMode: true,
  
  // Actions
  setNodes: (nodes) => {
    const state = get();
    if (state.debugMode) {
      console.log('🔄 [FlowStore] setNodes called with:', nodes?.length || 0, 'nodes');
      if (nodes && nodes.length > 0) {
        console.log('🔄 [FlowStore] Node IDs:', nodes.map(n => `${n.id}(${n.type})`).join(', '));
      }
    }
    set({ nodes });
  },
  
  setEdges: (edges) => {
    const state = get();
    if (state.debugMode) {
      console.log('🔄 [FlowStore] Setting edges:', edges?.length || 0, 'edges');
    }
    set({ edges });
  },
  
  setSelectedNode: (node) => {
    const state = get();
    if (state.debugMode) {
      console.log('🎯 [FlowStore] Selecting node:', node?.id || 'null');
    }
    set({ selectedNode: node });
  },
  
  setFlowName: (name) => {
    const state = get();
    if (state.debugMode) {
      console.log('📝 [FlowStore] Setting flow name:', name);
    }
    set({ flowName: name });
  },
  
  setFlowId: (id) => {
    const state = get();
    if (state.debugMode) {
      console.log('🆔 [FlowStore] Setting flow ID:', id);
    }
    set({ flowId: id });
  },
  
  // COPY-BASED EDITING SYSTEM
  startEditingNode: (node) => {
    const state = get();
    if (state.debugMode) {
      console.log('🔧 [FlowStore] Starting edit mode for node:', node.id, JSON.stringify(node.data, null, 2));
      console.log('🚫 [FlowStore] BLOCKING all canvas interactions during editing');
    }
    // Create a deep copy of the node for isolated editing
    const nodeCopy = JSON.parse(JSON.stringify(node));
    set({ 
      nodeBeingEdited: nodeCopy,
      isEditingMode: true,
      blockCanvasInteractions: true,  // BLOCK ALL CANVAS UPDATES
      selectedNode: node
    });
  },
  
  // Update the temporary copy (doesn't affect canvas until save)
  updateNodeBeingEdited: (field, value) => {
    const state = get();
    if (state.debugMode) {
      console.log('✏️ [FlowStore] Updating node copy:', field, '=', value);
    }
    set((state) => ({
      nodeBeingEdited: state.nodeBeingEdited ? {
        ...state.nodeBeingEdited,
        data: {
          ...state.nodeBeingEdited.data,
          [field]: value
        }
      } : null
    }));
  },
  
  // Save the edited copy back to the actual flow
  saveNodeChanges: () => {
    const state = get();
    if (!state.nodeBeingEdited || !state.selectedNode) {
      if (state.debugMode) {
        console.warn('⚠️ [FlowStore] Cannot save: no node being edited');
      }
      return;
    }
    
    if (state.debugMode) {
      console.log('💾 [FlowStore] Saving node changes:', state.nodeBeingEdited.id, 
        JSON.stringify(state.nodeBeingEdited.data, null, 2));
      console.log('✅ [FlowStore] UNBLOCKING canvas interactions');
    }
    
    // Update the actual nodes array
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === state.nodeBeingEdited.id
          ? { ...node, data: { ...state.nodeBeingEdited.data } }
          : node
      ),
      isEditingMode: false,
      nodeBeingEdited: null,
      blockCanvasInteractions: false  // UNBLOCK CANVAS UPDATES
    }));
  },
  
  // Cancel editing and discard changes
  cancelEditingNode: () => {
    const state = get();
    if (state.debugMode) {
      console.log('❌ [FlowStore] Cancelling edit mode');
      console.log('✅ [FlowStore] UNBLOCKING canvas interactions');
    }
    set({
      isEditingMode: false,
      nodeBeingEdited: null,
      blockCanvasInteractions: false  // UNBLOCK CANVAS UPDATES
    });
  },
  
  // Update node data (old method - now used only for non-form updates)
  updateNodeData: (nodeId, newData) => {
    const state = get();
    if (state.debugMode) {
      console.log('🔄 [FlowStore] Direct node update:', nodeId, newData);
    }
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      ),
    }));
  },
  
  // Add node
  addNode: (node) => {
    const state = get();
    if (state.debugMode) {
      console.log('➕ [FlowStore] Adding node:', node.id, 'Type:', node.type);
    }
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },
  
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
    const flowData = {
      id: state.flowId,
      name: state.flowName,
      nodes: state.nodes,
      edges: state.edges,
      createdAt: new Date().toISOString(),
    };
    
    if (state.debugMode) {
      console.log('📄 [FlowStore] getFlowJSON called:', {
        flowId: state.flowId,
        flowName: state.flowName,
        nodeCount: state.nodes?.length || 0,
        edgeCount: state.edges?.length || 0,
        isEditingMode: state.isEditingMode,
        blockCanvasInteractions: state.blockCanvasInteractions
      });
      console.log('📄 [FlowStore] Full flow data:', flowData);
    }
    
    return flowData;
  },
}));
