import { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useFlowStore } from '../store/flowStore';
import StartNode from './nodes/StartNode';
import PlayTextNode from './nodes/PlayTextNode';
import PlayAudioNode from './nodes/PlayAudioNode';
import FindIntentNode from './nodes/FindIntentNode';
import ConditionalNode from './nodes/ConditionalNode';

const nodeTypes = {
  start: StartNode,
  playText: PlayTextNode,
  playAudio: PlayAudioNode,
  findIntent: FindIntentNode,
  conditional: ConditionalNode,
};

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

const FlowCanvas = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { 
    nodes: storeNodes, 
    edges: storeEdges, 
    setSelectedNode, 
    setNodes: setStoreNodes, 
    setEdges: setStoreEdges,
    debugMode,
    blockCanvasInteractions,
    isEditingMode
  } = useFlowStore();

  // Only sync store to local state on mount if store has data
  useEffect(() => {
    if (storeNodes.length > 0 && nodes.length === 0) {
      if (debugMode) {
        console.log('🔄 [FlowCanvas] Loading nodes from store:', storeNodes.length);
      }
      setNodes(storeNodes);
    }
    if (storeEdges.length > 0 && edges.length === 0) {
      if (debugMode) {
        console.log('🔄 [FlowCanvas] Loading edges from store:', storeEdges.length);
      }
      setEdges(storeEdges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - only run on mount

  // Initialize with Start node if empty
  const initializeFlow = useCallback(() => {
    if (nodes.length === 0) {
      const startNode = {
        id: 'start-node',
        type: 'start',
        position: { x: 250, y: 50 },
        data: { label: '🚀 Start' },
        draggable: true,
        deletable: false, // Can't delete the start node
      };
      setNodes([startNode]);
    }
  }, [nodes.length, setNodes]);

  // Initialize flow on mount
  useEffect(() => {
    initializeFlow();
  }, [initializeFlow]);

  // Sync with store - but BLOCK during editing mode
  const syncToStore = useCallback(() => {
    if (blockCanvasInteractions) {
      if (debugMode) {
        console.log('🚫 [FlowCanvas] Sync BLOCKED - editing in progress');
      }
      return;
    }
    if (debugMode) {
      console.log('🔄 [FlowCanvas] Syncing to store - nodes:', nodes.length, 'edges:', edges.length);
    }
    setStoreNodes(nodes);
    setStoreEdges(edges);
  }, [nodes, edges, setStoreNodes, setStoreEdges, blockCanvasInteractions, debugMode]);

  // Sync to store whenever nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      syncToStore();
    }
  }, [nodes, edges, syncToStore]);

  const onConnect = useCallback(
    (params) => {
      const newEdges = addEdge(
        {
          ...params,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#4338ca',
            strokeWidth: 3,
            filter: 'drop-shadow(0 2px 4px rgba(67, 56, 202, 0.3))',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#4338ca',
          },
        },
        edges
      );
      setEdges(newEdges);
      setTimeout(syncToStore, 100);
    },
    [edges, setEdges, syncToStore]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 25,
      };

      const newNode = {
        id: getId(),
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => nds.concat(newNode));
      setTimeout(syncToStore, 100);
    },
    [setNodes, syncToStore]
  );

  const getDefaultNodeData = (type) => {
    switch (type) {
      case 'playText':
        return { text: '🎵 Hello, welcome to our service', speed: 3 };
      case 'playAudio':
        return { audioUrl: '🎵 Upload your audio file' };
      case 'findIntent':
        return { prompt: '🤖 How can I help you?', intents: ['sales', 'support', 'billing'] };
      case 'conditional':
        return { condition: '❓ Set your condition' };
      case 'transfer':
        return { phoneNumber: '📞 Enter phone number' };
      case 'hangup':
        return { label: '☎️ End Call' };
      case 'apiCall':
        return { url: '🌐 API endpoint', method: 'GET' };
      case 'collectInput':
        return { prompt: '⌨️ Please enter your input', timeout: 5 };
      default:
        return {};
    }
  };

  const onNodeClick = useCallback(
    (event, node) => {
      if (debugMode) {
        console.log('🎯 [FlowCanvas] Node clicked:', node.id, 'Type:', node.type);
      }
      
      // Don't change selection if we're in editing mode
      if (!isEditingMode) {
        setSelectedNode(node);
      } else if (debugMode) {
        console.log('🚫 [FlowCanvas] Node click ignored - editing mode active');
      }
    },
    [setSelectedNode, debugMode, isEditingMode]
  );

  // Add mouse event logging
  const onMouseMove = useCallback((event) => {
    if (debugMode) {
      // Only log every 100th move to avoid spam
      if (Math.random() > 0.99) {
        console.log('🖱️ [FlowCanvas] Mouse move:', { x: event.clientX, y: event.clientY });
      }
    }
  }, [debugMode]);

  const onPaneClick = useCallback(() => {
    if (debugMode) {
      console.log('🖱️ [FlowCanvas] Pane clicked - deselecting node');
    }
    // Don't clear selection if we're in editing mode
    if (!isEditingMode) {
      setSelectedNode(null);
    } else if (debugMode) {
      console.log('🚫 [FlowCanvas] Pane click ignored - editing mode active');
    }
  }, [setSelectedNode, debugMode, isEditingMode]);

  return (
    <div ref={reactFlowWrapper} className="flex-1 relative overflow-hidden">
      {/* Beautiful animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60 pointer-events-none"></div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          if (debugMode && changes.length > 0) {
            console.log('📊 [FlowCanvas] Nodes changed:', changes.length, 'changes');
          }
          onNodesChange(changes);
          setTimeout(syncToStore, 100);
        }}
        onEdgesChange={(changes) => {
          if (debugMode && changes.length > 0) {
            console.log('🔗 [FlowCanvas] Edges changed:', changes.length, 'changes');
          }
          onEdgesChange(changes);
          setTimeout(syncToStore, 100);
        }}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMouseMove={onMouseMove}
        nodeTypes={nodeTypes}
        // Canvas size and zoom optimization
        fitView
        fitViewOptions={{
          padding: 0.3,      // More padding around nodes
          minZoom: 0.3,      // Allow zooming out much further
          maxZoom: 1.5,      // Reasonable max zoom
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}  // Start more zoomed out
        minZoom={0.1}        // Allow very wide view
        maxZoom={2}
        className="beautiful-flow-canvas"
        // Touch and performance optimization
        panOnDrag={true}
        panOnScroll={false}
        panOnScrollSpeed={0.5}
        preventScrolling={false}
        selectNodesOnDrag={false}
        onInit={(reactFlowInstance) => {
          console.log('🎯 [FlowCanvas] ReactFlow initialized');
          
          // Set a better initial viewport
          setTimeout(() => {
            reactFlowInstance.setViewport({ x: 50, y: 50, zoom: 0.6 });
            
            // Fix touch event performance warnings by ensuring passive listeners
            const viewport = document.querySelector('.react-flow__viewport');
            if (viewport) {
              viewport.style.touchAction = 'manipulation';
              console.log('🎨 [FlowCanvas] Touch optimization applied to ReactFlow viewport');
            }
            
            if (debugMode) {
              console.log('🔍 [FlowCanvas] Initial viewport set - zoom: 0.6, better node visibility');
            }
          }, 100);
        }}
      >
        <Background 
          color="#e0e7ff" 
          gap={20} 
          size={2}
          variant="dots"
          className="opacity-40"
        />
        
        <Controls 
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200 shadow-lg"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        
        <MiniMap
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200 shadow-lg overflow-hidden"
          nodeColor={(node) => {
            switch (node.type) {
              case 'start': return '#10b981';
              case 'playText': return '#3b82f6';
              case 'playAudio': return '#a855f7';
              case 'findIntent': return '#22c55e';
              case 'conditional': return '#f97316';
              case 'transfer': return '#06b6d4';
              case 'hangup': return '#ef4444';
              case 'apiCall': return '#ec4899';
              case 'collectInput': return '#6366f1';
              default: return '#6b7280';
            }
          }}
          nodeStrokeWidth={3}
          nodeBorderRadius={8}
        />
      </ReactFlow>

      {/* Floating action hint */}
      {nodes.length <= 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-purple-200 text-purple-700 font-medium flex items-center gap-2 animate-bounce">
          <span className="text-xl">✨</span>
          Drag nodes from the sidebar to build your flow
        </div>
      )}
    </div>
  );
};

export default FlowCanvas;
