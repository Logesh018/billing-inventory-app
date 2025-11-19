// services/noteService.js
import Note from "../models/Note.js";
import { numberToWords } from "./numberToWords.js";
import { pdfService } from "./pdfService.js";

class NoteService {
  /**
   * Generate next note number based on type
   */
  async generateNoteNumber(noteType) {
    const prefix = noteType === 'credit' ? 'CN' : 'DN';
    const year = new Date().getFullYear();
    
    // Find last note of this type in current year
    const lastNote = await Note.findOne({
      noteType,
      noteNumber: new RegExp(`^${prefix}/${year}/`)
    })
    .sort({ noteNumber: -1 })
    .limit(1);

    let nextNumber = 1;
    if (lastNote) {
      const lastNum = parseInt(lastNote.noteNumber.split('/')[2]);
      nextNumber = lastNum + 1;
    }

    return `${prefix}/${year}/${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Calculate note financials
   */
  calculateFinancials(items, additionalCharges = null) {
    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => {
      const itemAmount = (item.quantity || 0) * (item.rate || 0);
      return sum + itemAmount;
    }, 0);

    // Calculate taxes for items (group by tax rate)
    const taxGroups = {};
    items.forEach(item => {
      const taxRate = item.taxRate || 5;
      if (!taxGroups[taxRate]) {
        taxGroups[taxRate] = 0;
      }
      const itemAmount = (item.quantity || 0) * (item.rate || 0);
      taxGroups[taxRate] += itemAmount;
    });

    let totalCgst = 0;
    let totalSgst = 0;

    Object.keys(taxGroups).forEach(rate => {
      const taxableAmount = taxGroups[rate];
      const tax = (taxableAmount * parseFloat(rate)) / 100;
      totalCgst += tax / 2;
      totalSgst += tax / 2;
    });

    // Calculate additional charges tax if present
    let additionalChargesTax = 0;
    let additionalChargesAmount = 0;

    if (additionalCharges && additionalCharges.amount > 0) {
      additionalChargesAmount = additionalCharges.amount;
      const taxRate = additionalCharges.taxRate || 18;
      additionalChargesTax = (additionalChargesAmount * taxRate) / 100;
      totalCgst += additionalChargesTax / 2;
      totalSgst += additionalChargesTax / 2;
    }

    // Calculate grand total
    const totalBeforeRound = subtotal + totalCgst + totalSgst + additionalChargesAmount;
    const grandTotal = Math.round(totalBeforeRound);
    const roundOff = grandTotal - totalBeforeRound;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxes: {
        cgst: parseFloat(totalCgst.toFixed(2)),
        sgst: parseFloat(totalSgst.toFixed(2)),
        igst: 0 // For inter-state, implement separately if needed
      },
      roundOff: parseFloat(roundOff.toFixed(2)),
      grandTotal,
      amountInWords: numberToWords(grandTotal)
    };
  }

  /**
   * Create a new note (Credit or Debit)
   */
  async createNote(noteData) {
    try {
      console.log(`📝 Creating ${noteData.noteType} note...`);

      // Generate note number if not provided
      if (!noteData.noteNumber) {
        noteData.noteNumber = await this.generateNoteNumber(noteData.noteType);
      }

      // Calculate amounts for items
      noteData.items = noteData.items.map(item => ({
        ...item,
        amount: (item.quantity || 0) * (item.rate || 0)
      }));

      // Calculate financials
      const financials = this.calculateFinancials(
        noteData.items,
        noteData.additionalCharges
      );

      // Merge financials with note data
      const noteToSave = {
        ...noteData,
        ...financials
      };

      // Save to database
      const note = new Note(noteToSave);
      await note.save();

      console.log(`✅ ${note.formattedNoteType} created: ${note.noteNumber}`);

      // Generate PDF
      const pdfResult = await pdfService.generateNotePDF(note);

      // Update note with PDF details
      note.pdfUrl = pdfResult.url;
      note.pdfPublicId = pdfResult.publicId;
      await note.save();

      console.log(`📄 PDF generated: ${pdfResult.url}`);

      return note;
    } catch (error) {
      console.error('❌ Error creating note:', error);
      throw error;
    }
  }

  /**
   * Get note by ID
   */
  async getNoteById(noteId) {
    try {
      const note = await Note.findById(noteId);
      if (!note) {
        throw new Error('Note not found');
      }
      return note;
    } catch (error) {
      console.error('❌ Error fetching note:', error);
      throw error;
    }
  }

  /**
   * Get all notes with filters
   */
  async getNotes(filters = {}) {
    try {
      const query = {};

      if (filters.noteType) {
        query.noteType = filters.noteType;
      }

      if (filters.referenceNumber) {
        query.referenceNumber = filters.referenceNumber;
      }

      if (filters.partyName) {
        query['partyDetails.name'] = new RegExp(filters.partyName, 'i');
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        query.noteDate = {};
        if (filters.startDate) {
          query.noteDate.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.noteDate.$lte = new Date(filters.endDate);
        }
      }

      const notes = await Note.find(query)
        .sort({ noteDate: -1, createdAt: -1 })
        .limit(filters.limit || 100);

      return notes;
    } catch (error) {
      console.error('❌ Error fetching notes:', error);
      throw error;
    }
  }

  /**
   * Update note status
   */
  async updateNoteStatus(noteId, status) {
    try {
      const note = await Note.findByIdAndUpdate(
        noteId,
        { status },
        { new: true }
      );

      if (!note) {
        throw new Error('Note not found');
      }

      console.log(`✅ Note ${note.noteNumber} status updated to: ${status}`);
      return note;
    } catch (error) {
      console.error('❌ Error updating note status:', error);
      throw error;
    }
  }

  /**
   * Delete note (soft delete by changing status)
   */
  async deleteNote(noteId) {
    try {
      const note = await Note.findByIdAndUpdate(
        noteId,
        { status: 'cancelled' },
        { new: true }
      );

      if (!note) {
        throw new Error('Note not found');
      }

      console.log(`🗑️ Note ${note.noteNumber} cancelled`);
      return note;
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      throw error;
    }
  }

  /**
   * Get notes summary for a reference
   */
  async getNotesForReference(referenceNumber) {
    try {
      const notes = await Note.find({ referenceNumber })
        .sort({ noteDate: -1 });

      const summary = {
        creditNotes: notes.filter(n => n.noteType === 'credit'),
        debitNotes: notes.filter(n => n.noteType === 'debit'),
        totalCredited: 0,
        totalDebited: 0,
        netAdjustment: 0
      };

      summary.totalCredited = summary.creditNotes.reduce(
        (sum, note) => sum + note.grandTotal, 
        0
      );

      summary.totalDebited = summary.debitNotes.reduce(
        (sum, note) => sum + note.grandTotal, 
        0
      );

      summary.netAdjustment = summary.totalDebited - summary.totalCredited;

      return summary;
    } catch (error) {
      console.error('❌ Error getting notes summary:', error);
      throw error;
    }
  }
}

export const noteService = new NoteService();