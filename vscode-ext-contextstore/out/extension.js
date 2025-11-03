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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const supabaseClient_1 = require("./auth/supabaseClient");
const FolderTree_1 = require("./tree/FolderTree");
let supabaseUrl = '';
let supabaseAnon = '';
let userId = null;
function activate(context) {
    try {
        require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
        supabaseUrl = process.env.SUPABASE_URL || '';
        supabaseAnon = process.env.SUPABASE_ANON_KEY || '';
    }
    catch (e) {
        console.error('Failed to load .env.local', e);
    }
    const sb = () => (supabaseUrl && supabaseAnon ? (0, supabaseClient_1.getClient)(supabaseUrl, supabaseAnon) : null);
    const saved = context.globalState.get('session') || null;
    if (saved && sb()) {
        (0, supabaseClient_1.restore)(sb(), saved).catch(() => { });
        userId = saved?.user?.id || null;
    }
    const tree = new FolderTree_1.FolderTreeDataProvider(sb, () => userId);
    vscode.window.registerTreeDataProvider('contextstoreView', tree);
    context.subscriptions.push(vscode.commands.registerCommand('contextstore.signUp', async () => {
        const email = await vscode.window.showInputBox({
            prompt: 'Enter your email',
            placeHolder: 'email@example.com',
            validateInput: (value) => {
                if (!value || !value.includes('@')) {
                    return 'Please enter a valid email';
                }
                return null;
            }
        });
        if (!email)
            return;
        const password = await vscode.window.showInputBox({
            prompt: 'Enter your password (min 6 characters)',
            password: true,
            validateInput: (value) => {
                if (!value || value.length < 6) {
                    return 'Password must be at least 6 characters';
                }
                return null;
            }
        });
        if (!password)
            return;
        const client = sb();
        if (!client) {
            vscode.window.showErrorMessage('Supabase not configured. Check .env.local');
            return;
        }
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) {
            vscode.window.showErrorMessage(`Sign up failed: ${error.message}`);
            return;
        }
    }), vscode.commands.registerCommand('contextstore.signIn', async () => {
        const email = await vscode.window.showInputBox({
            prompt: 'Enter your email',
            placeHolder: 'email@example.com'
        });
        if (!email)
            return;
        const password = await vscode.window.showInputBox({
            prompt: 'Enter your password',
            password: true
        });
        if (!password)
            return;
        const client = sb();
        if (!client) {
            vscode.window.showErrorMessage('Supabase not configured. Check .env.local');
            return;
        }
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            vscode.window.showErrorMessage(`Sign in failed: ${error.message}`);
            return;
        }
        userId = data.user?.id || null;
        await context.globalState.update('session', data.session);
        vscode.window.showInformationMessage(`Signed in as ${email}`);
        tree.refresh();
    }), vscode.commands.registerCommand('contextstore.signOut', async () => {
        const client = sb();
        if (client)
            await client.auth.signOut();
        userId = null;
        await context.globalState.update('session', null);
        vscode.window.showInformationMessage('Signed out');
        tree.refresh();
    }), vscode.commands.registerCommand('contextstore.refresh', () => {
        tree.refresh();
    }), vscode.commands.registerCommand('contextstore.createFolder', async () => {
        const client = sb();
        if (!client || !userId) {
            vscode.window.showErrorMessage('Please sign in first');
            return;
        }
        const folderName = await vscode.window.showInputBox({
            prompt: 'Enter folder name',
            placeHolder: 'My Folder'
        });
        if (!folderName)
            return;
        const { error } = await client.from('folders').insert([{
                name: folderName,
                user_id: userId,
                created_at: new Date().toISOString()
            }]);
        if (error) {
            vscode.window.showErrorMessage(`Failed to create folder: ${error.message}`);
            return;
        }
        vscode.window.showInformationMessage(`Folder "${folderName}" created`);
        tree.refresh();
    }), vscode.commands.registerCommand('contextstore.deleteFolder', async (item) => {
        const client = sb();
        if (!client || !userId)
            return;
        const confirm = await vscode.window.showWarningMessage(`Delete folder "${item.label}" and all its notes?`, { modal: true }, 'Delete');
        if (confirm !== 'Delete')
            return;
        await client.from('notes').delete().eq('folder_id', item.folderId);
        const { error } = await client.from('folders').delete().eq('id', item.folderId);
        if (error) {
            vscode.window.showErrorMessage(`Failed to delete folder: ${error.message}`);
            return;
        }
        vscode.window.showInformationMessage(`Folder deleted`);
        tree.refresh();
    }), vscode.commands.registerCommand('contextstore.createNote', async (item) => {
        const client = sb();
        if (!client || !userId)
            return;
        const noteTitle = await vscode.window.showInputBox({
            prompt: 'Enter note title',
            placeHolder: 'My Note'
        });
        if (!noteTitle)
            return;
        const noteContent = await vscode.window.showInputBox({
            prompt: 'Enter note content',
            placeHolder: 'Note content...',
            value: ''
        });
        const { error } = await client.from('notes').insert([{
                folder_id: item.folderId,
                title: noteTitle,
                text: noteContent || '',
                user_id: userId,
                timestamp: new Date().toISOString()
            }]);
        if (error) {
            vscode.window.showErrorMessage(`Failed to create note: ${error.message}`);
            return;
        }
        vscode.window.showInformationMessage(`Note "${noteTitle}" created`);
        tree.refresh();
    }), vscode.commands.registerCommand('contextstore.openNote', async (item) => {
        const client = sb();
        if (!client || !userId)
            return;
        const { data, error } = await client
            .from('notes')
            .select('*')
            .eq('id', item.noteId)
            .single();
        if (error || !data) {
            vscode.window.showErrorMessage('Failed to load note');
            return;
        }
        const doc = await vscode.workspace.openTextDocument({
            content: data.text || '',
            language: 'markdown'
        });
        await vscode.window.showTextDocument(doc, { preview: false });
    }), vscode.commands.registerCommand('contextstore.editNote', async (item) => {
        const client = sb();
        if (!client || !userId)
            return;
        const { data: note, error: fetchError } = await client
            .from('notes')
            .select('*')
            .eq('id', item.noteId)
            .single();
        if (fetchError || !note) {
            vscode.window.showErrorMessage('Failed to load note');
            return;
        }
        const newTitle = await vscode.window.showInputBox({
            prompt: 'Edit note title',
            value: note.title || ''
        });
        if (newTitle === undefined)
            return;
        const newContent = await vscode.window.showInputBox({
            prompt: 'Edit note content',
            value: note.text || '',
            placeHolder: 'Note content...'
        });
        if (newContent === undefined)
            return;
        const { error } = await client
            .from('notes')
            .update({
            title: newTitle,
            text: newContent,
            timestamp: new Date().toISOString()
        })
            .eq('id', item.noteId);
        if (error) {
            vscode.window.showErrorMessage(`Failed to update note: ${error.message}`);
            return;
        }
        vscode.window.showInformationMessage('Note updated');
        tree.refresh();
    }), vscode.commands.registerCommand('contextstore.copyNote', async (item) => {
        const client = sb();
        if (!client || !userId)
            return;
        const { data, error } = await client
            .from('notes')
            .select('text')
            .eq('id', item.noteId)
            .single();
        if (error || !data) {
            vscode.window.showErrorMessage('Failed to load note');
            return;
        }
        await vscode.env.clipboard.writeText(data.text || '');
        vscode.window.showInformationMessage('Note copied to clipboard');
    }), vscode.commands.registerCommand('contextstore.deleteNote', async (item) => {
        const client = sb();
        if (!client || !userId)
            return;
        const confirm = await vscode.window.showWarningMessage(`Delete note "${item.label}"?`, { modal: true }, 'Delete');
        if (confirm !== 'Delete')
            return;
        const { error } = await client.from('notes').delete().eq('id', item.noteId);
        if (error) {
            vscode.window.showErrorMessage(`Failed to delete note: ${error.message}`);
            return;
        }
        vscode.window.showInformationMessage('Note deleted');
        tree.refresh();
    }));
    if (!userId) {
        vscode.window.showInformationMessage('Welcome to ContextStore! Sign in or sign up to sync your notes.', 'Sign In', 'Sign Up').then(selection => {
            if (selection === 'Sign In') {
                vscode.commands.executeCommand('contextstore.signIn');
            }
            else if (selection === 'Sign Up') {
                vscode.commands.executeCommand('contextstore.signUp');
            }
        });
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map