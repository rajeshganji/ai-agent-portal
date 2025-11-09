// 🎨 Industry-standard colors for IVR/Telecom nodes
// These colors match the palette and maintain consistency across canvas nodes

export const NODE_COLORS = {
  playText: {
    icon: '#3B82F6',      // Blue - Communication
    iconClass: 'text-blue-500',
    border: 'border-blue-400',
    borderSelected: 'border-blue-600',
    bg: 'bg-blue-500',
    bgSelected: 'bg-blue-600'
  },
  playAudio: {
    icon: '#8B5CF6',      // Purple - Media/Audio
    iconClass: 'text-purple-500',
    border: 'border-purple-400',
    borderSelected: 'border-purple-600',
    bg: 'bg-purple-500',
    bgSelected: 'bg-purple-600'
  },
  findIntent: {
    icon: '#10B981',      // Green - AI/Intelligence
    iconClass: 'text-green-500',
    border: 'border-green-400',
    borderSelected: 'border-green-600',
    bg: 'bg-green-500',
    bgSelected: 'bg-green-600'
  },
  conditional: {
    icon: '#F59E0B',      // Amber - Logic/Branching
    iconClass: 'text-amber-500',
    border: 'border-amber-400',
    borderSelected: 'border-amber-600',
    bg: 'bg-amber-500',
    bgSelected: 'bg-amber-600'
  },
  transfer: {
    icon: '#06B6D4',      // Cyan - Call Transfer
    iconClass: 'text-cyan-500',
    border: 'border-cyan-400',
    borderSelected: 'border-cyan-600',
    bg: 'bg-cyan-500',
    bgSelected: 'bg-cyan-600'
  },
  hangup: {
    icon: '#EF4444',      // Red - End Call
    iconClass: 'text-red-500',
    border: 'border-red-400',
    borderSelected: 'border-red-600',
    bg: 'bg-red-500',
    bgSelected: 'bg-red-600'
  },
  webhook: {
    icon: '#EC4899',      // Pink - API/Integration
    iconClass: 'text-pink-500',
    border: 'border-pink-400',
    borderSelected: 'border-pink-600',
    bg: 'bg-pink-500',
    bgSelected: 'bg-pink-600'
  },
  collectInput: {
    icon: '#6366F1',      // Indigo - User Input
    iconClass: 'text-indigo-500',
    border: 'border-indigo-400',
    borderSelected: 'border-indigo-600',
    bg: 'bg-indigo-500',
    bgSelected: 'bg-indigo-600'
  },
  // Default for unknown node types
  default: {
    icon: '#6B7280',      // Gray
    iconClass: 'text-gray-500',
    border: 'border-gray-400',
    borderSelected: 'border-gray-600',
    bg: 'bg-gray-100',
    bgSelected: 'bg-gray-200'
  }
};

export const getNodeColors = (nodeType) => {
  return NODE_COLORS[nodeType] || NODE_COLORS.default;
};