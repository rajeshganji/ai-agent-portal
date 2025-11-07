import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

const StartNode = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-gradient-to-br from-green-50 to-green-100 min-w-[200px] ${
        selected ? 'border-green-600' : 'border-green-400'
      }`}
    >
      {/* No input handle - this is the entry point */}
      
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-green-500 rounded-full">
          <Play className="w-5 h-5 text-white fill-white" />
        </div>
        <div className="font-bold text-lg text-green-800">Start</div>
      </div>
      
      <div className="text-xs text-green-700 mb-3">
        Entry point for the IVR flow
      </div>
      
      {/* Two output handles */}
      <div className="flex justify-between items-center pt-2 border-t border-green-300">
        <div className="flex flex-col items-center">
          <span className="text-xs text-green-700 mb-1">Next</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="next"
            className="w-3 h-3 bg-green-500"
            style={{ left: '30%' }}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-red-700 mb-1">Disconnect</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="disconnect"
            className="w-3 h-3 bg-red-500"
            style={{ left: '70%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(StartNode);
