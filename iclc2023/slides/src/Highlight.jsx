//import {Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
//import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
//import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import hs from 'react-syntax-highlighter/dist/esm/languages/hljs/haskell';
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('haskell', hs);

function Highlight({ code, language }) {
  return (
    <div className="mb-4 text-[32px] leading-10 rounded-xl overflow-hidden">
      <SyntaxHighlighter language={language} style={atomOneDark} customStyle={{ padding: '8px 10px' }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default Highlight;
