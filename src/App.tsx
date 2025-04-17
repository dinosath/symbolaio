import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SchemaListPage from './pages/SchemaListPage';
import SchemaEditorPage from './pages/SchemaEditorPage';
import NotFound from './pages/notFound';
import Tasks from './pages/tasks';

const App: React.FC = () => {
    return (
      <Router>
      <Routes>
          <Route path="/" element={<SchemaListPage />} />
          <Route path="/models/:id" element={<SchemaEditorPage />} />
          <Route path="/models/new" element={<SchemaEditorPage />} />
          <Route path="*" element={<NotFound />} />
      </Routes>
  </Router>
);
};

export default App;