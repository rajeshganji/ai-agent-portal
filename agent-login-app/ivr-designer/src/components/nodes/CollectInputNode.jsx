import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Keyboard } from 'lucide-react';
import { getNodeColors } from '../../utils/nodeColors';

const CollectInputNode = ({ data, selected }) => {
  const colors = getNodeColors('collectInput');
  
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
          <Keyboard className="w-5 h-5" style={{ color: colors.icon }} />
        </div>
        <div className="font-bold text-sm text-gray-800">Collect Input</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1 space-y-1">
        {data.prompt ? (
          <div className="bg-white/50 p-2 rounded">
            💬 "{data.prompt}"
          </div>
        ) : (
          <div className="text-gray-400 bg-white/30 p-2 rounded">No prompt configured</div>
        )}
        
        <div className="flex items-center gap-2 text-xs">
          {data.inputType && (
            <span className={`px-2 py-1 rounded font-bold ${
              data.inputType === 'dtmf' ? 'bg-blue-100 text-blue-800' :
              data.inputType === 'voice' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {data.inputType === 'dtmf' ? '🔢 DTMF' : 
               data.inputType === 'voice' ? '🎤 Voice' : 
               '🔤 Text'}
            </span>
          )}
          
          {data.maxLength && (
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
              Max: {data.maxLength}
            </span>
          )}
        </div>
      </div>
      
      {/* Input received output */}
      <div className="mt-3">
        <div className="text-xs text-gray-600 bg-indigo-100 px-2 py-1 rounded text-center">
          Input Received
          <Handle
            type="source"
            position={Position.Bottom}
            id="received"
            className="w-3 h-3"
            style={{ left: '50%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(CollectInputNode);