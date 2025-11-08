import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar, Boxes } from 'lucide-react';

function FlowsList() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setLoading(true);
      console.log('Loading flows from API...');
      const response = await fetch('/api/ivr/designer/flows');
      console.log('API Response status:', response.status);
      
      if (!response.ok) throw new Error('Failed to load flows');
      
      const data = await response.json();
      console.log('API Response data:', data);
      setFlows(data.flows || []);
      setError(null);
    } catch (err) {
      console.error('Error loading flows:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewFlow = () => {
    // Navigate to designer with new flow
    navigate('/designer');
  };

  const handleEditFlow = (flowId) => {
    // Navigate to designer with existing flow ID
    navigate(`/designer/${flowId}`);
  };

  const handleDeleteFlow = async (flowId, flowName) => {
    if (!window.confirm(`Are you sure you want to delete "${flowName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ivr/designer/flows/${flowId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete flow');
      
      // Reload flows list
      loadFlows();
    } catch (err) {
      alert('Error deleting flow: ' + err.message);
      console.error('Error deleting flow:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg-1 animated-bg flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4 text-center">Loading flows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg-1 animated-bg flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">Error Loading Flows</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={loadFlows}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-1 animated-bg">
      {/* Header */}
      <div className="glass-header sticky top-0 z-50 backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Boxes className="text-white w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold text-white">IVR Flow Designer</h1>
                <p className="text-gray-300 text-sm">Manage your conversation flows</p>
              </div>
            </div>
            <button
              onClick={handleNewFlow}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">New Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Debug Information */}
        <div className="text-white text-sm mb-4 p-4 bg-black bg-opacity-50 rounded">
          <p>Debug: Loading={loading.toString()}, Error={error || 'none'}, FlowsCount={flows.length}</p>
        </div>
        
        {flows.length === 0 ? (
          <div className="text-center py-16">
            <div className="glass-card p-12 rounded-2xl max-w-md mx-auto" style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Boxes className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No Flows Yet</h2>
              <p className="text-gray-300 mb-6">
                Create your first IVR flow to get started designing conversation experiences.
              </p>
              <button
                onClick={handleNewFlow}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create First Flow</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => (
              <div key={flow.id} className="glass-card rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300">
                {/* Flow Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-white truncate flex-1 mr-3">
                      {flow.name}
                    </h3>
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditFlow(flow.id)}
                        className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all"
                        title="Edit Flow"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFlow(flow.id, flow.name)}
                        className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Delete Flow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Flow Stats */}
                  <div className="flex items-center text-sm text-gray-300 space-x-4">
                    <div className="flex items-center space-x-1">
                      <Boxes className="w-4 h-4" />
                      <span>{flow.nodeCount} nodes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(flow.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Flow Actions */}
                <div className="p-6">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEditFlow(flow.id)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement preview/test functionality
                        alert('Preview functionality coming soon!');
                      }}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                      title="Preview Flow"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-gray-400 text-xs mt-3">
                    Created: {formatDate(flow.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FlowsList;