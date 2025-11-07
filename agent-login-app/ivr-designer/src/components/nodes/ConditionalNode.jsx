import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { GitBranch } from 'lucide-react';

const ConditionalNode = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[200px] ${
        selected ? 'border-orange-500' : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-5 h-5 text-orange-600" />
        <div className="font-bold text-sm">Conditional</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {data.condition ? (
          <div className="italic">{data.condition}</div>
        ) : (
          <div className="text-gray-400">No condition configured</div>
        )}
      </div>
      
      <div className="mt-3 flex justify-between">
        <div className="text-xs text-gray-600">
          True
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3"
            style={{ left: '25%' }}
          />
        </div>
        <div className="text-xs text-gray-600">
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
