import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare } from 'lucide-react';

const PlayTextNode = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[200px] ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <div className="font-bold text-sm">Play Text</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {data.text ? (
          <div className="italic">"{data.text.substring(0, 50)}{data.text.length > 50 ? '...' : ''}"</div>
        ) : (
          <div className="text-gray-400">No text configured</div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default memo(PlayTextNode);
