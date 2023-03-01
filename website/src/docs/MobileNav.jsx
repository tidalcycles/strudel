import { Disclosure } from '@headlessui/react';
import Bars3Icon from '@heroicons/react/24/outline/Bars3Icon';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function MobileNav({ sidebar }) {
  return (
    <Disclosure as="nav">
      {({ open }) => (
        <>
          <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
            <span className="sr-only">Open main menu</span>
            {open ? (
              <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
            )}
          </Disclosure.Button>
          <Disclosure.Panel className="md:hidden absolute top-14 right-0 max-h-screen pb-14 overflow-auto z-[100] w-full">
            <div className="space-y-1 px-4 py-4 bg-[#161616]">
              <a
                href=".."
                className="py-2 flex cursor-pointer items-center space-x-1 hover:bg-background hover:px-2 rounded-md"
              >
                <span>go to REPL</span>
              </a>
              {Object.entries(sidebar).map(([group, items], i) => (
                <div key={i} className="space-y-2">
                  <div>{group}</div>
                  {items.map((item, j) => (
                    <Disclosure.Button
                      key={j}
                      as="a"
                      href={`/${item.link}`}
                      className={classNames(
                        item.current
                          ? 'bg-background text-white'
                          : 'text-gray-300 hover:bg-lineHighlight hover:text-white',
                        'block px-3 py-2 rounded-md text-base font-medium',
                      )}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      {item.text}
                    </Disclosure.Button>
                  ))}
                </div>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
