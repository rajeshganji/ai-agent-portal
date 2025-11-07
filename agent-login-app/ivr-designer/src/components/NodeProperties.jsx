import { X } from 'lucide-react';
import { useFlowStore } from '../store/flowStore';

const NodeProperties = () => {
  const { selectedNode, updateNodeData, setSelectedNode } = useFlowStore();

  if (!selectedNode) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4">
        <div className="text-gray-500 text-sm text-center mt-10">
          Select a node to edit its properties
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  const renderProperties = () => {
    switch (selectedNode.type) {
      case 'playText':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text to Speak
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                value={selectedNode.data.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Enter the text to be spoken..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voice Speed (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                value={selectedNode.data.speed || 3}
                onChange={(e) => handleChange('speed', e.target.value)}
              />
            </div>
          </div>
        );

      case 'playAudio':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audio URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                value={selectedNode.data.audioUrl || ''}
                onChange={(e) => handleChange('audioUrl', e.target.value)}
                placeholder="https://example.com/audio.mp3"
              />
            </div>
          </div>
        );

      case 'findIntent':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt for User
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                rows={3}
                value={selectedNode.data.prompt || ''}
                onChange={(e) => handleChange('prompt', e.target.value)}
                placeholder="How can I help you today?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Intents (one per line)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                rows={4}
                value={(selectedNode.data.intents || []).join('\n')}
                onChange={(e) => handleChange('intents', e.target.value.split('\n').filter(i => i.trim()))}
                placeholder="sales&#10;support&#10;billing&#10;other"
              />
            </div>
            <div className="text-xs text-gray-500">
              Each intent will become an output connection point
            </div>
          </div>
        );

      case 'conditional':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                value={selectedNode.data.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                placeholder="intent === 'sales'"
              />
            </div>
            <div className="text-xs text-gray-500">
              Use variables like: intent, dtmf, callerId
            </div>
          </div>
        );

      case 'transfer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500"
                value={selectedNode.data.phoneNumber || ''}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>
        );

      case 'hangup':
        return (
          <div className="text-sm text-gray-600">
            This node will end the call. No additional configuration needed.
          </div>
        );

      default:
        return <div className="text-sm text-gray-500">No properties available</div>;
    }
  };

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800">Properties</h3>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 mb-1">Node Type</div>
        <div className="text-sm font-medium text-gray-800">{selectedNode.type}</div>
      </div>

      {renderProperties()}
    </div>
  );
};

export default NodeProperties;
