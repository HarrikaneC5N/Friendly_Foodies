import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Apple, Mail, X } from 'lucide-react';
import { isBackendConfigured, supabase } from '../lib/supabase';

interface Props { onClose: () => void }
export default function AuthDialog({ onClose }: Props) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function login(provider: 'google' | 'apple') {
    if (!supabase) return;
    setBusy(true); setError('');
    const { error: loginError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (loginError) setError(loginError.message);
    setBusy(false);
  }
  async function sendEmail(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError('');
    const { error: loginError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (loginError) setError(loginError.message); else setSent(true);
    setBusy(false);
  }
  async function verifyEmail(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError('');
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (verifyError) setError(verifyError.message); else { setDone(true); setTimeout(onClose, 500); }
    setBusy(false);
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="round-icon auth-close" aria-label="Fermer" onClick={onClose}><X size={19} /></button>
        <div className="auth-illustration"><span>✳</span><span>Bienvenue chez<br /><strong>Friendly Foodies</strong></span></div>
        <div className="auth-content">
          <div className="tiny-label">VOTRE PASSEPORT GOURMAND</div>
          <h2 id="login-title">Partageons nos découvertes.</h2>
          <p>Retrouve tes amis et partage tes meilleures adresses. La découverte reste accessible sans compte.</p>
          {!isBackendConfigured ? (
            <div className="setup-note"><strong>Mode démo</strong><br />La connexion sera activée dès que les identifiants publics Supabase seront configurés dans <code>.env.local</code>.</div>
          ) : (
            <>
              {!sent && <div className="oauth-actions">
                <button disabled={busy} className="oauth-button" onClick={() => login('google')}><span className="google-g">G</span> Continuer avec Google</button>
                <button disabled={busy} className="oauth-button" onClick={() => login('apple')}><Apple size={19} /> Continuer avec Apple</button>
              </div>}
              <div className="form-divider">ou avec ton adresse e-mail</div>
              {!sent ? (
                <form onSubmit={sendEmail}>
                  <label htmlFor="login-email">Adresse e-mail</label>
                  <input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="exemple@email.fr" required />
                  <button type="submit" className="primary-button auth-submit" disabled={busy}><Mail size={17} /> Recevoir mon code</button>
                </form>
              ) : (
                <form onSubmit={verifyEmail}>
                  <button className="back-link" type="button" onClick={() => { setSent(false); setError(''); }}><ArrowLeft size={14} /> Changer d'adresse</button>
                  <label htmlFor="login-code">Code reçu par e-mail</label>
                  <input id="login-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Code à usage unique" minLength={6} required />
                  <button type="submit" className="primary-button auth-submit" disabled={busy}>Vérifier le code <ArrowRight size={17} /></button>
                </form>
              )}
              {done && <p className="form-success">Connexion confirmée !</p>}
              {error && <p className="form-error" role="alert">{error}</p>}
            </>
          )}
          <button onClick={onClose} className="explore-guest">Continuer à explorer sans compte <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
