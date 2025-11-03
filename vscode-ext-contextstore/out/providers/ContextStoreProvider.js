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
const supabaseClient_1 = require("../auth/supabaseClient");
const FolderTree_1 = require("../tree/FolderTree");
let supabaseUrl = '';
let supabaseAnon = '';
let userId = null;
function activate(context) {
    const cfg = vscode.workspace.getConfiguration('contextStore');
    supabaseUrl = cfg.get('supabaseUrl') || '';
    supabaseAnon = cfg.get('supabaseAnonKey') || '';
    const sb = () => (supabaseUrl && supabaseAnon ? (0, supabaseClient_1.getClient)(supabaseUrl, supabaseAnon) : null);
    const saved = context.globalState.get('session') || null;
    if (saved && sb()) {
        (0, supabaseClient_1.restore)(sb(), saved).catch(() => { });
        userId = saved?.user?.id || null;
    }
    const tree = new FolderTree_1.FolderTreeDataProvider(sb, () => userId);
    vscode.window.registerTreeDataProvider('contextStoreView', tree);
    context.subscriptions.push(vscode.commands.registerCommand('contextStore.signIn', async () => {
        const email = await vscode.window.showInputBox({ prompt: 'Email' });
        const password = await vscode.window.showInputBox({ prompt: 'Password', password: true });
        if (!email || !password)
            return;
        const client = sb();
        if (!client) {
            vscode.window.showErrorMessage('Configure Supabase URL and key in Settings');
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
    }), vscode.commands.registerCommand('contextStore.signOut', async () => {
        const client = sb();
        if (client)
            await client.auth.signOut();
        userId = null;
        await context.globalState.update('session', null);
        vscode.window.showInformationMessage('Signed out');
        tree.refresh();
    }), vscode.commands.registerCommand('contextStore.saveSelection', async () => {
        const client = sb();
        if (!client || !userId) {
            vscode.window.showErrorMessage('Sign in first');
            return;
        }
        const editor = vscode.window.activeTextEditor;
        const sel = editor?.document.getText(editor.selection) || '';
        if (!sel.trim()) {
            vscode.window.showWarningMessage('No selection');
            return;
        }
        const { data: folders } = await client.from('folders').select('*').eq('user_id', userId).order('id', { ascending: false });
        const pick = await vscode.window.showQuickPick((folders || []).map((f) => ({ label: f.name, id: f.id })), { placeHolder: 'Select a folder' });
        if (!pick)
            return;
        const name = await vscode.window.showInputBox({ prompt: 'Note title (optional)', value: editor?.document.fileName.split('/').pop() });
        const body = [name ? `# ${name}` : 'Untitled', '', '``````', '', `File: ${editor?.document.uri.toString()}`, `Saved: ${new Date().toLocaleString()}`].join('\n');
        const { error } = await client.from('notes').insert([{ folder_id: pick.id, text: body, user_id: userId, timestamp: new Date().toISOString() }]);
        if (error) {
            vscode.window.showErrorMessage(`Save failed: ${error.message}`);
            return;
        }
        vscode.window.showInformationMessage('Selection saved to ContextStore');
        tree.refresh();
    }));
}
function deactivate() { }
//# sourceMappingURL=ContextStoreProvider.js.map