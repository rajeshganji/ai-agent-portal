import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';
import { getNodeColors } from '../../utils/nodeColors';

const ConditionalNode = ({ data, selected }) => {
  const colors = getNodeColors('conditional');
  
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
          <GitBranch className={`w-5 h-5 ${colors.iconClass}`} />
        </div>
        <div className="font-bold text-sm text-gray-800">Conditional</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {data.condition ? (
          <div className="italic bg-white/50 p-2 rounded">{data.condition}</div>
        ) : (
          <div className="text-gray-400 bg-white/30 p-2 rounded">No condition configured</div>
        )}
      </div>
      
      <div className="mt-3 flex justify-between">
        <div className="text-xs text-gray-600 bg-green-100 px-2 py-1 rounded">
          True
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3"
            style={{ left: '25%' }}
          />
        </div>
        <div className="text-xs text-gray-600 bg-red-100 px-2 py-1 rounded">
          False
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3"
            style={{ left: '75%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ConditionalNode);
