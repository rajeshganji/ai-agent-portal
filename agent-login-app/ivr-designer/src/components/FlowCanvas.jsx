import { useCallback, useRef } from 'react';
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
import PlayTextNode from './nodes/PlayTextNode';
import PlayAudioNode from './nodes/PlayAudioNode';
import FindIntentNode from './nodes/FindIntentNode';
import ConditionalNode from './nodes/ConditionalNode';

const nodeTypes = {
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
  const { setSelectedNode, setNodes: setStoreNodes, setEdges: setStoreEdges } = useFlowStore();

  // Sync with store
  const syncToStore = useCallback(() => {
    setStoreNodes(nodes);
    setStoreEdges(edges);
  }, [nodes, edges, setStoreNodes, setStoreEdges]);

  const onConnect = useCallback(
    (params) => {
      const newEdges = addEdge(
        {
          ...params,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
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
        return { text: 'Hello, welcome to our service', speed: 3 };
      case 'playAudio':
        return { audioUrl: '' };
      case 'findIntent':
        return { prompt: 'How can I help you?', intents: ['sales', 'support', 'billing'] };
      case 'conditional':
        return { condition: '' };
      case 'transfer':
        return { phoneNumber: '' };
      case 'hangup':
        return {};
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
    <div ref={reactFlowWrapper} className="flex-1">
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
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'playText': return '#3b82f6';
              case 'playAudio': return '#a855f7';
              case 'findIntent': return '#22c55e';
              case 'conditional': return '#f97316';
              default: return '#6b7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
