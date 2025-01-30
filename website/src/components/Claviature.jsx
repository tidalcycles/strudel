import { getClaviature } from 'claviature';
import React from 'react';

export default function Claviature({ options, onClick, onMouseDown, onMouseUp, onMouseLeave }) {
  const svg = getClaviature({
    options,
    onClick,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
  });
  return (
    <svg {...svg.attributes}>
      {svg.children.map((el, i) => {
        const TagName = el.name;
        const { key, ...attributes } = el.attributes;
        return (
          <TagName key={`${el.name}-${i}`} {...attributes}>
            {el.value}
          </TagName>
        );
      })}
    </svg>
  );
}
