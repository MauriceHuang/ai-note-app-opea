import axios from 'axios';

const API_URL = '/api';

// setting up axios object with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// render all notes
export const fetchNotes = async () => {
  try {
    const response = await api.get('/notes/');
    return response.data;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

// get note by ID
export const fetchNoteById = async (id) => {
  try {
    const response = await api.get(`/notes/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching note ${id}:`, error);
    throw error;
  }
};

// user created a new note
export const createNote = async (noteData) => {
  try {
    const response = await api.post('/notes/', noteData);
    return response.data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// user initialised update an existing note
export const updateNote = async (id, noteData) => {
  try {
    const response = await api.put(`/notes/${id}/`, noteData);
    return response.data;
  } catch (error) {
    console.error(`Error updating note ${id}:`, error);
    throw error;
  }
};

// user initiated Delete note
export const deleteNote = async (id) => {
  try {
    await api.delete(`/notes/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error deleting note ${id}:`, error);
    throw error;
  }
};

// for user initiated search notes
export const searchNotes = async (query) => {
  try {
    const response = await api.get('/notes/search/', { params: { q: query } });
    return response.data;
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
};

// for AI-generated suggestions for a note
export const getSuggestions = async (noteContent) => {
  try {
    const response = await api.post('/ai/suggestions/', { content: noteContent });
    return response.data;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    throw error;
  }
};

// for question about your notes
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