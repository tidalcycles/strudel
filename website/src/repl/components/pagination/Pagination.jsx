import { Incrementor } from '../incrementor/Incrementor';

export function Pagination({ currPage, onPageChange, className }) {
  return <Incrementor min={1} value={currPage} onChange={onPageChange} className={className} />;
}
