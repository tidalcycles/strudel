import React from 'react';
//      value: ?ID, options: Map<ID, any>, onChange: ID => null, onClick: event => void, placeholder?: string
export function SelectInput({ value, options, onChange, onClick, placeholder }) {
  return (
    <select
      onClick={onClick}
      className="p-2 bg-background rounded-md text-foreground"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option disabled value="">
        {`${placeholder ?? 'select an option'}`}
      </option>
      {Array.from(options.keys()).map((id) => (
        <option key={id} className="bg-background" value={id}>
          {options.get(id)}
        </option>
      ))}
    </select>
  );
}
