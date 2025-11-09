import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain } from 'lucide-react';
import { getNodeColors } from '../../utils/nodeColors';

const FindIntentNode = ({ data, selected }) => {
  const colors = getNodeColors('findIntent');
  const outputHandles = data.intents || ['default'];
  
  return (
    <div
      className={`
        px-4 py-3 shadow-lg rounded-lg border-2 min-w-[220px] transition-all duration-200
        ${selected ? 
          `${colors.borderSelected} ${colors.bgSelected} shadow-xl` : 
          `${colors.border} ${colors.bg} shadow-md`
        }
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1 rounded ${selected ? 'bg-white' : 'bg-white/70'}`}>
          <Brain className="w-5 h-5" style={{ color: colors.icon }} />
        </div>
        <div className="font-bold text-sm text-gray-800">AI Intent</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {data.prompt ? (
          <div className="italic bg-white/50 p-2 rounded">
            "{data.prompt.substring(0, 40)}..."
          </div>
        ) : (
          <div className="text-gray-400 bg-white/30 p-2 rounded">No prompt configured</div>
        )}
      </div>
      
      <div className="mt-3 space-y-1">
        {outputHandles.map((intent, index) => (
          <div key={intent} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 bg-white/30 px-2 py-1 rounded">{intent}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={intent}
              className="w-3 h-3"
              style={{ top: `${50 + (index - outputHandles.length / 2 + 0.5) * 25}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(FindIntentNode);
