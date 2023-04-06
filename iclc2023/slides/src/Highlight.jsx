import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

Object.assign(atomOneDark.hljs, { padding: '10px' });

function Highlight({ code, language }) {
  return (
    <div className="mb-4 text-[32px] leading-10 rounded-xl overflow-hidden">
      <SyntaxHighlighter language={language} style={atomOneDark}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default Highlight;
