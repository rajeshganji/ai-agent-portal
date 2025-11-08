import Toolbar from './components/Toolbar';
import NodePalette from './components/NodePalette';
import FlowCanvas from './components/FlowCanvas';
import NodeProperties from './components/NodeProperties';
import './App.css';

function App() {
  return (
    <div className="h-screen flex flex-col gradient-bg-1 animated-bg">
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
