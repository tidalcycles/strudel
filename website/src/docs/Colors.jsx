import { colorMap } from '@strudel/draw';

const Colors = () => {
  return (
    <div>
      {Object.entries(colorMap).map(([name, hex]) => (
        <div key={name} className="py-1">
          <div className="grid gap-2 grid-cols-3">
            <div>{name}</div>
            <div style={{ backgroundColor: hex }}></div>
            <div style={{ backgroundColor: name, color: hex }}>{name}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Colors;
