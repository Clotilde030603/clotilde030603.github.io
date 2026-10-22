import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export function LoginForm({ client, authorizationError }: { client: SupabaseClient; authorizationError?: string | null }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  async function submit(event: { preventDefault(): void }) {
    event.preventDefault(); setState('sending'); setError(null);
    const redirectTo = window.location.origin + '/admin/';
    const { error: signInError } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    if (signInError) { setError(signInError.message); setState('failed'); } else setState('sent');
  }
  return (
    <main className="admin-gate">
      <div className="admin-gate__brand"><img src="/dorami-cartoon/dorami-rabbit-face.png" alt="" /><span>Dorami</span></div>
      <section className="admin-gate__panel" aria-labelledby="login-title">
        <p className="admin-eyebrow">운영자 전용</p><h1 id="login-title">관리자 로그인</h1>
        <p>등록된 운영자 이메일로 일회용 로그인 링크를 보냅니다.</p>
        {authorizationError && <p className="form-error" role="alert">{authorizationError}</p>}
        {state === 'sent' ? <div className="form-success" role="status">로그인 링크를 보냈습니다. 같은 브라우저에서 이메일의 링크를 열어 주세요.</div> : (
          <form onSubmit={submit} className="login-form">
            <label htmlFor="owner-email">이메일</label>
            <input id="owner-email" type="email" autoComplete="email" value={email} required onChange={(event) => setEmail(event.target.value)} />
            <button type="submit" className="button button--primary" disabled={state === 'sending'}>{state === 'sending' ? '보내는 중…' : '로그인 링크 받기'}</button>
          </form>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
