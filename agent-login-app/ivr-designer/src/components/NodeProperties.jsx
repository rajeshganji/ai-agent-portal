import { X, Settings, Sparkles, Play, Phone, Mic, Save, Edit3 } from 'lucide-react';
import { useFlowStore } from '../store/flowStore';

const NodeProperties = () => {
  const { 
    selectedNode, 
    nodeBeingEdited,
    isEditingMode,
    startEditingNode,
    updateNodeBeingEdited,
    saveNodeChanges,
    cancelEditingNode,
    setSelectedNode,
    debugMode
  } = useFlowStore();

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

  // Debug logging
  if (debugMode) {
    console.log('🎨 [NodeProperties] Render - Selected:', selectedNode?.id, 'EditMode:', isEditingMode);
  }

  // Use nodeBeingEdited if in editing mode, otherwise use selectedNode
  const currentNodeData = isEditingMode ? nodeBeingEdited?.data : selectedNode?.data;
  
  const handleStartEdit = () => {
    if (debugMode) {
      console.log('🔧 [NodeProperties] Starting edit mode for node:', selectedNode.id);
    }
    startEditingNode(selectedNode);
  };

  const handleChange = (field, value) => {
    if (debugMode) {
      console.log('✏️ [NodeProperties] Field changed:', field, '=', value);
    }
    updateNodeBeingEdited(field, value);
  };

  const handleSave = () => {
    if (debugMode) {
      console.log('💾 [NodeProperties] Saving changes');
    }
    saveNodeChanges();
  };

  const handleCancel = () => {
    if (debugMode) {
      console.log('❌ [NodeProperties] Cancelling changes');
    }
    cancelEditingNode();
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
              <label className="property-label flex items-center gap-2" htmlFor="playtext-content">
                <Play className="w-4 h-4" />
                Text to Speak
              </label>
              <textarea
                id="playtext-content"
                name="playtext-content"
                className={`property-input h-24 ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                rows={4}
                value={currentNodeData?.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Enter the text to be spoken to callers..."
                autoComplete="off"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
              />
              <div className="text-xs text-white/60 mt-1">
                💡 Keep it conversational and clear for better user experience
                {!isEditingMode && <span className="text-yellow-300 ml-2">Click Edit to modify</span>}
              </div>
            </div>
            
            <div className="property-card">
              <label className="property-label" htmlFor="playtext-speed">
                🎚️ Voice Speed (1-10)
              </label>
              <input
                id="playtext-speed"
                name="playtext-speed"
                type="number"
                min="1"
                max="10"
                className={`property-input ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={currentNodeData?.speed || 3}
                onChange={(e) => handleChange('speed', e.target.value)}
                autoComplete="off"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
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
              <label className="property-label flex items-center gap-2" htmlFor="playaudio-url">
                <Mic className="w-4 h-4" />
                Audio File URL
              </label>
              <input
                id="playaudio-url"
                name="playaudio-url"
                type="url"
                className={`property-input ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={currentNodeData?.audioUrl || ''}
                onChange={(e) => handleChange('audioUrl', e.target.value)}
                placeholder="https://example.com/audio.mp3"
                autoComplete="off"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
              />
              <div className="text-xs text-white/60 mt-1">
                📎 Supported formats: MP3, WAV, M4A
                {!isEditingMode && <span className="text-yellow-300 ml-2">Click Edit to modify</span>}
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
              <label className="property-label" htmlFor="findintent-prompt">
                🤖 AI Prompt for User
              </label>
              <textarea
                id="findintent-prompt"
                name="findintent-prompt"
                className={`property-input h-20 ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                rows={3}
                value={currentNodeData?.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                placeholder="How can I help you today?"
                autoComplete="off"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
              />
              <div className="text-xs text-white/60 mt-1">
                🎯 This message will be spoken to collect user intent
                {!isEditingMode && <span className="text-yellow-300 ml-2">Click Edit to modify</span>}
              </div>
            </div>
            
            <div className="property-card">
              <label className="property-label" htmlFor="findintent-intents">
                🎯 Expected Intents (one per line)
              </label>
              <textarea
                id="findintent-intents"
                name="findintent-intents"
                className={`property-input h-24 ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                rows={4}
                value={(currentNodeData?.intents || []).join('\n')}
                onChange={(e) => handleChange('intents', e.target.value.split('\n').filter(i => i.trim()))}
                placeholder="sales&#10;support&#10;billing&#10;other"
                autoComplete="off"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
              />
              <div className="text-xs text-white/60 mt-1">
                🔗 Each intent becomes an output connection point
                {!isEditingMode && <span className="text-yellow-300 ml-2">Click Edit to modify</span>}
              </div>
            </div>
          </div>
        );

      case 'conditional':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label" htmlFor="conditional-condition">
                ❓ Condition Logic
              </label>
              <input
                id="conditional-condition"
                name="conditional-condition"
                type="text"
                className="property-input"
                value={selectedNode.data.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                placeholder="intent === 'sales'"
                autoComplete="off"
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
              <label className="property-label flex items-center gap-2" htmlFor="transfer-phone">
                <Phone className="w-4 h-4" />
                Transfer Phone Number
              </label>
              <input
                id="transfer-phone"
                name="transfer-phone"
                type="tel"
                className="property-input"
                value={selectedNode.data.phoneNumber || ''}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="+1234567890"
                autoComplete="tel"
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
              <label className="property-label" htmlFor="collectinput-prompt">
                💬 Input Prompt
              </label>
              <textarea
                id="collectinput-prompt"
                name="collectinput-prompt"
                className="property-input h-20"
                value={selectedNode.data.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                placeholder="Please enter your account number"
                autoComplete="off"
              />
            </div>
            
            <div className="property-card">
              <label className="property-label" htmlFor="collectinput-timeout">
                ⏱️ Timeout (seconds)
              </label>
              <input
                id="collectinput-timeout"
                name="collectinput-timeout"
                type="number"
                min="1"
                max="30"
                className="property-input"
                value={selectedNode.data.timeout || 5}
                onChange={(e) => handleChange('timeout', e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
        );

      case 'apiCall':
        return (
          <div className="space-y-6">
            <div className="property-card">
              <label className="property-label" htmlFor="apicall-url">
                🌐 API Endpoint
              </label>
              <input
                id="apicall-url"
                name="apicall-url"
                type="url"
                className="property-input"
                value={selectedNode.data.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
                autoComplete="url"
              />
            </div>
            
            <div className="property-card">
              <label className="property-label" htmlFor="apicall-method">
                📡 HTTP Method
              </label>
              <select
                id="apicall-method"
                name="apicall-method"
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
              {isEditingMode && <span className="text-xs bg-green-500 px-2 py-1 rounded">EDITING</span>}
            </h3>
            <p className="text-white/70 text-xs">Configure node behavior</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditingMode ? (
            <>
              <button
                onClick={handleStartEdit}
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/70 hover:text-white flex items-center gap-1"
                title="Start Editing"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="p-2 hover:bg-green-500/20 bg-green-500/10 rounded-xl transition-all text-green-300 hover:text-green-200 flex items-center gap-1"
                title="Save Changes"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-red-500/20 bg-red-500/10 rounded-xl transition-all text-red-300 hover:text-red-200"
                title="Cancel Changes"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
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
