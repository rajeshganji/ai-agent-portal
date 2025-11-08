import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlowStore } from '../store/flowStore';
import Toolbar from './Toolbar';
import NodePalette from './NodePalette';
import FlowCanvas from './FlowCanvas';
import NodeProperties from './NodeProperties';
import { ArrowLeft, Save, Loader } from 'lucide-react';

function Designer() {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const { 
    flowName, 
    flowId: currentFlowId, 
    loadFlow, 
    clearFlow, 
    getFlowJSON,
    setFlowId 
  } = useFlowStore();

  const loadExistingFlow = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/ivr/designer/flows/${id}`);
      if (!response.ok) {
        throw new Error('Flow not found');
      }
      
      const flow = await response.json();
      loadFlow(flow);
      console.log('Flow loaded:', flow);
    } catch (err) {
      setError(err.message);
      console.error('Error loading flow:', err);
    } finally {
      setLoading(false);
    }
  }, [loadFlow]);

  useEffect(() => {
    if (flowId) {
      loadExistingFlow(flowId);
    } else {
      // New flow
      clearFlow();
    }
  }, [flowId, loadExistingFlow, clearFlow]);

  const handleSaveFlow = async () => {
    try {
      setSaving(true);
      const flowData = getFlowJSON();
      
      console.log('🔄 [Designer] Saving flow:', {
        currentFlowId,
        flowName: flowData.name,
        nodeCount: flowData.nodes?.length || 0,
        edgeCount: flowData.edges?.length || 0
      });
      
      let response;
      let url;
      
      if (currentFlowId) {
        // Update existing flow
        url = `/api/ivr/designer/flows/${currentFlowId}`;
        console.log('📝 [Designer] Updating existing flow:', currentFlowId);
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(flowData)
        });
      } else {
        // Create new flow
        url = '/api/ivr/designer/flows';
        console.log('🆕 [Designer] Creating new flow');
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(flowData)
        });
      }
      
      console.log('🌐 [Designer] API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Designer] Save failed:', response.status, errorText);
        throw new Error(`Failed to save flow: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ [Designer] Save successful:', result);
      
      if (!currentFlowId && result.id) {
        // Set the new flow ID for future saves
        console.log('🆔 [Designer] Setting new flow ID:', result.id);
        setFlowId(result.id);
        // Update URL to include the flow ID - FIXED PATH
        const newPath = `/designer/${result.id}`;
        console.log('🔄 [Designer] Navigating to:', newPath);
        navigate(newPath, { replace: true });
      }
      
      console.log('Flow saved successfully:', result);
      
      // Show success feedback
      const saveButton = document.querySelector('#save-button');
      if (saveButton) {
        const originalContent = saveButton.innerHTML;
        saveButton.innerHTML = '<span class="flex items-center space-x-2"><svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg><span>Saved!</span></span>';
        setTimeout(() => {
          saveButton.innerHTML = originalContent;
        }, 2000);
      }
      
    } catch (err) {
      alert('Error saving flow: ' + err.message);
      console.error('Error saving flow:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBackToFlows = () => {
    console.log('🔙 [Designer] Navigating back to flows list');
    navigate('/flows');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center gradient-bg-1 animated-bg">
        <div className="glass-card p-8 rounded-2xl flex items-center space-x-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <span className="text-white">Loading flow...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center gradient-bg-1 animated-bg">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="text-red-400 mb-4 text-4xl">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">Error Loading Flow</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={handleBackToFlows}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all"
            >
              Back to Flows
            </button>
            <button
              onClick={() => loadExistingFlow(flowId)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col gradient-bg-1 animated-bg">
      {/* Enhanced Toolbar with Save and Back buttons */}
      <div className="flex items-center justify-between p-4 glass-header border-b border-white/20">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToFlows}
            className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Flows</span>
          </button>
          <div className="text-white">
            <h1 className="text-lg font-bold">
              {flowName}
            </h1>
            <p className="text-sm text-gray-300">
              {currentFlowId ? (
                <span className="flex items-center gap-2">
                  <span>Flow ID: <span className="font-mono bg-white/10 px-2 py-1 rounded">{currentFlowId}</span></span>
                  <span className="text-xs text-green-300">✓ Saved</span>
                </span>
              ) : (
                <span className="text-yellow-300">⚠️ Unsaved Flow</span>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              URL: {window.location.pathname}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Toolbar />
          <button
            id="save-button"
            onClick={handleSaveFlow}
            disabled={saving}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Flow</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Main Designer Interface */}
      <div className="flex-1 flex overflow-hidden">
        <NodePalette />
        <FlowCanvas />
        <NodeProperties />
      </div>
    </div>
  );
}

export default Designer;