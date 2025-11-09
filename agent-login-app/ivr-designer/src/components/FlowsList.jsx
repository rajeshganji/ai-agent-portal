import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar, Boxes, Search, Filter, ArrowUpDown, MoreVertical } from 'lucide-react';

function FlowsList() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredFlows = flows.filter(flow => 
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flow.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-700 mt-4 text-center font-medium">Loading flows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-md">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <h2 className="text-gray-900 text-xl font-bold mb-2">Error Loading Flows</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadFlows}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #eff6ff 50%, #e0e7ff 100%)' }}>
      {/* Beautiful Colorful Header */}
      <div style={{ background: 'linear-gradient(90deg, #9333ea 0%, #2563eb 50%, #4338ca 100%)' }} className="shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                <Boxes className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">IVR Flow Designer</h1>
                <p className="text-purple-100 text-lg">Manage and create beautiful conversation flows</p>
              </div>
            </div>
            <button
              onClick={handleNewFlow}
              className="flex items-center space-x-3 text-white px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }}
            >
              <Plus className="w-6 h-6" />
              <span className="font-semibold text-lg">New Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {flows.length === 0 && !loading ? (
          /* Simple Empty State - Just the message */
          <div className="text-center py-32">
            <div className="p-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full w-32 h-32 mx-auto mb-8 flex items-center justify-center">
              <Boxes className="w-16 h-16 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-purple-600 mb-6">
              No Flows Yet
            </h2>
            <p className="text-gray-700 mb-10 text-lg leading-relaxed max-w-md mx-auto">
              Create your first IVR flow to get started designing amazing conversation experiences.
            </p>
            
            {/* Test page link */}
            <div className="mt-10 pt-8 border-t border-purple-200 max-w-md mx-auto">
              <a 
                href="/ivr-designer/test" 
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-lg group"
              >
                <span className="text-2xl mr-2">🧪</span>
                <span className="border-b-2 border-transparent group-hover:border-purple-600 transition-all">
                  Go to Test Page
                </span>
              </a>
            </div>
          </div>
        ) : (
          /* Flows Table */
          <div className="space-y-8">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search flows by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all text-lg"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-medium text-gray-700 px-4 py-2 rounded-lg" style={{ background: 'linear-gradient(90deg, #f3e8ff 0%, #eff6ff 100%)' }}>
                    {filteredFlows.length} of {flows.length} flows
                  </span>
                </div>
              </div>
            </div>

            {/* Professional Flows Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="px-8 py-6" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <h3 className="text-2xl font-bold text-gray-900">Flow Library</h3>
                <p className="text-gray-600 mt-2 text-lg">Manage your IVR conversation flows</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                    <tr>
                      <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Flow ID
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Flow Name
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Last Update
                      </th>
                      <th className="px-8 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredFlows.map((flow, index) => (
                      <tr key={flow.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-purple-50'} hover:bg-purple-100 transition-colors`}>
                        <td className="px-8 py-6">
                          <code className="text-sm font-mono text-purple-700 bg-purple-100 px-3 py-2 rounded-lg font-bold">
                            {flow.id}
                          </code>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-lg font-bold text-gray-900">{flow.name}</div>
                          <div className="text-sm text-gray-500 mt-1">{flow.nodeCount || 0} nodes</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-medium text-gray-900">{formatDateShort(flow.createdAt)}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-medium text-gray-900">{formatDateShort(flow.updatedAt)}</div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center space-x-3">
                            <button
                              onClick={() => handleEditFlow(flow.id)}
                              className="flex items-center space-x-2 text-white px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                              style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)' }}
                            >
                              <Edit className="w-4 h-4" />
                              <span className="font-medium">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteFlow(flow.id, flow.name)}
                              className="flex items-center space-x-2 text-white px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                              style={{ background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' }}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="font-medium">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredFlows.length === 0 && searchTerm && (
                <div className="text-center py-16 bg-purple-50">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No flows found</h3>
                  <p className="text-gray-600 text-lg">No flows match your search "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlowsList;