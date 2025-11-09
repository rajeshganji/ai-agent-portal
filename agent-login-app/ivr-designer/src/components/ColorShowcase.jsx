import { NODE_COLORS } from '../utils/nodeColors';

const ColorShowcase = () => {
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50">
      <div className="text-xs font-semibold mb-2 text-gray-800">Node Colors</div>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(NODE_COLORS).map(([nodeType, colors]) => (
          <div key={nodeType} className="text-center">
            <div 
              className={`w-6 h-6 rounded ${colors.bg} border-2 ${colors.border} mx-auto mb-1`}
              title={nodeType}
            >
              <div className={`w-full h-full ${colors.iconClass} flex items-center justify-center`}>
                •
              </div>
            </div>
            <div className="text-xs text-gray-600 capitalize">{nodeType}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorShowcase;