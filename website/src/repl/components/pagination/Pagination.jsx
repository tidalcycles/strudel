import { Incrementor } from '../incrementor/Incrementor';

export function Pagination({ currPage, onPageChange, className, ...incrementorProps }) {
  return <Incrementor min={1} value={currPage} onChange={onPageChange} className={className} {...incrementorProps} />;
}
