import { MessageSquare, Volume2, Brain, GitBranch, Phone, PhoneOff, Zap, Users } from 'lucide-react';

const nodeTypes = [
  {
    type: 'playText',
    label: 'Play Text',
    icon: MessageSquare,
    color: 'bg-gradient-to-r from-blue-400 to-blue-600',
    textColor: 'text-white',
    borderColor: 'border-blue-300',
    glowClass: 'glow-blue',
    description: 'Convert text to speech using AI',
  },
  {
    type: 'playAudio',
    label: 'Play Audio',
    icon: Volume2,
    color: 'bg-gradient-to-r from-purple-400 to-purple-600',
    textColor: 'text-white',
    borderColor: 'border-purple-300',
    glowClass: 'glow-purple',
    description: 'Play pre-recorded audio files',
  },
  {
    type: 'findIntent',
    label: 'AI Intent',
    icon: Brain,
    color: 'bg-gradient-to-r from-green-400 to-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-300',
    glowClass: 'glow-green',
    description: 'Understand caller intent with AI',
  },
  {
    type: 'conditional',
    label: 'Conditional',
    icon: GitBranch,
    color: 'bg-gradient-to-r from-orange-400 to-orange-600',
    textColor: 'text-white',
    borderColor: 'border-orange-300',
    glowClass: 'glow-orange',
    description: 'Branch flow based on conditions',
  },
  {
    type: 'transfer',
    label: 'Transfer Call',
    icon: Phone,
    color: 'bg-gradient-to-r from-teal-400 to-teal-600',
    textColor: 'text-white',
    borderColor: 'border-teal-300',
    glowClass: 'glow-teal',
    description: 'Transfer to agent or number',
  },
  {
    type: 'hangup',
    label: 'Hang Up',
    icon: PhoneOff,
    color: 'bg-gradient-to-r from-red-400 to-red-600',
    textColor: 'text-white',
    borderColor: 'border-red-300',
    glowClass: 'glow-red',
    description: 'End the call gracefully',
  },
  {
    type: 'webhook',
    label: 'API Call',
    icon: Zap,
    color: 'bg-gradient-to-r from-pink-400 to-pink-600',
    textColor: 'text-white',
    borderColor: 'border-pink-300',
    glowClass: 'glow-pink',
    description: 'Make external API requests',
  },
  {
    type: 'collectInput',
    label: 'Collect Input',
    icon: Users,
    color: 'bg-gradient-to-r from-indigo-400 to-indigo-600',
    textColor: 'text-white',
    borderColor: 'border-indigo-300',
    glowClass: 'glow-indigo',
    description: 'Collect caller input (DTMF/Voice)',
  },
];

const NodePalette = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 modern-card border-r-0 custom-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <h3 className="font-bold text-xl mb-2 text-gradient-rainbow">🎨 IVR Nodes</h3>
        <p className="text-sm opacity-90">Drag nodes to build your flow</p>
      </div>
      
      {/* Node Grid */}
      <div className="p-4 space-y-3">
        {nodeTypes.map((node, index) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              className={`node-palette-item modern-card rounded-xl p-4 cursor-move border-2 ${node.borderColor} hover:${node.glowClass} transition-all duration-300`}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: 'slideInLeft 0.5s ease-out forwards'
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-3 rounded-xl ${node.color} ${node.textColor} shadow-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-800">{node.label}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">{node.type}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600 leading-relaxed">{node.description}</div>
              
              {/* Progress bar decoration */}
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${node.color} rounded-full transition-all duration-1000`}
                  style={{
                    width: '100%',
                    animation: `loadingBar 2s ease-in-out ${index * 0.2}s infinite alternate`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Help Section */}
      <div className="sticky bottom-0 m-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 modern-card">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="text-sm font-bold text-blue-800">Quick Tips</div>
        </div>
        <div className="text-xs text-blue-700 leading-relaxed">
          • Drag any node onto the canvas<br/>
          • Connect nodes with flow lines<br/>
          • Click nodes to configure properties<br/>
          • Use <strong>Ctrl+Z</strong> to undo actions
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes loadingBar {
          from { opacity: 0.3; }
          to { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default NodePalette;
