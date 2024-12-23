import PlayCircleIcon from '@heroicons/react/20/solid/PlayCircleIcon';

// type Props = {
//   started: boolean;
//   handleTogglePlay: () => void;
// };
export default function BigPlayButton(Props) {
  const { started, handleTogglePlay } = Props;
  if (started) {
    return;
  }

  return (
    <button
      onClick={() => handleTogglePlay()}
      className="text-white text-2xl fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-[1000] m-auto p-4 bg-black rounded-md flex items-center space-x-2"
    >
      <PlayCircleIcon className="w-6 h-6" />
      <span>play</span>
    </button>
  );
}
