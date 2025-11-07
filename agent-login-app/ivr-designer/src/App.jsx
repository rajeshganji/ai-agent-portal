import Toolbar from './components/Toolbar';
import NodePalette from './components/NodePalette';
import FlowCanvas from './components/FlowCanvas';
import NodeProperties from './components/NodeProperties';

function App() {
  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <NodePalette />
        <FlowCanvas />
        <NodeProperties />
      </div>
    </div>
  );
}

export default App;
