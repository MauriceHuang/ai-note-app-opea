import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useNotes } from '../context/NotesContext';

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const SearchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SearchTitle = styled.h2`
  margin: 0;
  color: #2c3e50;
`;

const ResultCount = styled.span`
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ResultCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`;

const ResultTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
`;

const ResultContent = styled.p`
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
`;

const ResultScore = styled.div`
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #95a5a6;
`;

const NoResults = styled.div`
  text-align: center;
  padding: 3rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const NoResultsTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #2c3e50;
`;

const NoResultsText = styled.p`
  margin: 0;
  color: #7f8c8d;
`;

const SearchResults = () => {
  const { searchResults, loading } = useNotes();
  const navigate = useNavigate();

  if (loading) {
    return <div>Searching...</div>;
  }

  if (searchResults.length === 0) {
    return (
      <NoResults>
        <NoResultsTitle>No Results Found</NoResultsTitle>
        <NoResultsText>Try a different search term or create a new note</NoResultsText>
      </NoResults>
    );
  }

  // Function to highlight the search term in the content
  const truncateContent = (content) => {
    if (content.length > 200) {
      return content.substring(0, 200) + '...';
    }
    return content;
  };

  return (
    <SearchContainer>
      <SearchHeader>
        <SearchTitle>Search Results</SearchTitle>
        <ResultCount>{searchResults.length} results found</ResultCount>
      </SearchHeader>
      <ResultsList>
        {searchResults.map(result => (
          <ResultCard 
            key={result.id} 
            onClick={() => navigate(`/note/${result.id}`)}
          >
            <ResultTitle>{result.title}</ResultTitle>
            <ResultContent>{truncateContent(result.content)}</ResultContent>
            {result.score && (
              <ResultScore>Relevance: {Math.round(result.score * 100)}%</ResultScore>
            )}
          </ResultCard>
        ))}
      </ResultsList>
    </SearchContainer>
  );
};

export default SearchResults; 