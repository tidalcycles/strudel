import { useCallback } from 'react';

export default function DownloadButton({ context }) {
  const handleDownload = useCallback(() => {
    // Get the current code from the editor
    const code = context.editorRef?.current?.code || '';

    // Create a blob with the code
    const blob = new Blob([code], { type: 'text/javascript' });

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `strudel-pattern-${new Date().toISOString().slice(0, 10)}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the URL
    window.URL.revokeObjectURL(url);
  }, []);

  return (
    <button
      onClick={handleDownload}
      className="download-button"
      title="Download pattern as .js file"
      aria-label="Download pattern"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12L3 7L4.4 5.6L7 8.2V0H9V8.2L11.6 5.6L13 7L8 12Z" fill="currentColor" />
        <path d="M14 14V10H16V16H0V10H2V14H14Z" fill="currentColor" />
      </svg>
    </button>
  );
}
