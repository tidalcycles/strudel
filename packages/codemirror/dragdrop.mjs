import { ViewPlugin } from '@codemirror/view';
import { logger } from '@strudel/core';

// Helper function to read file content
async function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Check for common text file formats, to avoid
// accidentally loading images or other files
function isCodeFile(file) {
  const codeExtensions = ['.js', '.strudel', '.str'];
  const fileName = file.name.toLowerCase();
  return codeExtensions.some((ext) => fileName.endsWith(ext)) || file.type.startsWith('text/');
}

// Create drag and drop extension
export const dragDropPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.view = view;
      this.handleDrop = this.handleDrop.bind(this);
      this.handleDragOver = this.handleDragOver.bind(this);
      this.handleDragEnter = this.handleDragEnter.bind(this);
      this.handleDragLeave = this.handleDragLeave.bind(this);

      // Add event listeners
      view.dom.addEventListener('drop', this.handleDrop);
      view.dom.addEventListener('dragover', this.handleDragOver);
      view.dom.addEventListener('dragenter', this.handleDragEnter);
      view.dom.addEventListener('dragleave', this.handleDragLeave);
    }

    handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    }

    handleDragEnter(e) {
      e.preventDefault();
      e.stopPropagation();
      this.view.dom.classList.add('cm-drag-over');
    }

    handleDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      // Only remove the class if we're leaving the editor entirely
      if (!this.view.dom.contains(e.relatedTarget)) {
        this.view.dom.classList.remove('cm-drag-over');
      }
    }

    async handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      this.view.dom.classList.remove('cm-drag-over');

      const files = Array.from(e.dataTransfer.files);

      // Filter for code files only
      const codeFiles = files.filter(isCodeFile);

      if (codeFiles.length === 0) {
        logger('No code files were dropped. Please drop text-based files.', 'warning');
        return;
      }

      try {
        // Read all files
        const fileContents = await Promise.all(
          codeFiles.map(async (file) => {
            const content = await readFileContent(file);
            return `// File: ${file.name}\n${content}`;
          }),
        );

        // Combine content
        const newContent = fileContents.join('\n\n');

        // Replace entire editor contents
        this.view.dispatch({
          changes: { from: 0, to: this.view.state.doc.length, insert: newContent },
          selection: { anchor: newContent.length },
        });

        // Focus the editor
        this.view.focus();

        // Show success message
        const fileNames = codeFiles.map((f) => f.name).join(', ');
        logger(`Successfully loaded ${codeFiles.length} file(s): ${fileNames}`, 'highlight');
      } catch (error) {
        console.error('Error reading dropped files:', error);
        logger(`Error loading files: ${error.message}`, 'error');
      }
    }

    destroy() {
      this.view.dom.removeEventListener('drop', this.handleDrop);
      this.view.dom.removeEventListener('dragover', this.handleDragOver);
      this.view.dom.removeEventListener('dragenter', this.handleDragEnter);
      this.view.dom.removeEventListener('dragleave', this.handleDragLeave);
    }
  },
);
