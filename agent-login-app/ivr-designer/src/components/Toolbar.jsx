import { Save, Download, Upload, Play, Trash2, Sparkles, Palette } from 'lucide-react';
import { useFlowStore } from '../store/flowStore';
import { useState } from 'react';

const Toolbar = () => {
  const { flowName, setFlowName, getFlowJSON, loadFlow, clearFlow } = useFlowStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const flowData = getFlowJSON();
    
    try {
      const response = await fetch('/api/ivr/designer/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });
      
      await response.json();
      // Modern success notification
      showNotification('✅ Flow saved successfully!', 'success');
    } catch (error) {
      showNotification('❌ Error saving flow: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (message, type) => {
    // Create a modern notification instead of alert
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const handleExport = () => {
    const flowData = getFlowJSON();
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📄 Flow exported successfully!', 'success');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const flowData = JSON.parse(event.target.result);
          loadFlow(flowData);
          showNotification('📥 Flow imported successfully!', 'success');
        } catch (error) {
          showNotification('❌ Error importing flow: ' + error.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleTest = async () => {
    const flowData = getFlowJSON();
    try {
      const response = await fetch('/api/ivr/designer/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });
      
      await response.json();
      showNotification('🧪 Flow test completed!', 'success');
    } catch (error) {
      showNotification('❌ Error testing flow: ' + error.message, 'error');
    }
  };

  const handleClear = () => {
    // Modern confirmation dialog
    if (confirm('🗑️ Are you sure you want to clear the entire flow? This action cannot be undone.')) {
      clearFlow();
      showNotification('🧹 Flow cleared successfully!', 'success');
    }
  };

  return (
    <div className="h-20 toolbar-gradient shadow-lg border-b-4 border-white/20 flex items-center justify-between px-8">
      {/* Left section */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white text-gradient-rainbow flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              IVR Designer
            </h1>
            <p className="text-white/70 text-sm">Create beautiful call flows</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-white/90 text-sm font-medium">Flow Name:</label>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
            placeholder="Enter flow name..."
          />
        </div>
      </div>

      {/* Right section - Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-hover-effect flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 disabled:opacity-50 border border-white/30 transition-all pulse-on-hover"
        >
          <Save className="w-5 h-5" />
          {isSaving ? '💾 Saving...' : '💾 Save'}
        </button>

        <button
          onClick={handleTest}
          className="btn-hover-effect flex items-center gap-2 px-6 py-3 bg-green-500/80 backdrop-blur-sm text-white rounded-xl hover:bg-green-600 border border-green-300/50 transition-all pulse-on-hover"
        >
          <Play className="w-5 h-5" />
          🧪 Test
        </button>

        <div className="flex bg-white/10 rounded-xl border border-white/20 overflow-hidden">
          <button
            onClick={handleExport}
            className="btn-hover-effect flex items-center gap-2 px-4 py-3 bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <Download className="w-4 h-4" />
            📄 Export
          </button>

          <button
            onClick={handleImport}
            className="btn-hover-effect flex items-center gap-2 px-4 py-3 bg-white/10 text-white hover:bg-white/20 border-l border-white/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            📥 Import
          </button>
        </div>

        <button
          onClick={handleClear}
          className="btn-hover-effect flex items-center gap-2 px-6 py-3 bg-red-500/80 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 border border-red-300/50 transition-all"
        >
          <Trash2 className="w-5 h-5" />
          🗑️ Clear
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
