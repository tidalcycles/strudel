/** @jsxImportSource react */
import { useState, useCallback, useRef } from 'react';
import { ALGOLIA } from '../../config';
import '@docsearch/css';
import './Search.css';

import { createPortal } from 'react-dom';
import * as docSearchReact from '@docsearch/react';
const { BASE_URL } = import.meta.env;
const baseNoTrailing = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

/** FIXME: This is still kinda nasty, but DocSearch is not ESM ready. */
const DocSearchModal = docSearchReact.DocSearchModal || (docSearchReact as any).default.DocSearchModal;
const useDocSearchKeyboardEvents =
  docSearchReact.useDocSearchKeyboardEvents || (docSearchReact as any).default.useDocSearchKeyboardEvents;

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [initialQuery, setInitialQuery] = useState('');

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const onInput = useCallback(
    (e: any) => {
      setIsOpen(true);
      setInitialQuery(e.key);
    },
    [setIsOpen, setInitialQuery],
  );

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen,
    onClose,
    onInput,
    searchButtonRef,
  });

  return (
    <>
      <button
        type="button"
        ref={searchButtonRef}
        onClick={onOpen}
        className="rounded-md bg-slate-900 w-full px-2 search-button"
      >
        <svg width="24" height="24" fill="none">
          <path
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* 				<span>Search</span> */}

        <span className="search-hint">
          <span className="sr-only">Press </span>

          <kbd>/</kbd>

          <span className="sr-only"> to search</span>
        </span>
      </button>

      {isOpen &&
        createPortal(
          <DocSearchModal
            initialQuery={initialQuery}
            initialScrollY={window.scrollY}
            onClose={onClose}
            indexName={ALGOLIA.indexName}
            appId={ALGOLIA.appId}
            apiKey={ALGOLIA.apiKey}
            getMissingResultsUrl={({ query }) => {
              return `https://github.com/tidalcycles/strudel/issues/new?title=Missing doc for ${query}`;
            }}
            transformItems={(items) => {
              return items.map((item) => {
                // We transform the absolute URL into a relative URL to
                // work better on localhost, preview URLS.
                const a = document.createElement('a');
                a.href = item.url;
                const hash = a.hash === '#overview' ? '' : a.hash;
                let pathname = a.pathname;
                pathname = pathname.startsWith('/') ? pathname.slice(1) : pathname;
                pathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
                const url = `${baseNoTrailing}/${pathname}/${hash}`;
                return {
                  ...item,
                  url,
                };
              });
            }}
          />,
          document.body,
        )}
    </>
  );
}
