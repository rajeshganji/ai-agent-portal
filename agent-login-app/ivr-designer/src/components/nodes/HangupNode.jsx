import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { PhoneOff } from 'lucide-react';
import { getNodeColors } from '../../utils/nodeColors';

const HangupNode = ({ data, selected }) => {
  const colors = getNodeColors('hangup');
  
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
          <PhoneOff className="w-5 h-5" style={{ color: colors.icon }} />
        </div>
        <div className="font-bold text-sm text-gray-800">Hang Up</div>
      </div>
      
      <div className="text-xs text-gray-600 mt-1">
        {data.message ? (
          <div className="bg-white/50 p-2 rounded">
            💬 "{data.message}"
          </div>
        ) : (
          <div className="text-gray-400 bg-white/30 p-2 rounded">End call gracefully</div>
        )}
      </div>
      
      <div className="text-xs mt-2">
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
          🔚 End of Flow
        </span>
      </div>
      
      {/* No outgoing handle - hangup ends the call */}
    </div>
  );
};

export default memo(HangupNode);