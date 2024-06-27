function Button(Props) {
  const { children, onClick } = Props;

  return (
    <button
      onClick={onClick}
      type="button"
      data-input-counter-increment="counter-input"
      className="flex-shrink-0  bg-gray-700 hover:bg-gray-600 border-gray-600 inline-flex items-center justify-center border rounded-md h-5 w-5  focus:ring-gray-700 focus:ring-2 focus:outline-none"
    >
      {children}
    </button>
  );
}
export default function NumberInput(Props) {
  const { value = 0, setValue, max, min } = Props;

  return (
    <div className="relative flex items-center">
      <Button onClick={() => setValue(value - 1)}>
        <svg
          className="w-2.5 h-2.5 text-white"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 2"
        >
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
        </svg>
      </Button>
      <input
        min={min}
        max={max}
        type="text"
        data-input-counter
        className="flex-shrink-0 text-white border-0 bg-transparent text-sm font-normal focus:outline-none focus:ring-0 max-w-[2.5rem] text-center"
        placeholder=""
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button onClick={() => setValue(value + 1)}>
        <svg
          className="w-2.5 h-2.5 text-white"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 18"
        >
          <path strokeLinecap="round" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
        </svg>
      </Button>
    </div>
  );
}
