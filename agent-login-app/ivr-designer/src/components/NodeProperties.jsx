import { X, Settings, Sparkles, Play, Phone, Mic } from 'lucide-react';
import { useFlowStore } from '../store/flowStore';

const NodeProperties = () => {
  const { selectedNode, updateNodeData, setSelectedNode } = useFlowStore();

  if (!selectedNode) {
    return (
      <div className="w-80 properties-gradient border-l-4 border-white/20 p-6 backdrop-blur-sm">
        <div className="text-center mt-16">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div className="text-white/80 text-sm font-medium mb-2">No Node Selected</div>
          <div className="text-white/60 text-xs leading-relaxed">
            Click on a node in the canvas to edit its properties and configure its behavior
          </div>
          <div className="mt-6 p-3 bg-white/10 rounded-xl border border-white/20">
            <div className="text-white/70 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Tip: Each node type has unique settings
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'playText': return '🎵';
      case 'playAudio': return '🎵';
      case 'findIntent': return '🤖';
      case 'conditional': return '❓';
      case 'transfer': return '📞';
      case 'hangup': return '☎️';
      case 'apiCall': return '🌐';
      case 'collectInput': return '⌨️';
      default: return '⚙️';
    }
  };

  const getNodeColor = (type) => {
    switch (type) {
      case 'playText': return 'from-blue-500 to-blue-600';
      case 'playAudio': return 'from-purple-500 to-purple-600';
      case 'findIntent': return 'from-green-500 to-green-600';
      case 'conditional': return 'from-orange-500 to-orange-600';
      case 'transfer': return 'from-teal-500 to-teal-600';
      case 'hangup': return 'from-red-500 to-red-600';
      case 'apiCall': return 'from-pink-500 to-pink-600';
      case 'collectInput': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const renderProperties = () => {
    switch (selectedNode.type) {
      case 'playText':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label flex items-center gap-2">
                <Play className="w-4 h-4" />
                Text to Speak
              </label>
              <textarea
                className="property-input h-24"
                rows={4}
                value={selectedNode.data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Enter the text to be spoken to callers..."
              />
              <div className="text-xs text-white/60 mt-1">
                💡 Keep it conversational and clear for better user experience
              </div>
            </div>
            
            <div className="property-card">
              <label className="property-label">
                🎚️ Voice Speed (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="property-input"
                value={selectedNode.data.speed || 3}
                onChange={(e) => handleChange('speed', e.target.value)}
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>1 = Slow</span>
                <span>5 = Normal</span>
                <span>10 = Fast</span>
              </div>
            </div>
          </div>
        );

      case 'playAudio':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Audio File URL
              </label>
              <input
                type="url"
                className="property-input"
                value={selectedNode.data.audioUrl || ''}
                onChange={(e) => handleChange('audioUrl', e.target.value)}
                placeholder="https://example.com/audio.mp3"
              />
              <div className="text-xs text-white/60 mt-1">
                📎 Supported formats: MP3, WAV, M4A
              </div>
            </div>
            
            <div className="p-4 bg-white/10 rounded-xl border border-white/20">
              <div className="text-xs text-white/70 flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                Audio Tips
              </div>
              <ul className="text-xs text-white/60 space-y-1">
                <li>• Use clear, high-quality audio files</li>
                <li>• Recommended: 8kHz or 16kHz sample rate</li>
                <li>• Keep files under 5MB for best performance</li>
              </ul>
            </div>
          </div>
        );

      case 'findIntent':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label">
                🤖 AI Prompt for User
              </label>
              <textarea
                className="property-input h-20"
                rows={3}
                value={selectedNode.data.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                placeholder="How can I help you today?"
              />
              <div className="text-xs text-white/60 mt-1">
                🎯 This message will be spoken to collect user intent
              </div>
            </div>
            
            <div className="property-card">
              <label className="property-label">
                🎯 Expected Intents (one per line)
              </label>
              <textarea
                className="property-input h-24"
                rows={4}
                value={(selectedNode.data.intents || []).join('\n')}
                onChange={(e) => handleChange('intents', e.target.value.split('\n').filter(i => i.trim()))}
                placeholder="sales&#10;support&#10;billing&#10;other"
              />
              <div className="text-xs text-white/60 mt-1">
                🔗 Each intent becomes an output connection point
              </div>
            </div>
          </div>
        );

      case 'conditional':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label">
                ❓ Condition Logic
              </label>
              <input
                type="text"
                className="property-input"
                value={selectedNode.data.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                placeholder="intent === 'sales'"
              />
              <div className="text-xs text-white/60 mt-1">
                ⚡ Available variables: intent, dtmf, callerId
              </div>
            </div>
            
            <div className="p-4 bg-white/10 rounded-xl border border-white/20">
              <div className="text-xs text-white/70 mb-2">💡 Example Conditions:</div>
              <div className="text-xs text-white/60 space-y-1 font-mono">
                <div>• intent === 'sales'</div>
                <div>• dtmf === '1'</div>
                <div>• callerId.includes('+1')</div>
              </div>
            </div>
          </div>
        );

      case 'transfer':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Transfer Phone Number
              </label>
              <input
                type="tel"
                className="property-input"
                value={selectedNode.data.phoneNumber || ''}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="+1234567890"
              />
              <div className="text-xs text-white/60 mt-1">
                📞 Include country code for international numbers
              </div>
            </div>
          </div>
        );

      case 'collectInput':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label">
                💬 Input Prompt
              </label>
              <textarea
                className="property-input h-20"
                value={selectedNode.data.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                placeholder="Please enter your account number"
              />
            </div>
            
            <div className="property-card">
              <label className="property-label">
                ⏱️ Timeout (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                className="property-input"
                value={selectedNode.data.timeout || 5}
                onChange={(e) => handleChange('timeout', e.target.value)}
              />
            </div>
          </div>
        );

      case 'apiCall':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label">
                🌐 API Endpoint
              </label>
              <input
                type="url"
                className="property-input"
                value={selectedNode.data.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            
            <div className="property-card">
              <label className="property-label">
                📡 HTTP Method
              </label>
              <select
                className="property-input"
                value={selectedNode.data.method || 'GET'}
                onChange={(e) => handleChange('method', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>
        );

      case 'hangup':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">☎️</span>
            </div>
            <div className="text-white/80 font-medium mb-2">End Call Node</div>
            <div className="text-white/60 text-sm">
              This node will gracefully end the call. No additional configuration needed.
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="text-white/60 text-sm">No properties available for this node type</div>
          </div>
        );
    }
  };

  return (
    <div className="w-80 properties-gradient border-l-4 border-white/20 p-6 backdrop-blur-sm overflow-y-auto beautiful-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${getNodeColor(selectedNode.type)} rounded-xl flex items-center justify-center text-white shadow-lg`}>
            <span className="text-lg">{getNodeIcon(selectedNode.type)}</span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              Properties
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </h3>
            <p className="text-white/70 text-xs">Configure node behavior</p>
          </div>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-6 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
        <div className="text-xs font-semibold text-white/60 mb-1">Selected Node</div>
        <div className={`text-sm font-bold bg-gradient-to-r ${getNodeColor(selectedNode.type)} bg-clip-text text-transparent flex items-center gap-2`}>
          <span>{getNodeIcon(selectedNode.type)}</span>
          {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
        </div>
        <div className="text-xs text-white/50 mt-1">ID: {selectedNode.id}</div>
      </div>

      {renderProperties()}
    </div>
  );
};

export default NodeProperties;
