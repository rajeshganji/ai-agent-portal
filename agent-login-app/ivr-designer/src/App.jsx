import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FlowsList from './components/FlowsList';
import Designer from './components/Designer';
import TestPage from './components/TestPage';
import './App.css';

function App() {
  return (
    <Router basename="/ivr-designer">
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/flows" element={<FlowsList />} />
        <Route path="/designer" element={<Designer />} />
        <Route path="/designer/:flowId" element={<Designer />} />
      </Routes>
    </Router>
  );
}

export default App;
