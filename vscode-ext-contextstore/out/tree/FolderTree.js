"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderTreeDataProvider = exports.NoteItem = exports.FolderItem = void 0;
const vscode = __importStar(require("vscode"));
class FolderItem extends vscode.TreeItem {
    label;
    folderId;
    collapsibleState;
    constructor(label, folderId, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.folderId = folderId;
        this.collapsibleState = collapsibleState;
        this.contextValue = 'folder';
        this.id = `folder:${folderId}`;
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}
exports.FolderItem = FolderItem;
class NoteItem extends vscode.TreeItem {
    label;
    noteId;
    description;
    tooltip;
    constructor(label, noteId, description, tooltip) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.noteId = noteId;
        this.description = description;
        this.tooltip = tooltip;
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
exports.NoteItem = NoteItem;
class FolderTreeDataProvider {
    supabase;
    getUserId;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(supabase, getUserId) {
        this.supabase = supabase;
        this.getUserId = getUserId;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(el) {
        return el;
    }
    async getChildren(el) {
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
            return data.map((f) => new FolderItem(f.name, f.id, vscode.TreeItemCollapsibleState.Collapsed));
        }
        else if (el instanceof FolderItem) {
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
            return data.map((n) => {
                const title = n.title || 'Untitled';
                const preview = (n.text || '').slice(0, 50);
                const date = new Date(n.timestamp).toLocaleDateString();
                return new NoteItem(title, n.id, date, preview);
            });
        }
        return [];
    }
}
exports.FolderTreeDataProvider = FolderTreeDataProvider;
//# sourceMappingURL=FolderTree.js.map