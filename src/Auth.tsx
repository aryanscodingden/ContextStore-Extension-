import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const sendMagicLink = async () => {
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: 'https://context-store-auth.vercel.app',
        },
      });

      if (error) throw error;
      
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, width: 280 }}>
      <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>ContextStore</h2>
      <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: 14 }}>
        Sign in with email
      </p>

      {!success ? (
        <>
          <input
            type="email"
            placeholder="your.email@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMagicLink()}
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 12,
              border: '1px solid #ddd',
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box'
            }}
            disabled={loading}
          />
          <button
            onClick={sendMagicLink}
            disabled={!email || loading}
            style={{
              width: '100%',
              padding: 12,
              backgroundColor: loading ? '#999' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </>
      ) : (
        <div style={{ 
          padding: 16, 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb',
          borderRadius: 6,
          color: '#155724'
        }}>
          <p style={{ margin: 0, fontSize: 14 }}>
           Magic link sent! Check your email and click the link to sign in.
          </p>
          <button
            onClick={() => setSuccess(false)}
            style={{
              marginTop: 12,
              padding: '8px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Send Another
          </button>
        </div>
      )}

      {error && (
        <p style={{ 
          marginTop: 12, 
          padding: 12,
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: 6,
          color: '#721c24',
          fontSize: 13
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
