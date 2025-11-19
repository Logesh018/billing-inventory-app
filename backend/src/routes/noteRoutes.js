// routes/noteRoutes.js
import express from 'express';
import {
  createNote,
  getNoteById,
  getNotes,
  getNotePDF,
  updateNoteStatus,
  deleteNote,
  getNotesForReference
} from '../controllers/noteController.js';

const router = express.Router();

/**
 * @route   POST /api/notes
 * @desc    Create a new Credit or Debit Note
 * @access  Private
 * 
 * Body example:
 * {
 *   "noteType": "credit",
 *   "referenceType": "invoice",
 *   "referenceNumber": "INV/2025/001",
 *   "reason": "goods-returned",
 *   "partyDetails": { ... },
 *   "items": [ ... ]
 * }
 */
router.post('/', createNote);

/**
 * @route   GET /api/notes
 * @desc    Get all notes with optional filters
 * @access  Private
 * 
 * Query params:
 * - noteType (credit/debit)
 * - referenceNumber
 * - partyName
 * - status
 * - startDate
 * - endDate
 * - limit
 */
router.get('/', getNotes);

/**
 * @route   GET /api/notes/:id
 * @desc    Get a single note by ID
 * @access  Private
 */
router.get('/:id', getNoteById);

/**
 * @route   GET /api/notes/:id/pdf
 * @desc    Get PDF URL for a note
 * @access  Private
 */
router.get('/:id/pdf', getNotePDF);

/**
 * @route   PATCH /api/notes/:id/status
 * @desc    Update note status
 * @access  Private
 * 
 * Body: { "status": "issued" | "draft" | "cancelled" }
 */
router.patch('/:id/status', updateNoteStatus);

/**
 * @route   DELETE /api/notes/:id
 * @desc    Delete/Cancel a note
 * @access  Private
 */
router.delete('/:id', deleteNote);

/**
 * @route   GET /api/notes/reference/:referenceNumber
 * @desc    Get all notes for a specific reference (invoice, etc.)
 * @access  Private
 * 
 * Returns summary with total credited, debited, and net adjustment
 */
router.get('/reference/:referenceNumber', getNotesForReference);

export default router;