import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchNotes, createNote, updateNote, deleteNote, searchNotes } from '../api/notesApi';

const NotesContext = createContext();

export const useNotes = () => useContext(NotesContext);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const data = await fetchNotes();
        setNotes(data);
        setError(null);
      } catch (err) {
        setError('Failed to load notes. Please try again later.');
        console.error('Error loading notes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, []);

  const addNote = async (noteData) => {
    try {
      setLoading(true);
      const newNote = await createNote(noteData);
      setNotes([...notes, newNote]);
      return newNote;
    } catch (err) {
      setError('Failed to create note. Please try again.');
      console.error('Error creating note:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editNote = async (id, noteData) => {
    try {
      setLoading(true);
      const updatedNote = await updateNote(id, noteData);
      setNotes(notes.map(note => note.id === id ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      setError('Failed to update note. Please try again.');
      console.error('Error updating note:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeNote = async (id) => {
    try {
      setLoading(true);
      await deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
    } catch (err) {
      setError('Failed to delete note. Please try again.');
      console.error('Error deleting note:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const search = async (query) => {
    try {
      setLoading(true);
      const results = await searchNotes(query);
      setSearchResults(results);
      return results;
    } catch (err) {
      setError('Failed to search notes. Please try again.');
      console.error('Error searching notes:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getNote = (id) => {
    return notes.find(note => note.id === id) || null;
  };

  const value = {
    notes,
    loading,
    error,
    searchResults,
    addNote,
    editNote,
    removeNote,
    search,
    getNote
  };

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
}; 