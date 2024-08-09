import cx from '@src/cx.mjs';

export function ConsoleTab({ log }) {
  return (
    <div id="console-tab" className="break-all px-4 dark:text-white text-stone-900 text-sm">
      <pre aria-hidden="true">{`███████╗████████╗██████╗ ██╗   ██╗██████╗ ███████╗██╗     
██╔════╝╚══██╔══╝██╔══██╗██║   ██║██╔══██╗██╔════╝██║     
███████╗   ██║   ██████╔╝██║   ██║██║  ██║█████╗  ██║     
╚════██║   ██║   ██╔══██╗██║   ██║██║  ██║██╔══╝  ██║     
███████║   ██║   ██║  ██║╚██████╔╝██████╔╝███████╗███████╗
╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚══════╝`}</pre>
      {log.map((l, i) => {
        const message = linkify(l.message);
        return (
          <div key={l.id} className={cx(l.type === 'error' && 'text-red-500', l.type === 'highlight' && 'underline')}>
            <span dangerouslySetInnerHTML={{ __html: message }} />
            {l.count ? ` (${l.count})` : ''}
          </div>
        );
      })}
    </div>
  );
}

function linkify(inputText) {
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a class="underline" href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(
    replacePattern2,
    '$1<a class="underline" href="http://$2" target="_blank">$2</a>',
  );

  //Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a class="underline" href="mailto:$1">$1</a>');

  return replacedText;
}
