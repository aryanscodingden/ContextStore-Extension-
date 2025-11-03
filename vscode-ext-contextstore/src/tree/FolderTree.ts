import * as vscode from 'vscode';
import type { SupabaseClient } from '@supabase/supabase-js';

export class FolderItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly folderId: number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = 'folder';
    this.id = `folder:${folderId}`;
    this.iconPath = new vscode.ThemeIcon('folder');
  }
}

export class NoteItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly noteId: number,
    public readonly description: string,
    public readonly tooltip: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = 'note';
    this.id = `note:${noteId}`;
    this.iconPath = new vscode.ThemeIcon('file');
    this.description = description;
    this.tooltip = tooltip;
    this.command = {
      command: 'contextstore.openNote',
      title: 'Open Note',
      arguments: [this]
    };
  }
}

export class FolderTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(
    private supabase: () => SupabaseClient | null, 
    private getUserId: () => string | null
  ) {}

  refresh() { 
    this._onDidChangeTreeData.fire(); 
  }

  getTreeItem(el: vscode.TreeItem) { 
    return el; 
  }

  async getChildren(el?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const sb = this.supabase();
    const uid = this.getUserId();
    
    if (!sb || !uid) {
      const signInItem = new vscode.TreeItem('Click to Sign In');
      signInItem.command = {
        command: 'contextstore.signIn',
        title: 'Sign In'
      };
      return [signInItem];
    }

    if (!el) {
      // Get all folders
      const { data, error } = await sb
        .from('folders')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch folders:', error);
        return [];
      }

      if (!data || data.length === 0) {
        const emptyItem = new vscode.TreeItem('No folders yet. Create one!');
        return [emptyItem];
      }

      return data.map((f: any) => 
        new FolderItem(f.name, f.id, vscode.TreeItemCollapsibleState.Collapsed)
      );
    } else if (el instanceof FolderItem) {
      // Get notes in this folder
      const { data, error } = await sb
        .from('notes')
        .select('*')
        .eq('folder_id', el.folderId)
        .eq('user_id', uid)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Failed to fetch notes:', error);
        return [];
      }

      if (!data || data.length === 0) {
        const emptyItem = new vscode.TreeItem('No notes yet');
        return [emptyItem];
      }

      return data.map((n: any) => {
        const title = n.title || 'Untitled';
        const preview = (n.text || '').slice(0, 50);
        const date = new Date(n.timestamp).toLocaleDateString();
        return new NoteItem(title, n.id, date, preview);
      });
    }
    
    return [];
  }
}
