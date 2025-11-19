// controllers/noteController.js
import { noteService } from "../services/noteService.js";

/**
 * Create a new Credit or Debit Note
 */
export const createNote = async (req, res) => {
  try {
    const note = await noteService.createNote(req.body);

    res.status(201).json({
      success: true,
      message: `${note.formattedNoteType} created successfully`,
      data: note
    });
  } catch (error) {
    console.error('❌ Create note error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create note',
      error: error.toString()
    });
  }
};

/**
 * Get note by ID
 */
export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await noteService.getNoteById(id);

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('❌ Get note error:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Note not found'
    });
  }
};

/**
 * Get all notes with optional filters
 */
export const getNotes = async (req, res) => {
  try {
    const filters = {
      noteType: req.query.noteType,
      referenceNumber: req.query.referenceNumber,
      partyName: req.query.partyName,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 100
    };

    const notes = await noteService.getNotes(filters);

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error('❌ Get notes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notes'
    });
  }
};

/**
 * Get PDF for a note
 */
export const getNotePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await noteService.getNoteById(id);

    if (!note.pdfUrl) {
      return res.status(404).json({
        success: false,
        message: 'PDF not generated for this note'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        pdfUrl: note.pdfUrl,
        noteNumber: note.noteNumber,
        noteType: note.noteType
      }
    });
  } catch (error) {
    console.error('❌ Get PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch PDF'
    });
  }
};

/**
 * Update note status
 */
export const updateNoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'issued', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: draft, issued, or cancelled'
      });
    }

    const note = await noteService.updateNoteStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Note status updated successfully',
      data: note
    });
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update note status'
    });
  }
};

/**
 * Delete note (soft delete)
 */
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const note = await noteService.deleteNote(id);

    res.status(200).json({
      success: true,
      message: 'Note cancelled successfully',
      data: note
    });
  } catch (error) {
    console.error('❌ Delete note error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete note'
    });
  }
};

/**
 * Get notes summary for a reference
 */
export const getNotesForReference = async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const summary = await noteService.getNotesForReference(referenceNumber);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('❌ Get reference notes error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch notes for reference'
    });
  }
};