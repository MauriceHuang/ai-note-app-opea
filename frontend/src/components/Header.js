import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useNotes } from '../context/NotesContext';

const HeaderContainer = styled.header`
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
`;

const SearchContainer = styled.div`
  display: flex;
  flex: 1;
  max-width: 500px;
  margin: 0 2rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px 0 0 4px;
  font-size: 1rem;
`;

const SearchButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2980b9;
  }
`;

const NewNoteButton = styled.button`
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #219653;
  }
`;

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { search } = useNotes();
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await search(searchQuery);
      navigate('/search');
    }
  };

  const handleNewNote = () => {
    navigate('/new');
  };

  return (
    <HeaderContainer>
      <Logo onClick={() => navigate('/')}>AI Notes</Logo>
      <SearchContainer>
        <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
          <SearchInput
            type="text"
            placeholder="Search your notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchButton type="submit">Search</SearchButton>
        </form>
      </SearchContainer>
      <NewNoteButton onClick={handleNewNote}>New Note</NewNoteButton>
    </HeaderContainer>
  );
};

export default Header; 