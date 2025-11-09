import { 
  MessageSquare, 
  Volume2, 
  Brain, 
  GitBranch, 
  Phone, 
  PhoneOff, 
  Zap, 
  Keyboard
} from 'lucide-react';

// 🎨 Industry-standard colors for IVR/Telecom nodes
const nodeTypes = [
  {
    type: 'playText',
    label: 'Play Text',
    icon: MessageSquare,
    color: '#3B82F6', // Blue - Communication
    bgClass: 'bg-blue-500',
    hoverClass: 'hover:bg-blue-600',
    description: 'Convert text to speech using AI',
  },
  {
    type: 'playAudio',
    label: 'Play Audio',
    icon: Volume2,
    color: '#8B5CF6', // Purple - Media/Audio
    bgClass: 'bg-purple-500',
    hoverClass: 'hover:bg-purple-600',
    description: 'Play pre-recorded audio files',
  },
  {
    type: 'findIntent',
    label: 'AI Intent',
    icon: Brain,
    color: '#10B981', // Green - AI/Intelligence
    bgClass: 'bg-green-500',
    hoverClass: 'hover:bg-green-600',
    description: 'Understand caller intent with AI',
  },
  {
    type: 'conditional',
    label: 'Conditional',
    icon: GitBranch,
    color: '#F59E0B', // Amber - Logic/Branching
    bgClass: 'bg-amber-500',
    hoverClass: 'hover:bg-amber-600',
    description: 'Branch flow based on conditions',
  },
  {
    type: 'transfer',
    label: 'Transfer Call',
    icon: Phone,
    color: '#06B6D4', // Cyan - Call Transfer
    bgClass: 'bg-cyan-500',
    hoverClass: 'hover:bg-cyan-600',
    description: 'Transfer to agent or number',
  },
  {
    type: 'hangup',
    label: 'Hang Up',
    icon: PhoneOff,
    color: '#EF4444', // Red - End Call
    bgClass: 'bg-red-500',
    hoverClass: 'hover:bg-red-600',
    description: 'End the call gracefully',
  },
  {
    type: 'webhook',
    label: 'API Call',
    icon: Zap,
    color: '#EC4899', // Pink - API/Integration
    bgClass: 'bg-pink-500',
    hoverClass: 'hover:bg-pink-600',
    description: 'Make external API requests',
  },
  {
    type: 'collectInput',
    label: 'Collect Input',
    icon: Keyboard,
    color: '#6366F1', // Indigo - User Input
    bgClass: 'bg-indigo-500',
    hoverClass: 'hover:bg-indigo-600',
    description: 'Collect caller input (DTMF/Voice)',
  },
];

const NodePalette = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-20 bg-gradient-to-b from-emerald-50 to-green-50 border-r border-emerald-200 flex flex-col">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-3 border-b border-emerald-200 text-center">
        <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
          Nodes
        </div>
      </div>
      
      {/* Icon-Only Node Grid */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              className={`
                group relative 
                w-14 h-14 
                bg-white 
                border-2 border-gray-200
                hover:border-gray-300
                rounded-lg 
                cursor-move 
                flex items-center justify-center 
                transition-all duration-200 
                shadow-sm hover:shadow-md
                hover:scale-105
              `}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              title={`${node.label}: ${node.description}`}
            >
              <Icon 
                className="w-7 h-7" 
                style={{ color: node.color }}
              />
              
              {/* Tooltip on hover */}
              <div className="
                absolute left-16 top-1/2 transform -translate-y-1/2 
                bg-gray-900 text-white text-xs 
                px-3 py-2 rounded-lg 
                opacity-0 group-hover:opacity-100 
                transition-opacity duration-200 
                pointer-events-none
                whitespace-nowrap
                shadow-lg
                z-50
              ">
                <div className="font-semibold">{node.label}</div>
                <div className="text-gray-300">{node.description}</div>
                {/* Tooltip arrow */}
                <div className="
                  absolute right-full top-1/2 transform -translate-y-1/2 
                  border-4 border-transparent border-r-gray-900
                "></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Compact Help */}
      <div className="p-2 bg-white border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Drag to canvas
        </div>
      </div>
    </div>
  );
};

export default NodePalette;
