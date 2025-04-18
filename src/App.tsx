import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SchemaListPage from './pages/SchemaListPage';
import SchemaEditorPage from './pages/SchemaEditorPage';
import NotFound from './pages/notFound';

const App: React.FC = () => {
    return (
      <Router>
      <Routes>
          <Route path="/" element={<SchemaListPage />} />
          <Route path="/schemas/:artifactId" element={<SchemaEditorPage />} />
          <Route path="*" element={<NotFound />} />
      </Routes>
  </Router>
);
};

export default App;