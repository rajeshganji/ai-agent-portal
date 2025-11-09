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
  clearFlow: () => {
    const state = get();
    if (state.debugMode) {
      console.log('🧹 [FlowStore] Clearing flow completely');
    }
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      flowName: 'Untitled Flow',
      flowId: null,
      // Also clear editing state
      nodeBeingEdited: null,
      isEditingMode: false,
      blockCanvasInteractions: false,
    });
  },
  
  // Create fresh new flow with generated ID
  createNewFlow: () => {
    const state = get();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    if (state.debugMode) {
      console.log('🆕 [FlowStore] Creating fresh new flow with temp ID:', tempId);
    }
    set({
      nodes: [],
      edges: [],
      selectedNode: null,
      flowName: 'Untitled Flow',
      flowId: tempId, // Generate temporary ID that will be replaced by server
      nodeBeingEdited: null,
      isEditingMode: false,
      blockCanvasInteractions: false,
    });
    return tempId;
  },
  
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
    
    // 🚨 MAXIMUM LOGGING FOR getFlowJSON
    console.log('');
    console.log('📄📄📄 getFlowJSON() CALLED 📄📄📄');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔍 Raw state inspection:');
    console.log('• state.flowId:', state.flowId, '(type:', typeof state.flowId, ')');
    console.log('• state.flowName:', state.flowName, '(type:', typeof state.flowName, ')');
    console.log('• state.nodes:', state.nodes, '(type:', typeof state.nodes, ')');
    console.log('• state.edges:', state.edges, '(type:', typeof state.edges, ')');
    console.log('• state.nodes?.length:', state.nodes?.length);
    console.log('• state.edges?.length:', state.edges?.length);
    console.log('• Array.isArray(state.nodes):', Array.isArray(state.nodes));
    console.log('• Array.isArray(state.edges):', Array.isArray(state.edges));
    
    if (state.nodes && state.nodes.length > 0) {
      console.log('🎯 First few nodes details:');
      state.nodes.slice(0, 3).forEach((node, index) => {
        console.log(`  Node ${index}:`, {
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        });
      });
    } else {
      console.log('⚠️ NO NODES IN STATE!');
    }
    
    if (state.edges && state.edges.length > 0) {
      console.log('� First few edges details:');
      state.edges.slice(0, 3).forEach((edge, index) => {
        console.log(`  Edge ${index}:`, {
          id: edge.id,
          source: edge.source,
          target: edge.target
        });
      });
    } else {
      console.log('⚠️ NO EDGES IN STATE!');
    }
    
    // 🎯 BUILD FLOW DATA WITH ERROR CHECKING
    let flowData;
    try {
      flowData = {
        id: state.flowId,
        name: state.flowName,
        nodes: state.nodes,
        edges: state.edges,
        createdAt: new Date().toISOString(),
      };
      console.log('✅ Flow data object created successfully');
    } catch (buildError) {
      console.error('❌ Error building flow data object:', buildError);
      throw buildError;
    }
    
    // 🔍 FINAL VALIDATION
    console.log('🔍 Final flow data validation:');
    console.log('• flowData.id:', flowData.id);
    console.log('• flowData.name:', flowData.name);
    console.log('• flowData.nodes length:', flowData.nodes?.length || 'undefined');
    console.log('• flowData.edges length:', flowData.edges?.length || 'undefined');
    console.log('• flowData.createdAt:', flowData.createdAt);
    
    // 🚨 DEEP OBJECT INSPECTION
    console.log('🚨 DEEP FLOW DATA OBJECT:');
    try {
      const jsonString = JSON.stringify(flowData, null, 2);
      console.log('• JSON serialization successful, length:', jsonString.length);
      console.log('• First 500 chars:', jsonString.substring(0, 500));
      if (jsonString.length > 500) {
        console.log('• ... (truncated, full object in next log)');
      }
      console.log('• Full flowData object:', flowData);
    } catch (jsonError) {
      console.error('❌ JSON serialization failed:', jsonError);
      console.error('This might be the issue - circular reference or invalid data');
      throw new Error('Flow data cannot be serialized: ' + jsonError.message);
    }
    
    console.log('✅ getFlowJSON() returning data successfully');
    console.log('📄📄📄 getFlowJSON() COMPLETED 📄📄📄');
    console.log('');
    
    return flowData;
  },
}));
