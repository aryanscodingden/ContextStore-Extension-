# 🚀 Launch Checklist - ContextStore VS Code Extension

## Pre-Launch Setup ✅

### 1. Database Setup
- [ ] Go to https://supabase.com and sign in
- [ ] Open your project SQL editor
- [ ] Copy entire contents of `database-schema.sql`
- [ ] Paste and run in SQL editor
- [ ] Verify "Setup complete!" message appears
- [ ] Check that `folders` and `notes` tables exist in Table Editor

### 2. Environment Variables
- [ ] `.env.local` exists in extension root
- [ ] Contains `SUPABASE_URL=https://efiivbulfaqqvfjtkmkq.supabase.co`
- [ ] Contains `SUPABASE_ANON_KEY=eyJhbGci...` (your full key)
- [ ] File is in `.gitignore` (already done)

### 3. Dependencies
- [ ] Run `npm install` in vscode-ext-contextstore directory
- [ ] No error messages
- [ ] `node_modules/` folder created
- [ ] `@supabase/supabase-js` installed
- [ ] `dotenv` installed

### 4. Compilation
- [ ] Run `npm run compile`
- [ ] No TypeScript errors
- [ ] `out/` folder created
- [ ] `out/extension.js` exists
- [ ] `out/tree/FolderTree.js` exists
- [ ] `out/auth/supabaseClient.js` exists

## Launch Steps 🎯

### Step 1: Start Extension
- [ ] Open VS Code in the vscode-ext-contextstore folder
- [ ] Press **F5** or click "Run → Start Debugging"
- [ ] New VS Code window opens with title "[Extension Development Host]"
- [ ] No errors in Debug Console
- [ ] ContextStore icon appears in activity bar (left sidebar)

### Step 2: First Sign Up
- [ ] Click ContextStore icon in activity bar
- [ ] See "Click to Sign In" message
- [ ] Click it or run command: `ContextStore: Sign Up`
- [ ] Enter test email: `test@contextstore.com`
- [ ] Enter password: `test123456`
- [ ] See success message
- [ ] (Optional) Check Supabase Auth dashboard for user

### Step 3: Sign In
- [ ] Run command: `ContextStore: Sign In`
- [ ] Enter email: `test@contextstore.com`
- [ ] Enter password: `test123456`
- [ ] See "Signed in as test@contextstore.com" message
- [ ] Tree view updates (no longer shows "Click to Sign In")

### Step 4: Create First Folder
- [ ] Click **+** icon in sidebar header (or run `Create Folder` command)
- [ ] Enter folder name: `My First Folder`
- [ ] Press Enter
- [ ] Folder appears in tree with folder icon
- [ ] Can expand/collapse by clicking folder name

### Step 5: Create First Note
- [ ] Expand the folder you created
- [ ] Click **+** icon next to folder name
- [ ] Enter note title: `My First Note`
- [ ] Enter note content: `This is my first note in ContextStore!`
- [ ] Press Enter
- [ ] Note appears under folder with file icon
- [ ] Date shows next to note

### Step 6: Test Note Actions
- [ ] Click on note → Opens in editor with content
- [ ] Click **✏️** icon → Can edit title and content
- [ ] Click **📋** icon → Copies to clipboard (test with paste)
- [ ] Create another note to test with
- [ ] Click **🗑️** icon → Confirms and deletes note

### Step 7: Test Folder Delete
- [ ] Create a new folder with a few notes
- [ ] Click **🗑️** icon next to folder
- [ ] See warning "Delete folder and all its notes?"
- [ ] Click "Delete"
- [ ] Folder and all notes disappear

### Step 8: Test Refresh
- [ ] Click **↻** refresh icon in header
- [ ] Tree reloads
- [ ] All data still there
- [ ] No errors

### Step 9: Test Session Persistence
- [ ] Close the Extension Development Host window
- [ ] Press F5 again to relaunch
- [ ] Open ContextStore sidebar
- [ ] Should still be signed in (session restored)
- [ ] Folders and notes still visible

### Step 10: Test Chrome Sync (if Chrome ext is ready)
- [ ] Create folder in VS Code: "VS Code Test"
- [ ] Open Chrome extension
- [ ] Refresh Chrome extension
- [ ] Verify "VS Code Test" folder appears
- [ ] Create note in Chrome
- [ ] Refresh VS Code (↻ icon)
- [ ] Verify Chrome note appears in VS Code

## Verification Checklist ✅

### Features Working
- [ ] ✅ Sign up with email/password
- [ ] ✅ Sign in with email/password
- [ ] ✅ Sign out
- [ ] ✅ Create folders
- [ ] ✅ Delete folders
- [ ] ✅ Expand/collapse folders
- [ ] ✅ Create notes
- [ ] ✅ Open notes
- [ ] ✅ Edit notes
- [ ] ✅ Copy notes
- [ ] ✅ Delete notes
- [ ] ✅ Refresh data
- [ ] ✅ Session persistence

### UI Working
- [ ] ✅ Activity bar icon shows
- [ ] ✅ Sidebar opens
- [ ] ✅ Tree view displays
- [ ] ✅ Icons display correctly
- [ ] ✅ Context menus work
- [ ] ✅ Inline buttons work
- [ ] ✅ Commands accessible via Cmd+Shift+P

### No Errors
- [ ] ✅ No compilation errors
- [ ] ✅ No runtime errors in Debug Console
- [ ] ✅ No errors in Problems panel
- [ ] ✅ No errors when creating/editing/deleting

## Troubleshooting Guide 🔧

### Issue: Extension Won't Load
**Solution:**
```bash
cd vscode-ext-contextstore
npm install
npm run compile
# Press F5 again
```

### Issue: "Supabase not configured"
**Solution:**
- Check `.env.local` exists
- Verify it contains SUPABASE_URL and SUPABASE_ANON_KEY
- Restart VS Code (full restart, not just reload window)

### Issue: "Sign in failed"
**Solution:**
- Run `database-schema.sql` in Supabase SQL editor
- Check email/password are correct
- In Supabase: Settings → Auth → Email Auth should be enabled
- In Supabase: Settings → Auth → Confirm Email can be disabled for testing

### Issue: Notes/Folders Not Showing
**Solution:**
- Click refresh icon (↻)
- Sign out and sign in again
- Check Supabase Table Editor - verify data exists
- Check Debug Console for errors

### Issue: Can't Create Folders/Notes
**Solution:**
- Verify you're signed in
- Check Row Level Security policies are created (run database-schema.sql again)
- Check Debug Console for detailed error messages

## Success Criteria ✅

All of these should work:
- [x] Extension loads without errors
- [x] Can sign up new users
- [x] Can sign in existing users
- [x] Can create folders
- [x] Can create notes in folders
- [x] Can edit notes
- [x] Can delete notes
- [x] Can delete folders
- [x] Data persists across reloads
- [x] UI is clean and functional
- [x] No console errors
- [x] Syncs with Chrome extension

## 🎉 You're Done!

If all checkboxes are checked, your extension is ready to use!

### Next Steps:
1. Read `QUICKSTART.md` for usage tips
2. Check `TESTING.md` for comprehensive testing
3. See `BUILD-SUMMARY.md` for complete feature list
4. Start using ContextStore for real work!

---

**Need Help?**
- Check Debug Console: View → Debug Console
- Check Problems Panel: View → Problems
- Review `SETUP.md` for detailed documentation
- Verify Supabase dashboard for data/auth issues
