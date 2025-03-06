import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useNotes } from '../context/NotesContext';

const NotesListContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NotesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const NotesTitle = styled.h2`
  margin: 0;
  color: #2c3e50;
`;

const NotesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const NoteCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  height: 200px;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const NoteTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
`;

const NoteContent = styled.p`
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  flex: 1;
`;

const NoteDate = styled.div`
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #95a5a6;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EmptyStateTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c3e50;
`;

const EmptyStateText = styled.p`
  margin: 0 0 1.5rem 0;
  color: #7f8c8d;
`;

const EmptyStateButton = styled.button`
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #219653;
  }
`;

const NotesList = () => {
  const { notes, loading } = useNotes();
  const navigate = useNavigate();
  
  // Ensure notes is an array
  const notesArray = Array.isArray(notes) ? notes : [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div>Loading notes...</div>;
  }

  if (!notesArray.length) {
    return (
      <EmptyState>
        <EmptyStateTitle>No Notes Yet</EmptyStateTitle>
        <EmptyStateText>Create your first note to get started</EmptyStateText>
        <EmptyStateButton onClick={() => navigate('/new')}>
          Create Note
        </EmptyStateButton>
      </EmptyState>
    );
  }

  return (
    <NotesListContainer>
      <NotesHeader>
        <NotesTitle>Your Notes</NotesTitle>
      </NotesHeader>
      <NotesGrid>
        {notesArray.map(note => (
          <NoteCard 
            key={note.id} 
            onClick={() => navigate(`/note/${note.id}`)}
          >
            <NoteTitle>{note.title}</NoteTitle>
            <NoteContent>{note.content}</NoteContent>
            <NoteDate>{formatDate(note.updated_at || note.created_at)}</NoteDate>
          </NoteCard>
        ))}
      </NotesGrid>
    </NotesListContainer>
  );
};

export default NotesList; 