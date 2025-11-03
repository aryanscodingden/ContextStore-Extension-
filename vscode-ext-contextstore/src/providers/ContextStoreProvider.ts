import * as vscode from 'vscode';
import { getClient, restore } from '../auth/supabaseClient';
import { FolderTreeDataProvider } from '../tree/FolderTree';

let supabaseUrl = '';
let supabaseAnon = '';
let userId: string | null = null;

export function activate(context: vscode.ExtensionContext) {
  const cfg = vscode.workspace.getConfiguration('contextStore');
  supabaseUrl = cfg.get<string>('supabaseUrl') || '';
  supabaseAnon = cfg.get<string>('supabaseAnonKey') || '';

  const sb = () => (supabaseUrl && supabaseAnon ? getClient(supabaseUrl, supabaseAnon) : null);

  const saved = context.globalState.get<any>('session') || null;
  if (saved && sb()) {
    restore(sb()!, saved).catch(() => {});
    userId = saved?.user?.id || null;
  }

  const tree = new FolderTreeDataProvider(sb, () => userId);
  vscode.window.registerTreeDataProvider('contextStoreView', tree);

  context.subscriptions.push(
    vscode.commands.registerCommand('contextStore.signIn', async () => {
      const email = await vscode.window.showInputBox({ prompt: 'Email' });
      const password = await vscode.window.showInputBox({ prompt: 'Password', password: true });
      if (!email || !password) return;

      const client = sb();
      if (!client) { vscode.window.showErrorMessage('Configure Supabase URL and key in Settings'); return; }

      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) { vscode.window.showErrorMessage(`Sign in failed: ${error.message}`); return; }

      userId = data.user?.id || null;
      await context.globalState.update('session', data.session);
      vscode.window.showInformationMessage(`Signed in as ${email}`);
      tree.refresh();
    }),

    vscode.commands.registerCommand('contextStore.signOut', async () => {
      const client = sb();
      if (client) await client.auth.signOut();
      userId = null;
      await context.globalState.update('session', null);
      vscode.window.showInformationMessage('Signed out');
      tree.refresh();
    }),

    vscode.commands.registerCommand('contextStore.saveSelection', async () => {
      const client = sb();
      if (!client || !userId) { vscode.window.showErrorMessage('Sign in first'); return; }

      const editor = vscode.window.activeTextEditor;
      const sel = editor?.document.getText(editor.selection) || '';
      if (!sel.trim()) { vscode.window.showWarningMessage('No selection'); return; }


      const { data: folders } = await client.from('folders').select('*').eq('user_id', userId).order('id', { ascending: false });
      const pick = await vscode.window.showQuickPick(
        (folders || []).map((f: any) => ({ label: f.name, id: f.id })), { placeHolder: 'Select a folder' }
      );
      if (!pick) return;

      const name = await vscode.window.showInputBox({ prompt: 'Note title (optional)', value: editor?.document.fileName.split('/').pop() });
      const body = [name ? `# ${name}` : 'Untitled', '', '``````', '', `File: ${editor?.document.uri.toString()}`, `Saved: ${new Date().toLocaleString()}`].join('\n');

      const { error } = await client.from('notes').insert([{ folder_id: pick.id, text: body, user_id: userId, timestamp: new Date().toISOString() }]);
      if (error) { vscode.window.showErrorMessage(`Save failed: ${error.message}`); return; }

      vscode.window.showInformationMessage('Selection saved to ContextStore');
      tree.refresh();
    })
  );
}

export function deactivate() {}
