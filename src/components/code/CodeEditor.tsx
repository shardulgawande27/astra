import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { useSettings } from '../../store/SettingsContext';

const baseTheme = EditorView.theme({
  '&': { backgroundColor: 'rgb(var(--bg))' },
  '.cm-gutters': { backgroundColor: 'rgb(var(--bg))', borderRight: '1px solid rgb(var(--border))', color: 'rgb(var(--muted))' },
  '.cm-activeLineGutter, .cm-activeLine': { backgroundColor: 'rgb(var(--subtle) / 0.6)' },
});

export function CodeEditor({
  value,
  onChange,
  minHeight = '220px',
  maxHeight = '460px',
  id,
}: {
  value: string;
  onChange(value: string): void;
  minHeight?: string;
  maxHeight?: string;
  id?: string;
}) {
  const { settings } = useSettings();
  const extensions = useMemo(() => [javascript({ jsx: true }), EditorView.lineWrapping, baseTheme], []);

  return (
    <div id={id} className="overflow-hidden rounded-md border border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={settings.theme === 'dark' ? oneDark : 'light'}
        extensions={extensions}
        minHeight={minHeight}
        maxHeight={maxHeight}
        basicSetup={{ foldGutter: false, highlightActiveLine: true, autocompletion: true, tabSize: 2 }}
        placeholder="// Write your JavaScript solution here"
      />
    </div>
  );
}
