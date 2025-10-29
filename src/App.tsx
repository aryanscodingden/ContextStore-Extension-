import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import './App.css';

declare global {
  interface Window {
    chrome?: any;
  }
}

interface Folder {
  id: number;
  name: string;
  user_id: string;
}

interface Note {
  id: number;
  folder_id: number;
  text: string;
  timestamp: string;
  user_id: string;
}

interface DeleteItem {
  type: 'folder' | 'note';
  id: number;
  name?: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [noteText, setNoteText] = useState('');
  
  // Edit state
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  
  // Highlight feature state
  const [pendingHighlight, setPendingHighlight] = useState<{
    text: string;
    url?: string;
    title?: string;
    timestamp?: string;
    recentErrors?: Array<{
      type: string;
      message: string;
      source?: string;
      line?: number;
      timestamp: string;
    }>;
  } | null>(null);
  const [showHighlightSave, setShowHighlightSave] = useState(false);
  const [highlightNoteName, setHighlightNoteName] = useState('');
  const [highlightFolderId, setHighlightFolderId] = useState<number | null>(null);
  
  // Confirmation dialog state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DeleteItem | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const timeout = setTimeout(() => {
          if (mounted && loading) setLoading(false);
        }, 3000);

        if (window.chrome?.storage) {
          window.chrome.storage.local.get(
            ['supabase_access_token', 'supabase_refresh_token'],
            async (result: any) => {
              clearTimeout(timeout);
              if (!mounted) return;

              if (result.supabase_access_token && result.supabase_refresh_token) {
                try {
                  const { data, error } = await supabase.auth.setSession({
                    access_token: result.supabase_access_token,
                    refresh_token: result.supabase_refresh_token
                  });

                  if (!error && data.session) {
                    setSession(data.session);
                  } else {
                    window.chrome.storage.local.clear();
                  }
                } catch (err) {
                  window.chrome.storage.local.clear();
                }
              }
              setLoading(false);
            }
          );
        } else {
          clearTimeout(timeout);
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (mounted) {
            setSession(currentSession);
            setLoading(false);
          }
        }
      } catch (err) {
        if (mounted) {
          setLoading(false);
          setError('Failed to initialize');
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (mounted) setSession(newSession);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Check for pending highlights from context menu
  useEffect(() => {
    if (session && window.chrome?.runtime) {
      window.chrome.runtime.sendMessage(
        { type: 'GET_PENDING_HIGHLIGHT' },
        (response: any) => {
          if (response && response.pending_highlight) {
            setPendingHighlight({
              text: response.pending_highlight,
              url: response.pending_url,
              title: response.pending_title,
              recentErrors: response.pending_errors
            });
            setShowHighlightSave(true);
            
            // Clear from storage
            window.chrome.runtime.sendMessage({ type: 'CLEAR_PENDING_HIGHLIGHT' });
          }
        }
      );
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchFolders();
    }
  }, [session]);

  useEffect(() => {
    if (selectedFolder) {
      fetchNotes();
    }
  }, [selectedFolder]);

  const fetchFolders = async () => {
    if (!session?.user?.id) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (err: any) {
      setError('Failed to load folders: ' + err.message);
    }
  };

  const fetchNotes = async () => {
    if (!selectedFolder || !session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('folder_id', selectedFolder.id)
        .eq('user_id', session.user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      setError('Failed to load notes: ' + err.message);
    }
  };

  const handleCreateFolder = async () => {
    if (!session?.user?.id || !folderName.trim()) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name: folderName.trim(), user_id: session.user.id }])
        .select()
        .single();

      if (error) throw error;

      setFolders([data, ...folders]);
      setFolderName('');
      setShowFolderInput(false);
      setSelectedFolder(data);
    } catch (err: any) {
      setError('Failed to create folder: ' + err.message);
    }
  };

  const handleCreateNote = async () => {
    if (!selectedFolder || !session?.user?.id || !noteText.trim()) return;

    try {
      setError(null);
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          folder_id: selectedFolder.id,
          text: noteText.trim(),
          user_id: session.user.id,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNoteText('');
      setShowNoteInput(false);
    } catch (err: any) {
      setError('Failed to create note: ' + err.message);
    }
  };

  const handleSaveHighlight = async () => {
    if (!pendingHighlight || !session?.user?.id || !highlightNoteName.trim()) return;

    const folderId = highlightFolderId || selectedFolder?.id;
    if (!folderId) {
      setError('Please select a folder');
      return;
    }

    try {
      setError(null);

      
      
      // Format the note content with proper sections
      const sections = [
        highlightNoteName.trim(), // Title
        '',
        '--- Highlighted Text ---',
        `"${pendingHighlight.text}"`,
        '',
        '--- Source ---',
        `URL: ${pendingHighlight.url || 'Unknown'}`,
        `Page: ${pendingHighlight.title || 'Untitled'}`,
        `Saved: ${new Date().toLocaleString()}`
      ];

      // Add console errors if any (from the actual webpage, not extension)
      if (pendingHighlight.recentErrors && pendingHighlight.recentErrors.length > 0) {
        sections.push('');
        sections.push('--- Page Console Errors ---');
        pendingHighlight.recentErrors.forEach((err: any, idx: number) => {
          sections.push(`${idx + 1}. [${err.type}] ${err.message}`);
          if (err.source) sections.push(`   Source: ${err.source}:${err.line}:${err.column}`);
          if (err.timestamp) sections.push(`   Time: ${new Date(err.timestamp).toLocaleString()}`);
        });
      }

      const noteContent = sections.join('\n');

      const { data, error } = await supabase
        .from('notes')
        .insert([{
          folder_id: folderId,
          text: noteContent,
          user_id: session.user.id,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // If the note was added to current folder, refresh
      if (folderId === selectedFolder?.id) {
        setNotes([data, ...notes]);
      }

      // Reset highlight state
      setPendingHighlight(null);
      setShowHighlightSave(false);
      setHighlightNoteName('');
      setHighlightFolderId(null);
      
      // Show success message
      setError('✓ Highlight saved successfully');
      setTimeout(() => setError(null), 2000);
    } catch (err: any) {
      setError('Failed to save highlight: ' + err.message);
    }
  };

  const startEditNote = (note: Note) => {
    setEditingNote(note);
    setEditText(note.text);
    setExpandedNote(null);
  };

  const cancelEdit = () => {
    setEditingNote(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingNote || !editText.trim()) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({ text: editText.trim() })
        .eq('id', editingNote.id);

      if (error) throw error;

      setNotes(notes.map(n => 
        n.id === editingNote.id 
          ? { ...n, text: editText.trim() } 
          : n
      ));
      
      setEditingNote(null);
      setEditText('');
    } catch (err: any) {
      setError('Failed to update note: ' + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show brief success message
      const originalError = error;
      setError('✓ Copied to clipboard');
      setTimeout(() => setError(originalError), 2000);
    });
  };

  const showDeleteConfirmation = (item: DeleteItem) => {
    setItemToDelete(item);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'folder') {
        const { error } = await supabase.from('folders').delete().eq('id', itemToDelete.id);
        if (error) throw error;

        await supabase.from('notes').delete().eq('folder_id', itemToDelete.id);
        setFolders(folders.filter(f => f.id !== itemToDelete.id));
        if (selectedFolder?.id === itemToDelete.id) {
          setSelectedFolder(null);
          setNotes([]);
        }
      } else if (itemToDelete.type === 'note') {
        const { error } = await supabase.from('notes').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        setNotes(notes.filter(n => n.id !== itemToDelete.id));
      }
    } catch (err: any) {
      setError(`Failed to delete: ${err.message}`);
    }

    setShowConfirmDelete(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setItemToDelete(null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    if (window.chrome?.storage) {
      window.chrome.storage.local.clear();
    }
    setSession(null);
    setFolders([]);
    setNotes([]);
    setSelectedFolder(null);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', width: 300 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        <p style={{ margin: 0, color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Expanded note view
  if (expandedNote) {
    return (
      <div style={{ padding: 16, width: 400, minHeight: 300, fontFamily: 'system-ui' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => setExpandedNote(null)} style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>
            ← Back
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => copyToClipboard(expandedNote.text)} style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>
              Copy
            </button>
            <button onClick={() => { startEditNote(expandedNote); setExpandedNote(null); }} style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}>
              Edit
            </button>
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          border: '1px solid #ddd', 
          borderRadius: 4, 
          whiteSpace: 'pre-wrap',
          fontSize: 14,
          lineHeight: 1.6,
          maxHeight: 500,
          overflowY: 'auto'
        }}>
          {expandedNote.text}
        </div>
        <small style={{ display: 'block', marginTop: 8, color: '#999' }}>
          {new Date(expandedNote.timestamp).toLocaleString()}
        </small>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, width: 320, maxHeight: 550, overflowY: 'auto', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, color: '#1f2937' }}>ContextStore</h2>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#6b7280' }}>
            {session.user.email}
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Logout
        </button>
      </div>

      {error && (
        <div style={{
          padding: 10,
          marginBottom: 12,
          background: error.startsWith('✓') ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${error.startsWith('✓') ? '#a7f3d0' : '#fecaca'}`,
          borderRadius: 6,
          color: error.startsWith('✓') ? '#065f46' : '#dc2626',
          fontSize: 12
        }}>
          {error}
        </div>
      )}

      {/* Highlight Save Dialog */}
      {showHighlightSave && pendingHighlight && (
        <div style={{
          padding: 12,
          marginBottom: 12,
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: 6
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600 }}>Save Highlighted Text</h4>
          
          {pendingHighlight.url && (
            <p style={{ 
              margin: '0 0 4px 0', 
              fontSize: 11, 
              color: '#666',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              From: {pendingHighlight.url}
            </p>
          )}
          
          {pendingHighlight.title && (
            <p style={{ margin: '0 0 8px 0', fontSize: 11, color: '#666' }}>
              Page: {pendingHighlight.title}
            </p>
          )}
          
          <div style={{
            padding: 8,
            marginBottom: 8,
            background: 'white',
            border: '1px solid #fbbf24',
            borderRadius: 4,
            maxHeight: 80,
            overflowY: 'auto',
            fontSize: 12,
            color: '#374151'
          }}>
            "{pendingHighlight.text.substring(0, 200)}{pendingHighlight.text.length > 200 ? '...' : ''}"
          </div>
          
          {pendingHighlight.recentErrors && pendingHighlight.recentErrors.length > 0 && (
            <details style={{ marginBottom: 8 }}>
              <summary style={{ fontSize: 11, color: '#dc2626', cursor: 'pointer' }}>
                ⚠️ {pendingHighlight.recentErrors.length} console error(s) captured
              </summary>
              <div style={{
                marginTop: 4,
                padding: 6,
                background: '#fee2e2',
                borderRadius: 4,
                fontSize: 10,
                maxHeight: 60,
                overflowY: 'auto'
              }}>
                {pendingHighlight.recentErrors.map((err, idx) => (
                  <div key={idx} style={{ marginBottom: 4 }}>
                    <strong>[{err.type}]</strong> {err.message}
                  </div>
                ))}
              </div>
            </details>
          )}
          
          <input
            type="text"
            placeholder="Note name..."
            value={highlightNoteName}
            onChange={(e) => setHighlightNoteName(e.target.value)}
            style={{ 
              width: '100%', 
              padding: 6, 
              marginBottom: 8, 
              fontSize: 12, 
              boxSizing: 'border-box',
              border: '1px solid #d1d5db',
              borderRadius: 4
            }}
          />
          <select
            value={highlightFolderId || selectedFolder?.id || ''}
            onChange={(e) => setHighlightFolderId(Number(e.target.value))}
            style={{ 
              width: '100%', 
              padding: 6, 
              marginBottom: 8, 
              fontSize: 12, 
              boxSizing: 'border-box',
              border: '1px solid #d1d5db',
              borderRadius: 4
            }}
          >
            <option value="">Select folder...</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              onClick={handleSaveHighlight} 
              disabled={!highlightNoteName.trim() || (!highlightFolderId && !selectedFolder?.id)}
              style={{ 
                flex: 1, 
                padding: 6, 
                fontSize: 12, 
                cursor: (highlightNoteName.trim() && (highlightFolderId || selectedFolder?.id)) ? 'pointer' : 'not-allowed',
                background: (highlightNoteName.trim() && (highlightFolderId || selectedFolder?.id)) ? '#10b981' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: 4
              }}
            >
              Save
            </button>
            <button 
              onClick={() => { 
                setShowHighlightSave(false); 
                setPendingHighlight(null);
                setHighlightNoteName('');
                setHighlightFolderId(null);
              }} 
              style={{ 
                flex: 1, 
                padding: 6, 
                fontSize: 12, 
                cursor: 'pointer',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 4
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Folders Section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#374151' }}>
            📁 Folders ({folders.length})
          </h3>
          <button
            onClick={() => setShowFolderInput(!showFolderInput)}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            + New
          </button>
        </div>

        {showFolderInput && (
          <div style={{
            padding: 12,
            marginBottom: 8,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 6
          }}>
            <input
              type="text"
              placeholder="Enter folder name..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
              style={{
                width: '100%',
                padding: 8,
                marginBottom: 8,
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 13,
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCreateFolder}
                disabled={!folderName.trim()}
                style={{
                  flex: 1,
                  padding: 8,
                  background: folderName.trim() ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 13,
                  cursor: folderName.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 500
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowFolderInput(false);
                  setFolderName('');
                }}
                style={{
                  flex: 1,
                  padding: 8,
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          maxHeight: 180,
          overflowY: 'auto'
        }}>
          {folders.length === 0 ? (
            <p style={{
              padding: 16,
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: 13,
              margin: 0
            }}>
              No folders yet
            </p>
          ) : (
            folders.map(folder => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolder(folder)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderBottom: '1px solid #f3f4f6',
                  background: selectedFolder?.id === folder.id ? '#eff6ff' : 'white',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  color: selectedFolder?.id === folder.id ? '#2563eb' : '#374151'
                }}>
                  {folder.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showDeleteConfirmation({ type: 'folder', id: folder.id, name: folder.name });
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#999'
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notes Section */}
      {selectedFolder && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#374151' }}>
              📝 Notes ({notes.length})
            </h3>
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              + Add
            </button>
          </div>

          {showNoteInput && (
            <div style={{
              padding: 12,
              marginBottom: 8,
              background: '#f0fdf4',
              border: '1px solid #d1fae5',
              borderRadius: 6
            }}>
              <textarea
                placeholder="Enter note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: 8,
                  marginBottom: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  fontSize: 13,
                  resize: 'vertical',
                  minHeight: 60,
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCreateNote}
                  disabled={!noteText.trim()}
                  style={{
                    flex: 1,
                    padding: 8,
                    background: noteText.trim() ? '#10b981' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 13,
                    cursor: noteText.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowNoteInput(false);
                    setNoteText('');
                  }}
                  style={{
                    flex: 1,
                    padding: 8,
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Edit Note Section */}
          {editingNote && (
            <div style={{
              padding: 12,
              marginBottom: 8,
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: 6
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 13 }}>Editing Note</h4>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: 8,
                  marginBottom: 8,
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  fontSize: 13,
                  resize: 'vertical',
                  minHeight: 100,
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEdit} disabled={!editText.trim()} style={{
                  flex: 1, padding: 8, background: editText.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white', border: 'none', borderRadius: 4, fontSize: 13,
                  cursor: editText.trim() ? 'pointer' : 'not-allowed'
                }}>
                  Save
                </button>
                <button onClick={cancelEdit} style={{
                  flex: 1, padding: 8, background: '#6b7280', color: 'white',
                  border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer'
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            maxHeight: 200,
            overflowY: 'auto'
          }}>
            {notes.length === 0 ? (
              <p style={{
                padding: 16,
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: 13,
                margin: 0
              }}>
                No notes yet
              </p>
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  style={{
                    padding: 12,
                    borderBottom: '1px solid #f3f4f6',
                    background: 'white'
                  }}
                >
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    maxHeight: 100,
                    overflow: 'hidden'
                  }}>
                    {note.text.substring(0, 200)}{note.text.length > 200 ? '...' : ''}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11,
                    color: '#999'
                  }}>
                    <small>{new Date(note.timestamp).toLocaleString()}</small>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {note.text.length > 200 && (
                        <button onClick={() => setExpandedNote(note)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
                          Expand
                        </button>
                      )}
                      <button onClick={() => copyToClipboard(note.text)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        Copy
                      </button>
                      <button onClick={() => startEditNote(note)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        Edit
                      </button>
                      <button onClick={() => showDeleteConfirmation({ type: 'note', id: note.id })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!selectedFolder && folders.length > 0 && (
        <div style={{
          padding: 20,
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: 6,
          border: '1px dashed #d1d5db'
        }}>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
            Select a folder to view notes
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDelete && itemToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            width: 300,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: 16 }}>
              Confirm Delete
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: 14, color: '#374151' }}>
              Delete this {itemToDelete.type}?
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '8px 16px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
