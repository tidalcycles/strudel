import React from 'react';

export default function FileUpload({ onUpload }) {
  let fileUploadRef = React.createRef();
  function mapFiles(soundFiles) {
    const files = Array.from(soundFiles).map((soundFile) => {
      const file = { name: soundFile.name, path: URL.createObjectURL(soundFile) };
      return file;
    });
    onUpload(files);
  }
  return (
    <>
      <input
        key="uploadREf"
        ref={fileUploadRef}
        id="audio_file"
        type="file"
        directory=""
        webkitdirectory=""
        multiple
        accept="audio/*"
        onChange={() => {
          mapFiles(fileUploadRef.current.files);
        }}
      />
      <input
        key="uploadUI"
        className="screen-button-overlay"
        type="button"
        onMouseDown={() => fileUploadRef.current.click()}
      />
    </>
  );
}
