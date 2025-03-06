import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useNotes } from '../context/NotesContext';
import { getSuggestions } from '../api/notesApi';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const EditorTitle = styled.h2`
  margin: 0;
  color: #2c3e50;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  background-color: ${props => props.primary ? '#3498db' : '#e0e0e0'};
  color: ${props => props.primary ? 'white' : '#333'};
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.primary ? '#2980b9' : '#d0d0d0'};
  }
`;

const DeleteButton = styled(Button)`
  background-color: #e74c3c;
  color: white;

  &:hover {
    background-color: #c0392b;
  }
`;

const EditorForm = styled.form`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 1rem;
`;

const TitleInput = styled.input`
  padding: 0.75rem;
  font-size: 1.2rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
`;

const ContentTextarea = styled.textarea`
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
  min-height: 300px;
  resize: none;
  line-height: 1.5;
`;

const SuggestionsContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #3498db;
`;

const SuggestionsTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #2c3e50;
`;

const SuggestionsList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
`;

const SuggestionItem = styled.li`
  margin-bottom: 0.5rem;
  cursor: pointer;
  color: #3498db;

  &:hover {
    text-decoration: underline;
  }
`;

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getNote, addNote, editNote, removeNote } = useNotes();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const isNewNote = id === undefined;

  useEffect(() => {
    if (!isNewNote) {
      const note = getNote(parseInt(id));
      if (note) {
        setTitle(note.title);
        setContent(note.content);
      } else {
        navigate('/');
      }
    }
  }, [id, getNote, navigate, isNewNote]);

  const handleContentChange = async (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // get suggestions if content  has more than 50 characters
    // TODO should not hardcode
    if (newContent.length > 50 && !suggestionsLoading) {
      try {
        setSuggestionsLoading(true);
        const response = await getSuggestions(newContent);
        setSuggestions(response.suggestions);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setContent(content + '\\n\\n' + suggestion);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a title for your note');
      return;
    }
    
    try {
      setLoading(true);
      
      const noteData = {
        title,
        content
      };
      
      if (isNewNote) {
        await addNote(noteData);
      } else {
        await editNote(parseInt(id), noteData);
      }
      
      navigate('/');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        setLoading(true);
        await removeNote(parseInt(id));
        navigate('/');
      } catch (error) {
        console.error('Error deleting note:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>{isNewNote ? 'Create New Note' : 'Edit Note'}</EditorTitle>
        <ButtonGroup>
          {!isNewNote && (
            <DeleteButton onClick={handleDelete} disabled={loading}>
              Delete
            </DeleteButton>
          )}
          <Button onClick={() => navigate('/')}>Cancel</Button>
          <Button primary onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </ButtonGroup>
      </EditorHeader>
      
      <EditorForm onSubmit={handleSubmit}>
        <TitleInput
          type="text"
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        <ContentTextarea
          placeholder="Write your note here..."
          value={content}
          onChange={handleContentChange}
        />
      </EditorForm>
      
      {suggestions.length > 0 && (
        <SuggestionsContainer>
          <SuggestionsTitle>AI Suggestions:</SuggestionsTitle>
          <SuggestionsList>
            {suggestions.map((suggestion, index) => (
              <SuggestionItem 
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </SuggestionItem>
            ))}
          </SuggestionsList>
        </SuggestionsContainer>
      )}
    </EditorContainer>
  );
};

export default NoteEditor; 