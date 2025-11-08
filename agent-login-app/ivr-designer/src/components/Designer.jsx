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
    nodes: storeNodes,
    edges: storeEdges,
    loadFlow, 
    clearFlow,
    createNewFlow,
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
    
    // 🛡️ SUPPRESS CHROME EXTENSION ERRORS - these are harmless
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (typeof message === 'string' && 
          (message.includes('postMessage') || 
           message.includes('chrome-extension') ||
           message.includes('target origin provided'))) {
        // Suppress Chrome extension postMessage errors - these are harmless
        return;
      }
      originalError.apply(console, args);
    };
    
    return () => {
      // Restore original console.error on cleanup
      console.error = originalError;
    };
  }, [flowId, loadExistingFlow, clearFlow]);

  const handleSaveFlow = async () => {
    // 🚨 FORCE MAXIMUM LOGGING - CANNOT BE MISSED
    console.log('');
    console.log('🚨🚨🚨🚨🚨 SAVE FLOW BUTTON CLICKED 🚨🚨🚨🚨🚨');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔘 Button element:', document.querySelector('#save-button'));
    console.log('🔘 Button disabled state:', document.querySelector('#save-button')?.disabled);
    console.log('🔘 Current saving state:', saving);
    console.log('');
    
    if (saving) {
      console.log('❌❌❌ ALREADY SAVING - BUTTON SHOULD BE DISABLED ❌❌❌');
      return;
    }
    
    try {
      setSaving(true);
      console.log('✅ Setting saving=true successful');
      
      // 🔍 STORE STATE DEEP INSPECTION
      console.log('📊📊📊 STORE STATE ANALYSIS 📊📊📊');
      console.log('• currentFlowId:', currentFlowId);
      console.log('• typeof currentFlowId:', typeof currentFlowId);
      console.log('• currentFlowId === null:', currentFlowId === null);
      console.log('• currentFlowId === undefined:', currentFlowId === undefined);
      console.log('• flowName:', flowName);
      console.log('• storeNodes length:', storeNodes?.length);
      console.log('• storeNodes type:', typeof storeNodes);
      console.log('• storeNodes array:', Array.isArray(storeNodes));
      console.log('• storeEdges length:', storeEdges?.length);
      console.log('• storeEdges type:', typeof storeEdges);
      console.log('• storeEdges array:', Array.isArray(storeEdges));
      console.log('');
      
      // 🎯 CALL getFlowJSON WITH ERROR CATCHING
      let flowData;
      try {
        console.log('🔄 Calling getFlowJSON()...');
        flowData = getFlowJSON();
        console.log('✅ getFlowJSON() returned successfully');
        console.log('🎯 Flow data type:', typeof flowData);
        console.log('🎯 Flow data keys:', Object.keys(flowData || {}));
      } catch (getFlowError) {
        console.error('❌❌❌ getFlowJSON() FAILED ❌❌❌');
        console.error('Error details:', getFlowError);
        console.error('Error stack:', getFlowError.stack);
        throw new Error(`getFlowJSON failed: ${getFlowError.message}`);
      }
      
      // 🔍 FLOW DATA DEEP ANALYSIS
      console.log('🔍🔍🔍 FLOW DATA ANALYSIS 🔍🔍🔍');
      console.log('• flowData.id:', flowData.id);
      console.log('• flowData.name:', flowData.name);
      console.log('• flowData.nodes length:', flowData.nodes?.length);
      console.log('• flowData.edges length:', flowData.edges?.length);
      console.log('• flowData.nodes type:', typeof flowData.nodes);
      console.log('• flowData.edges type:', typeof flowData.edges);
      console.log('• flowData.createdAt:', flowData.createdAt);
      console.log('• Full flowData:', JSON.stringify(flowData, null, 2));
      console.log('');
      
      // 🚨 FORCE ERROR IF NO NODES
      if (!flowData.nodes || flowData.nodes.length === 0) {
        console.warn('⚠️⚠️⚠️ WARNING: Empty flow being saved!');
        console.warn('This might be the root cause of save failure');
        // Don't throw error - let empty flows save for testing
      }
      
      // 🎯 VALIDATED DATA CREATION WITH ERROR CHECKING
      let validatedFlowData;
      try {
        validatedFlowData = {
          ...flowData,
          name: flowData.name || 'Untitled Flow',
          nodes: flowData.nodes || [],
          edges: flowData.edges || []
        };
        console.log('✅ Validated flow data created successfully');
        console.log('📄 Final payload size:', JSON.stringify(validatedFlowData).length, 'characters');
      } catch (validationError) {
        console.error('❌❌❌ VALIDATION FAILED ❌❌❌');
        console.error('Validation error:', validationError);
        throw new Error(`Flow validation failed: ${validationError.message}`);
      }
      
      // 🌐 API CALL WITH MAXIMUM ERROR DETECTION
      console.log('🌐🌐🌐 API CALL ATTEMPT 🌐🌐🌐');
      const isNewFlow = !currentFlowId || currentFlowId === null || currentFlowId === undefined;
      console.log('• Is new flow:', isNewFlow);
      console.log('• Will use POST:', isNewFlow);
      console.log('• Will use PUT:', !isNewFlow);
      
      let response;
      let url;
      let method;
      
      try {
        if (currentFlowId) {
          url = `/api/ivr/designer/flows/${currentFlowId}`;
          method = 'PUT';
          console.log('📝 UPDATE: URL =', url);
        } else {
          url = '/api/ivr/designer/flows';
          method = 'POST';
          console.log('🆕 CREATE: URL =', url);
        }
        
        console.log('� Making', method, 'request to:', url);
        console.log('� Request headers: Content-Type: application/json');
        console.log('📤 Request body preview:', JSON.stringify(validatedFlowData, null, 2).substring(0, 500) + '...');
        
        response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(validatedFlowData)
        });
        
        console.log('📥 Response received!');
        console.log('📥 Response status:', response.status);
        console.log('📥 Response statusText:', response.statusText);
        console.log('📥 Response ok:', response.ok);
        console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
        
      } catch (fetchError) {
        console.error('❌❌❌ FETCH REQUEST FAILED ❌❌❌');
        console.error('Fetch error type:', fetchError.constructor.name);
        console.error('Fetch error message:', fetchError.message);
        console.error('Fetch error stack:', fetchError.stack);
        console.error('URL attempted:', url);
        console.error('Method attempted:', method);
        throw new Error(`Network request failed: ${fetchError.message}`);
      }
      
      // 🔍 RESPONSE ANALYSIS
      if (!response.ok) {
        console.error('❌❌❌ API RESPONSE NOT OK ❌❌❌');
        console.error('Status:', response.status);
        console.error('Status text:', response.statusText);
        
        let errorText;
        try {
          errorText = await response.text();
          console.error('Error response body:', errorText);
        } catch (textError) {
          console.error('Could not read error response:', textError);
          errorText = 'Could not read error response';
        }
        
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
      
      // 🎯 SUCCESS RESPONSE PARSING
      let result;
      try {
        console.log('📄 Parsing JSON response...');
        result = await response.json();
        console.log('✅ JSON parsed successfully');
        console.log('🎉🎉🎉 API CALL SUCCESSFUL 🎉🎉🎉');
        console.log('� Full result:', JSON.stringify(result, null, 2));
      } catch (jsonError) {
        console.error('❌❌❌ JSON PARSING FAILED ❌❌❌');
        console.error('JSON error:', jsonError);
        const responseText = await response.text();
        console.error('Raw response:', responseText);
        throw new Error(`Invalid JSON response: ${jsonError.message}`);
      }
      
      // 🆔 ID EXTRACTION WITH ERROR CHECKING
      console.log('🆔🆔🆔 FLOW ID EXTRACTION 🆔🆔🆔');
      console.log('• result.id:', result.id);
      console.log('• result.flow:', result.flow);
      console.log('• result.flow?.id:', result.flow?.id);
      
      const newFlowId = result.id || result.flow?.id;
      console.log('• Extracted newFlowId:', newFlowId);
      console.log('• newFlowId type:', typeof newFlowId);
      
      if (!currentFlowId && newFlowId) {
        console.log('🔄 Setting new flow ID in store:', newFlowId);
        setFlowId(newFlowId);
        
        const newPath = `/designer/${newFlowId}`;
        console.log('🔄 Navigating to:', newPath);
        navigate(newPath, { replace: true });
        console.log('✅ Navigation completed');
      }
      
      console.log('🎊🎊� SAVE FLOW COMPLETED SUCCESSFULLY 🎊🎊🎊');
      console.log('');
      
      // 🎯 VISUAL SUCCESS FEEDBACK
      alert(`✅ Flow saved successfully!\nFlow ID: ${newFlowId || currentFlowId}\nNodes: ${flowData.nodes?.length || 0}`);
      
    } catch (err) {
      console.error('');
      console.error('💥💥💥💥💥 SAVE FLOW FAILED 💥💥💥💥💥');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Timestamp:', new Date().toISOString());
      console.error('');
      
      alert(`❌ SAVE FAILED!\n\nError: ${err.message}\n\nCheck console for full details.`);
    } finally {
      setSaving(false);
      console.log('✅ Reset saving=false');
    }
  };

  const handleBackToFlows = () => {
    console.log('🔙 [Designer] Navigating back to flows list');
    navigate('/flows');
  };

  const handleClearStorage = () => {
    if (window.confirm('🚨 CLEAR ALL STORAGE?\n\nThis will:\n• Clear the current flow\n• Reset all cached data\n• Create a fresh new flow\n\nThis cannot be undone!')) {
      console.log('🧹 [Designer] CLEARING ALL STORAGE AND CACHE');
      
      // Clear browser storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ [Designer] Browser storage cleared');
      } catch (e) {
        console.warn('⚠️ [Designer] Could not clear browser storage:', e);
      }
      
      // Create fresh new flow
      const newTempId = createNewFlow();
      console.log('🆕 [Designer] Created fresh flow with temp ID:', newTempId);
      
      // Navigate to new flow path
      const newPath = '/designer';
      console.log('🔄 [Designer] Navigating to fresh designer:', newPath);
      navigate(newPath, { replace: true });
      
      // Reload page to ensure clean state
      setTimeout(() => {
        console.log('🔄 [Designer] Reloading page for clean state');
        window.location.reload();
      }, 500);
    }
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
          
          {/* 🧹 CLEAR STORAGE BUTTON */}
          <button
            onClick={handleClearStorage}
            className="flex items-center space-x-2 bg-red-500/20 text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/30 border border-red-400/30 transition-all"
            title="Clear all storage and create fresh flow"
          >
            <span className="text-sm">🧹</span>
            <span className="text-xs">Clear Storage</span>
          </button>
          
          {/* Debug info display */}
          <div className="text-xs bg-black/30 p-2 rounded text-white">
            <div>FlowId: {currentFlowId || 'NEW'}</div>
            <div>Nodes: {storeNodes?.length || 0}</div>
            <div>Edges: {storeEdges?.length || 0}</div>
          </div>
          
          <button
            id="save-button"
            onClick={() => {
              console.log('🚨 [Designer] SAVE BUTTON CLICKED! Event fired');
              console.log('🚨 [Designer] Current saving state:', saving);
              handleSaveFlow();
            }}
            disabled={saving}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: '120px' }}
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