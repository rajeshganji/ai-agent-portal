import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain } from 'lucide-react';

const FindIntentNode = ({ data, selected }) => {
  const outputHandles = data.intents || ['default'];
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[220px] ${
        selected ? 'border-green-500' : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-5 h-5 text-green-600" />
        <div className="font-bold text-sm">Find Intent</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {data.prompt ? (
          <div className="italic">"{data.prompt.substring(0, 40)}..."</div>
        ) : (
          <div className="text-gray-400">No prompt configured</div>
        )}
      </div>
      
      <div className="mt-3 space-y-1">
        {outputHandles.map((intent, index) => (
          <div key={intent} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{intent}</span>
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
