import React from 'react';

export function SelectInput({ value, options, onChange }) {
  return (
    <select
      className="p-2 bg-background rounded-md text-foreground"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {Object.entries(options).map(([k, label]) => (
        <option key={k} className="bg-background" value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}
