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
      <div className="w-56 bg-gradient-to-b from-orange-50 to-amber-50 border-l border-orange-200 p-4 shadow-lg">
        <div className="text-center mt-16">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-200 to-amber-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <Settings className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-orange-700 text-sm font-medium mb-2">No Node Selected</div>
          <div className="text-orange-600 text-xs leading-relaxed">
            Click on a node in the canvas to edit its properties
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
              <div className="text-xs text-slate-600 mt-1">
                💡 Keep it conversational and clear for better user experience
                {!isEditingMode && <span className="text-blue-600 ml-2">Click Edit to modify</span>}
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
              <div className="flex justify-between text-xs text-slate-600 mt-1">
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
              <div className="text-xs text-gray-600 mt-1">
                📎 Supported formats: MP3, WAV, M4A
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs text-gray-700 flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                Audio Tips
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
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
              <div className="text-xs text-gray-600 mt-1">
                🎯 This message will be spoken to collect user intent
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
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
              <div className="text-xs text-gray-600 mt-1">
                🔗 Each intent becomes an output connection point
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
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
                className={`property-input ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={currentNodeData?.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                placeholder="intent === 'sales'"
                autoComplete="off"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
                aria-describedby="conditional-condition-help"
              />
              <div id="conditional-condition-help" className="text-xs text-gray-600 mt-1">
                ⚡ Available variables: intent, dtmf, callerId
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-xs text-gray-700 mb-2">💡 Example Conditions:</div>
              <div className="text-xs text-gray-600 space-y-1 font-mono">
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
                className={`property-input ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={currentNodeData?.phoneNumber || ''}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="+1234567890"
                autoComplete="tel"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
                aria-describedby="transfer-phone-help"
              />
              <div id="transfer-phone-help" className="text-xs text-gray-600 mt-1">
                📞 Include country code for international numbers
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
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
                className={`property-input h-20 ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={currentNodeData?.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                placeholder="Please enter your account number"
                autoComplete="off"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
                aria-describedby="collectinput-prompt-help"
              />
              <div id="collectinput-prompt-help" className="text-xs text-gray-600 mt-1">
                💡 Message to prompt user for input
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
              </div>
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
                className={`property-input ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={currentNodeData?.timeout || 5}
                onChange={(e) => handleChange('timeout', e.target.value)}
                autoComplete="off"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
                aria-describedby="collectinput-timeout-help"
              />
              <div id="collectinput-timeout-help" className="text-xs text-gray-600 mt-1">
                ⌛ Time to wait for user input (1-30 seconds)
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
              </div>
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
                className={`property-input ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={currentNodeData?.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
                autoComplete="url"
                readOnly={!isEditingMode}
                disabled={!isEditingMode}
                aria-describedby="apicall-url-help"
              />
              <div id="apicall-url-help" className="text-xs text-gray-600 mt-1">
                🔗 Full URL to the API endpoint
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
              </div>
            </div>
            
            <div className="property-card">
              <label className="property-label" htmlFor="apicall-method">
                📡 HTTP Method
              </label>
              <select
                id="apicall-method"
                name="apicall-method"
                className={`property-input ${!isEditingMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={currentNodeData?.method || 'GET'}
                onChange={(e) => handleChange('method', e.target.value)}
                disabled={!isEditingMode}
                aria-describedby="apicall-method-help"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <div id="apicall-method-help" className="text-xs text-gray-600 mt-1">
                🔄 HTTP method for the API request
                {!isEditingMode && <span className="text-orange-500 ml-2">Click Edit to modify</span>}
              </div>
            </div>
          </div>
        );

      case 'hangup':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">☎️</span>
            </div>
            <div className="text-gray-700 font-medium mb-2">End Call Node</div>
            <div className="text-gray-600 text-sm">
              This node will gracefully end the call. No additional configuration needed.
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="text-gray-600 text-sm">No properties available for this node type</div>
          </div>
        );
    }
  };

  return (
    <div className="w-56 bg-gradient-to-b from-orange-50 to-amber-50 border-l border-orange-200 p-4 overflow-y-auto shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${getNodeColor(selectedNode.type)} rounded-xl flex items-center justify-center text-white shadow-lg`}>
            <span className="text-lg">{getNodeIcon(selectedNode.type)}</span>
          </div>
          <div>
            <h3 className="font-bold text-lg text-orange-800 flex items-center gap-2">
              Properties
              <Sparkles className="w-5 h-5 text-amber-500" />
              {isEditingMode && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">EDITING</span>}
            </h3>
            <p className="text-orange-600 text-xs">Configure node behavior</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditingMode ? (
            <>
              <button
                onClick={handleStartEdit}
                className="p-2 hover:bg-orange-200 rounded-xl transition-all text-orange-600 hover:text-orange-800 flex items-center gap-1 border border-orange-300"
                title="Start Editing"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-2 hover:bg-orange-200 rounded-xl transition-all text-orange-600 hover:text-orange-800 border border-orange-300"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="p-2 hover:bg-green-100 bg-green-50 rounded-xl transition-all text-green-700 hover:text-green-800 flex items-center gap-1 border border-green-300"
                title="Save Changes"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-red-100 bg-red-50 rounded-xl transition-all text-red-700 hover:text-red-800 border border-red-300"
                title="Cancel Changes"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 p-4 bg-white rounded-xl border border-slate-300 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 mb-1">Selected Node</div>
        <div className={`text-sm font-bold bg-gradient-to-r ${getNodeColor(selectedNode.type)} bg-clip-text text-transparent flex items-center gap-2`}>
          <span>{getNodeIcon(selectedNode.type)}</span>
          {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
        </div>
        <div className="text-xs text-slate-400 mt-1">ID: {selectedNode.id}</div>
      </div>

      {renderProperties()}
    </div>
  );
};

export default NodeProperties;
