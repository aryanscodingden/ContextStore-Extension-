"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
exports.restore = restore;
const supabase_js_1 = require("@supabase/supabase-js");
let client = null;
function getClient(url, anon) {
    if (!client) {
        client = (0, supabase_js_1.createClient)(url, anon, {
            auth: {
                persistSession: false,
                autoRefreshToken: true,
                detectSessionInUrl: false
            }
        });
    }
    return client;
}
async function restore(client, session) {
    if (!session) {
        console.log('No session to restore');
        return;
    }
    console.log('Restoring session');
    const { data, error } = await client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
    });
    if (error) {
        console.error('Session restoration error:', error);
        throw error;
    }
    console.log('Session restored successfully, user:', data.user?.id);
    return data;
}
//# sourceMappingURL=supabaseClient.js.map