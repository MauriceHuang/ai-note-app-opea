import axios from 'axios';

const API_URL = '/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch all notes
export const fetchNotes = async () => {
  try {
    const response = await api.get('/notes/');
    return response.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

// Fetch a single note by ID
export const fetchNoteById = async (id) => {
  try {
    const response = await api.get(`/notes/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching note ${id}:`, error);
    throw error;
  }
};

// Create a new note
export const createNote = async (noteData) => {
  try {
    const response = await api.post('/notes/', noteData);
    return response.data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// Update an existing note
export const updateNote = async (id, noteData) => {
  try {
    const response = await api.put(`/notes/${id}/`, noteData);
    return response.data;
  } catch (error) {
    console.error(`Error updating note ${id}:`, error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (id) => {
  try {
    await api.delete(`/notes/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting note ${id}:`, error);
    throw error;
  }
};

// Search notes
export const searchNotes = async (query) => {
  try {
    const response = await api.get('/notes/search/', { params: { q: query } });
    return response.data;
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
};

// Get AI-generated suggestions for a note
export const getSuggestions = async (noteContent) => {
  try {
    const response = await api.post('/ai/suggestions/', { content: noteContent });
    return response.data;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    throw error;
  }
};

// Ask a question about your notes
export const askQuestion = async (question) => {
  try {
    const response = await api.post('/ai/ask/', { question });
    return response.data;
  } catch (error) {
    console.error('Error asking question:', error);
    throw error;
  }
};

export default api; 