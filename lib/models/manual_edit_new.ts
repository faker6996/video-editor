import { type EditType, type EditReason } from '@/lib/constants/ocr-constants';

export class ManualEdit {
  id?: number;
  task_id?: number;
  result_id?: number;
  
  // Edit information
  word_index?: number; // Position of edited word
  original_word?: string; // Word before edit
  edited_word?: string; // Word after edit
  edit_type?: EditType;
  
  // Edit reason/category
  edit_reason?: EditReason;
  edit_notes?: string; // Optional notes about the edit
  
  // User information
  user_id?: number;
  editor_name?: string;
  
  // Timestamps
  created_at?: Date;

  static table = "manual_edits";
  static columns = {
    id: "id",
    task_id: "task_id",
    result_id: "result_id",
    word_index: "word_index",
    original_word: "original_word",
    edited_word: "edited_word",
    edit_type: "edit_type",
    edit_reason: "edit_reason",
    edit_notes: "edit_notes",
    user_id: "user_id",
    editor_name: "editor_name",
    created_at: "created_at"
  } as const;

  constructor(data: Partial<ManualEdit> = {}) {
    // Chỉ assign nếu data không null/undefined
    if (data && typeof data === 'object') {
      Object.assign(this, data);
      
      // Convert string dates to Date objects
      if (typeof data.created_at === 'string') {
        this.created_at = new Date(data.created_at);
      }
    }
  }

  // Helper methods
  wasWordChanged(): boolean {
    if (!this.original_word || !this.edited_word) return false;
    return this.original_word !== this.edited_word;
  }

  getChangeDescription(): string {
    if (!this.wasWordChanged()) return 'No change';
    
    const original = this.original_word || '';
    const edited = this.edited_word || '';
    
    switch (this.edit_type) {
      case 'addition':
        return `Added "${edited}"`;
      case 'deletion':
        return `Deleted "${original}"`;
      case 'replacement':
        return `Replaced "${original}" with "${edited}"`;
      case 'correction':
      default:
        return `Corrected "${original}" to "${edited}"`;
    }
  }

  getReasonLabel(): string {
    const reasonLabels: Record<EditReason, string> = {
      'ocr_error': 'OCR Error',
      'spelling_error': 'Spelling Error',
      'grammar_error': 'Grammar Error',
      'formatting': 'Formatting',
      'punctuation': 'Punctuation',
      'capitalization': 'Capitalization',
      'manual_correction': 'Manual Correction',
      'other': 'Other'
    };
    return this.edit_reason ? reasonLabels[this.edit_reason] : 'Unknown';
  }

  getEditTypeLabel(): string {
    const typeLabels: Record<EditType, string> = {
      'correction': 'Correction',
      'addition': 'Addition',
      'deletion': 'Deletion',
      'replacement': 'Replacement'
    };
    return this.edit_type ? typeLabels[this.edit_type] : 'Unknown';
  }

  hasNotes(): boolean {
    return !!this.edit_notes && this.edit_notes.trim().length > 0;
  }

  toJSON(): any {
    return {
      id: this.id,
      task_id: this.task_id,
      result_id: this.result_id,
      word_index: this.word_index,
      original_word: this.original_word,
      edited_word: this.edited_word,
      edit_type: this.edit_type,
      edit_reason: this.edit_reason,
      edit_notes: this.edit_notes,
      user_id: this.user_id,
      editor_name: this.editor_name,
      created_at: this.created_at?.toISOString()
    };
  }
}