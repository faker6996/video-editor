import { type EditType, type EditReason } from '@/lib/constants/ocr-constants';

export class ManualEdit {
  id: number = 0;
  task_id: number = 0;
  result_id: number = 0;
  
  // Edit information
  word_index: number = 0; // Position of edited word
  original_word: string = ''; // Word before edit
  edited_word: string = ''; // Word after edit
  edit_type: EditType = 'correction';
  
  // Edit reason/category
  edit_reason: EditReason = 'manual_correction';
  edit_notes?: string; // Optional notes about the edit
  
  // User information
  user_id: number = 0;
  editor_name: string = '';
  
  // Timestamps
  created_at: Date = new Date();

  constructor(data?: Partial<ManualEdit>) {
    if (data) {
      Object.assign(this, data);
      
      // Convert string dates to Date objects
      if (typeof data.created_at === 'string') {
        this.created_at = new Date(data.created_at);
      }
    }
  }

  // Helper methods
  wasWordChanged(): boolean {
    return this.original_word !== this.edited_word;
  }

  getChangeDescription(): string {
    if (!this.wasWordChanged()) return 'No change';
    
    switch (this.edit_type) {
      case 'addition':
        return `Added "${this.edited_word}"`;
      case 'deletion':
        return `Deleted "${this.original_word}"`;
      case 'replacement':
        return `Replaced "${this.original_word}" with "${this.edited_word}"`;
      case 'correction':
      default:
        return `Corrected "${this.original_word}" to "${this.edited_word}"`;
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
    return reasonLabels[this.edit_reason];
  }

  getEditTypeLabel(): string {
    const typeLabels: Record<EditType, string> = {
      'correction': 'Correction',
      'addition': 'Addition',
      'deletion': 'Deletion',
      'replacement': 'Replacement'
    };
    return typeLabels[this.edit_type];
  }

  isSignificantChange(): boolean {
    // Consider it significant if words are very different
    if (this.edit_type === 'addition' || this.edit_type === 'deletion') return true;
    
    const originalLower = this.original_word.toLowerCase();
    const editedLower = this.edited_word.toLowerCase();
    
    // More than 50% of characters changed
    const maxLength = Math.max(originalLower.length, editedLower.length);
    const commonChars = this.getCommonCharacters(originalLower, editedLower);
    return (maxLength - commonChars) / maxLength > 0.5;
  }

  private getCommonCharacters(str1: string, str2: string): number {
    let common = 0;
    const minLength = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) common++;
    }
    
    return common;
  }

  getEditDistance(): number {
    // Simple Levenshtein distance calculation
    const original = this.original_word;
    const edited = this.edited_word;
    
    if (original.length === 0) return edited.length;
    if (edited.length === 0) return original.length;
    
    const matrix = Array(edited.length + 1).fill(null).map(() => Array(original.length + 1).fill(null));
    
    for (let i = 0; i <= original.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= edited.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= edited.length; j++) {
      for (let i = 1; i <= original.length; i++) {
        const indicator = original[i - 1] === edited[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator  // substitution
        );
      }
    }
    
    return matrix[edited.length][original.length];
  }

  getSimilarityPercentage(): number {
    const maxLength = Math.max(this.original_word.length, this.edited_word.length);
    if (maxLength === 0) return 100;
    
    const distance = this.getEditDistance();
    return Math.round(((maxLength - distance) / maxLength) * 100);
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
      created_at: this.created_at.toISOString()
    };
  }
}