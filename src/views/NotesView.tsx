import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { marked } from 'marked';

interface NoteInfo {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

type EditorMode = 'edit' | 'preview';

export const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<NoteInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<EditorMode>('edit');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadNotes = useCallback(async () => {
    try {
      const list = await invoke<NoteInfo[]>('list_notes');
      setNotes(list);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const selectNote = async (id: string) => {
    try {
      const note = await invoke<Note>('get_note', { id });
      setCurrentNote(note);
      setSelectedId(id);
      setTitle(note.title);
      setContent(note.content);
      setMode('edit');
      setError('');
    } catch (e) {
      setError(String(e));
    }
  };

  const createNote = () => {
    setSelectedId(null);
    setCurrentNote(null);
    setTitle('新建笔记');
    setContent('');
    setMode('edit');
  };

  const saveNote = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const info = await invoke<NoteInfo>('save_note', {
        id: selectedId ?? null,
        title: title.trim(),
        content,
      });
      setSelectedId(info.id);
      await loadNotes();
      setError('');
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!window.confirm('确认删除该笔记？')) return;
    try {
      await invoke('delete_note', { id });
      if (selectedId === id) {
        setSelectedId(null);
        setCurrentNote(null);
        setTitle('');
        setContent('');
      }
      await loadNotes();
    } catch (e) {
      setError(String(e));
    }
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const renderedMarkdown = marked(content) as string;

  return (
    <div className="flex h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Left panel: note list */}
      <div className="w-56 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* Search + New */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex gap-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索笔记..."
            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <button
            onClick={createNote}
            className="px-2 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            title="新建笔记"
          >
            +
          </button>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
              {search ? '无匹配笔记' : '暂无笔记，点击 + 新建'}
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => selectNote(note.id)}
                className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
                  selectedId === note.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-l-blue-500'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{note.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="hidden group-hover:block text-gray-400 hover:text-red-500 ml-1 text-xs"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel: editor / preview */}
      <div className="flex-1 flex flex-col">
        {selectedId !== null || title ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="笔记标题"
                className="flex-1 text-base font-semibold outline-none border-b border-transparent focus:border-blue-400 py-0.5 bg-transparent text-gray-900 dark:text-gray-100"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => setMode('edit')}
                  className={`px-3 py-1 text-sm rounded ${mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  编辑
                </button>
                <button
                  onClick={() => setMode('preview')}
                  className={`px-3 py-1 text-sm rounded ${mode === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  预览
                </button>
              </div>
              <button
                onClick={saveNote}
                disabled={saving}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>

            {/* Editor / Preview */}
            <div className="flex-1 overflow-hidden">
              {mode === 'edit' ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="使用 Markdown 编写笔记..."
                  className="w-full h-full p-4 font-mono text-sm outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <div
                  className="w-full h-full p-4 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
            <span className="text-3xl">📝</span>
            <span className="text-sm">选择一篇笔记或点击 + 新建</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 py-2 text-red-500 dark:text-red-400 text-sm border-t border-gray-200 dark:border-gray-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
