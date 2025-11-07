import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Volume2 } from 'lucide-react';

const PlayAudioNode = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[200px] ${
        selected ? 'border-purple-500' : 'border-gray-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="w-5 h-5 text-purple-600" />
        <div className="font-bold text-sm">Play Audio</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {data.audioUrl ? (
          <div className="italic truncate">{data.audioUrl}</div>
        ) : (
          <div className="text-gray-400">No audio URL configured</div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default memo(PlayAudioNode);
