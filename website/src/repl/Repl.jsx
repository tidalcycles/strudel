/*
Repl.jsx - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/repl/src/App.js>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { isIframe, isUdels } from './util.mjs';
import UdelsEditor from '@components/Udels/UdelsEditor';
import ReplEditor from './components/ReplEditor';
import EmbeddedReplEditor from './components/EmbeddedReplEditor';
import { useReplContext } from './useReplContext';
import { useSettings } from '@src/settings.mjs';

export function Repl({ embedded = false }) {
  const isEmbedded = embedded || isIframe();
  const Editor = isUdels() ? UdelsEditor : isEmbedded ? EmbeddedReplEditor : ReplEditor;
  const context = useReplContext();
  const { fontFamily } = useSettings();
  return <Editor context={context} style={{ fontFamily }} />;
}
