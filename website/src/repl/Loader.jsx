import cx from '@src/cx.mjs';

function Loader({ active }) {
  return (
    <div className="overflow-hidden opacity-50 fixed top-0 left-0 w-full z-[1000]">
      <div className={cx('h-[2px] block w-full', active ? 'bg-foreground animate-train' : 'bg-transparent')}>
        <div />
      </div>
    </div>
  );
}
export default Loader;
