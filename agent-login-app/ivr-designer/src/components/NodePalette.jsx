import { MessageSquare, Volume2, Brain, GitBranch, Phone, PhoneOff } from 'lucide-react';

const nodeTypes = [
  {
    type: 'playText',
    label: 'Play Text',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-600',
    description: 'Play text-to-speech message',
  },
  {
    type: 'playAudio',
    label: 'Play Audio',
    icon: Volume2,
    color: 'bg-purple-100 text-purple-600',
    description: 'Play audio file',
  },
  {
    type: 'findIntent',
    label: 'Find Intent',
    icon: Brain,
    color: 'bg-green-100 text-green-600',
    description: 'AI intent recognition',
  },
  {
    type: 'conditional',
    label: 'Conditional',
    icon: GitBranch,
    color: 'bg-orange-100 text-orange-600',
    description: 'Branch on condition',
  },
  {
    type: 'transfer',
    label: 'Transfer Call',
    icon: Phone,
    color: 'bg-teal-100 text-teal-600',
    description: 'Transfer to number',
  },
  {
    type: 'hangup',
    label: 'Hang Up',
    icon: PhoneOff,
    color: 'bg-red-100 text-red-600',
    description: 'End the call',
  },
];

const NodePalette = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-bold text-lg mb-4 text-gray-800">IVR Nodes</h3>
      
      <div className="space-y-2">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              className="p-3 bg-white rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`p-2 rounded ${node.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-gray-800">{node.label}</div>
              </div>
              <div className="text-xs text-gray-500 ml-10">{node.description}</div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-800 font-semibold mb-1">How to use:</div>
        <div className="text-xs text-blue-700">Drag nodes onto the canvas and connect them to build your IVR flow</div>
      </div>
    </div>
  );
};

export default NodePalette;
