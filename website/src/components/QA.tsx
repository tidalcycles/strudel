import ChevronDownIcon from '@heroicons/react/20/solid/ChevronDownIcon';
import ChevronUpIcon from '@heroicons/react/20/solid/ChevronUpIcon';
import React from 'react';
import { useState } from 'react';

export default function QA({ children, q }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="py-4 px-6 pr-10 bg-lineHighlight relative mb-4">
      <div className="cursor-pointer" onClick={() => setVisible((v) => !v)}>
        <div>{q}</div>
        <a className="p-1 absolute top-4 right-4">
          {visible ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </a>
      </div>
      {visible && <div>{children}</div>}
    </div>
  );
}
