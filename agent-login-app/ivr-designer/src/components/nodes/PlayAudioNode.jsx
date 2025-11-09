import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Volume2 } from 'lucide-react';
import { getNodeColors } from '../../utils/nodeColors';

const PlayAudioNode = ({ data, selected }) => {
  const colors = getNodeColors('playAudio');
  
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
          <Volume2 className="w-5 h-5" style={{ color: colors.icon }} />
        </div>
        <div className="font-bold text-sm text-gray-800">Play Audio</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {data.audioUrl ? (
          <div className="italic truncate bg-white/50 p-2 rounded">{data.audioUrl}</div>
        ) : (
          <div className="text-gray-400 bg-white/30 p-2 rounded">No audio URL configured</div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default memo(PlayAudioNode);
