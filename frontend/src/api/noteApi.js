// api/noteApi.js
import { axiosInstance } from "../lib/axios";

/**
 * Create a new note
 */
export const createNote = async (noteData) => {
  try {
    const response = await axiosInstance.post('/notes', noteData);
    return response.data;
  } catch (error) {
    console.error('Create note error:', error);
    throw error;
  }
};

/**
 * Get all notes with optional filters
 * @param {Object} filters - Filter options (noteType, status, referenceNumber, etc.)
 * @returns {Promise<Object>} Notes list response
 */
export const getNotes = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `/notes?${params}` : '/notes';
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Get notes error:', error);
    throw error;
  }
};

/**
 * Get a single note by ID
 * @param {string} noteId - Note ID
 * @returns {Promise<Object>} Note data
 */
export const getNoteById = async (noteId) => {
  try {
    const response = await axiosInstance.get(`/notes/${noteId}`);
    return response.data;
  } catch (error) {
    console.error('Get note by ID error:', error);
    throw error;
  }
};

/**
 * Update a note
 * @param {string} noteId - Note ID
 * @param {Object} noteData - Updated note data
 * @returns {Promise<Object>} Updated note response
 */
export const updateNote = async (noteId, noteData) => {
  try {
    const response = await axiosInstance.put(`/notes/${noteId}`, noteData);
    return response.data;
  } catch (error) {
    console.error('Update note error:', error);
    throw error;
  }
};

/**
 * Update note status
 * @param {string} noteId - Note ID
 * @param {string} status - New status (draft, issued, cancelled)
 * @returns {Promise<Object>} Updated note response
 */
export const updateNoteStatus = async (noteId, status) => {
  try {
    const response = await axiosInstance.patch(`/notes/${noteId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Update note status error:', error);
    throw error;
  }
};

/**
 * Delete/Cancel a note
 * @param {string} noteId - Note ID
 * @returns {Promise<Object>} Deleted note response
 */
export const deleteNote = async (noteId) => {
  try {
    const response = await axiosInstance.delete(`/notes/${noteId}`);
    return response.data;
  } catch (error) {
    console.error('Delete note error:', error);
    throw error;
  }
};

/**
 * Get PDF URL for a note
 * @param {string} noteId - Note ID
 * @returns {Promise<Object>} PDF URL response
 */
export const getNotePDF = async (noteId) => {
  try {
    const response = await axiosInstance.get(`/notes/${noteId}/pdf`);
    return response.data;
  } catch (error) {
    console.error('Get note PDF error:', error);
    throw error;
  }
};

/**
 * Get all notes for a specific reference (invoice, PO, etc.)
 * @param {string} referenceNumber - Reference number (e.g., INV/2025/001)
 * @returns {Promise<Object>} Notes summary for reference
 */
export const getNotesForReference = async (referenceNumber) => {
  try {
    const response = await axiosInstance.get(`/notes/reference/${referenceNumber}`);
    return response.data;
  } catch (error) {
    console.error('Get notes for reference error:', error);
    throw error;
  }
};

/**
 * Download note PDF
 * @param {Object} note - Note object with pdfUrl
 */
export const downloadNotePDF = async (note) => {
  try {
    if (!note.pdfUrl) {
      throw new Error('PDF not available for this note');
    }

    const link = document.createElement('a');
    link.href = note.pdfUrl;
    link.download = `${note.noteType}-note-${note.noteNumber.replace(/\//g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download note PDF error:', error);
    throw error;
  }
};