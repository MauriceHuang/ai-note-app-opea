import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import SearchResults from './components/SearchResults';
import { NotesProvider } from './context/NotesContext';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

function App() {
  return (
    <NotesProvider>
      <Router>
        <AppContainer>
          <Header />
          <MainContent>
            <Sidebar />
            <ContentArea>
              <Routes>
                <Route path="/" element={<NotesList />} />
                <Route path="/note/:id" element={<NoteEditor />} />
                <Route path="/new" element={<NoteEditor />} />
                <Route path="/search" element={<SearchResults />} />
              </Routes>
            </ContentArea>
          </MainContent>
        </AppContainer>
      </Router>
    </NotesProvider>
  );
}

export default App; 