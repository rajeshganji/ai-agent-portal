import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FlowsList from './components/FlowsList';
import Designer from './components/Designer';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FlowsList />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="/designer/:flowId" element={<Designer />} />
      </Routes>
    </Router>
  );
}

export default App;
