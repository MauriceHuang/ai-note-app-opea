import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useNotes } from '../context/NotesContext';
import { askQuestion } from '../api/notesApi';

const SidebarContainer = styled.div`
  width: 250px;
  background-color: #34495e;
  color: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const SidebarSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SidebarTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #ecf0f1;
`;

const NavItem = styled.div`
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2c3e50;
  }
`;

const AskContainer = styled.div`
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #4a6278;
`;

const QuestionInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background-color: #2c3e50;
  color: white;

  &::placeholder {
    color: #95a5a6;
  }
`;

const AskButton = styled.button`
  width: 100%;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2980b9;
  }
`;

const AnswerContainer = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #2c3e50;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const Sidebar = () => {
  const { notes } = useNotes();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const recentNotes = Array.isArray(notes) ? notes.slice(0, 5) : [];

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    try {
      setLoading(true);
      const response = await askQuestion(question);
      setAnswer(response.answer);
    } catch (error) {
      setAnswer('Sorry, I could not answer that question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarContainer>
      <SidebarSection>
        <SidebarTitle>Recent Notes</SidebarTitle>
        {recentNotes.length > 0 ? (
          recentNotes.map(note => (
            <NavItem 
              key={note.id} 
              onClick={() => navigate(`/note/${note.id}`)}
            >
              {note.title}
            </NavItem>
          ))
        ) : (
          <div>No notes yet</div>
        )}
      </SidebarSection>

      <AskContainer>
        <SidebarTitle>Ask about your notes</SidebarTitle>
        <QuestionInput
          type="text"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
        />
        <AskButton onClick={handleAskQuestion} disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </AskButton>
        
        {answer && (
          <AnswerContainer>
            {answer}
          </AnswerContainer>
        )}
      </AskContainer>
    </SidebarContainer>
  );
};

export default Sidebar; 