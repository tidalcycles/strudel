import React, { useCallback, useState } from 'react';
import { registerSamplesFromDB, uploadSamplesToDB, userSamplesDBConfig } from '../../idbutils.mjs';

//choose a directory to locally import samples
export default function ImportSoundsButton({ onComplete }) {
  let fileUploadRef = React.createRef();
  const [isUploading, setIsUploading] = useState(false);
  const onChange = useCallback(async () => {
    if (!fileUploadRef.current.files?.length) {
      return;
    }
    setIsUploading(true);

    await uploadSamplesToDB(userSamplesDBConfig, fileUploadRef.current.files).then(() => {
      registerSamplesFromDB(userSamplesDBConfig, () => {
        onComplete();
        setIsUploading(false);
      });
    });
  });

  return (
    <label
      style={{ alignItems: 'center' }}
      className="flex bg-background ml-2 pl-2 pr-2 max-w-[300px] rounded-md hover:opacity-50 whitespace-nowrap cursor-pointer"
    >
      <input
        disabled={isUploading}
        ref={fileUploadRef}
        id="audio_file"
        style={{ display: 'none' }}
        type="file"
        directory=""
        webkitdirectory=""
        multiple
        accept="audio/*, .wav, .mp3, .m4a, .flac, .aac, .ogg"
        onChange={() => {
          onChange();
        }}
      />
      {isUploading ? 'importing...' : 'import sounds'}
    </label>
  );
}
