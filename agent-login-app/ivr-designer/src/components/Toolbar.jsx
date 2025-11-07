import { Save, Download, Upload, Play, Trash2 } from 'lucide-react';
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
      
      const result = await response.json();
      alert(`Flow saved successfully! ID: ${result.id}`);
    } catch (error) {
      alert('Error saving flow: ' + error.message);
    } finally {
      setIsSaving(false);
    }
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
          alert('Flow imported successfully!');
        } catch (error) {
          alert('Error importing flow: ' + error.message);
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
      
      const result = await response.json();
      alert(`Test Result:\n${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      alert('Error testing flow: ' + error.message);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire flow?')) {
      clearFlow();
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">IVR Designer</h1>
        <input
          type="text"
          value={flowName}
          onChange={(e) => setFlowName(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Flow name"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleTest}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Play className="w-4 h-4" />
          Test
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        <button
          onClick={handleImport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
