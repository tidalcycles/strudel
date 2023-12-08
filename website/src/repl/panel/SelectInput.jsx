import React from 'react';
//      value: ID, options: Set<{id: ID, label: string}>, onChange: ID => null, onClick: event => void
export function SelectInput({ value, options, onChange, onClick }) {
  return (
    <select
      onClick={onClick}
      className="p-2 bg-background rounded-md text-foreground"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {Array.from(options).map(({ id, label }) => (
        <option key={id} className="bg-background" value={id}>
          {label}
        </option>
      ))}
    </select>
  );
}
