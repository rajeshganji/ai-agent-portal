import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap } from 'lucide-react';
import { getNodeColors } from '../../utils/nodeColors';

const WebhookNode = ({ data, selected }) => {
  const colors = getNodeColors('webhook');
  
  return (
    <div
      className={`
        px-4 py-3 shadow-lg rounded-lg border-2 min-w-[200px] transition-all duration-200
        ${selected ? 
          `${colors.borderSelected} ${colors.bgSelected} shadow-xl` : 
          `${colors.border} ${colors.bg} shadow-md`
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1 rounded ${selected ? 'bg-white' : 'bg-white/70'}`}>
          <Zap className="w-5 h-5" style={{ color: colors.icon }} />
        </div>
        <div className="font-bold text-sm text-gray-800">API Call</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1 space-y-1">
        {data.url ? (
          <div className="bg-white/50 p-2 rounded">
            🌐 <span className="font-mono text-xs">{data.url}</span>
          </div>
        ) : (
          <div className="text-gray-400 bg-white/30 p-2 rounded">No URL configured</div>
        )}
        
        {data.method && (
          <div className="flex items-center gap-1">
            <span className={`text-xs px-2 py-1 rounded font-bold ${
              data.method === 'POST' ? 'bg-green-100 text-green-800' :
              data.method === 'GET' ? 'bg-blue-100 text-blue-800' :
              data.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {data.method}
            </span>
          </div>
        )}
      </div>
      
      {/* Success/Error output handles */}
      <div className="mt-3 flex justify-between">
        <div className="text-xs text-gray-600 bg-green-100 px-2 py-1 rounded">
          Success
          <Handle
            type="source"
            position={Position.Bottom}
            id="success"
            className="w-3 h-3"
            style={{ left: '25%' }}
          />
        </div>
        <div className="text-xs text-gray-600 bg-red-100 px-2 py-1 rounded">
          Error
          <Handle
            type="source"
            position={Position.Bottom}
            id="error"
            className="w-3 h-3"
            style={{ left: '75%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(WebhookNode);