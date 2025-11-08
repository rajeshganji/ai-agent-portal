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
    setEdges: setStoreEdges 
  } = useFlowStore();

  // Only sync store to local state on mount if store has data
  useEffect(() => {
    if (storeNodes.length > 0 && nodes.length === 0) {
      console.log('Loading nodes from store:', storeNodes.length);
      setNodes(storeNodes);
    }
    if (storeEdges.length > 0 && edges.length === 0) {
      console.log('Loading edges from store:', storeEdges.length);
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

  // Sync with store
  const syncToStore = useCallback(() => {
    setStoreNodes(nodes);
    setStoreEdges(edges);
  }, [nodes, edges, setStoreNodes, setStoreEdges]);

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
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 relative overflow-hidden">
      {/* Beautiful animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-60 pointer-events-none"></div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          onNodesChange(changes);
          setTimeout(syncToStore, 100);
        }}
        onEdgesChange={(changes) => {
          onEdgesChange(changes);
          setTimeout(syncToStore, 100);
        }}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="beautiful-flow-canvas"
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
