import { useState } from 'react';
import { signUp, signIn } from '../lib/supabase';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('ユーザー名を入力してください');
          return;
        }
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-[#2d2520] mb-2">きょうのごはん</h1>
          <p className="text-[#7a6f67] text-sm tracking-widest">毎日の食卓を記録しよう</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8 space-y-4">
          <div>
            <label className="block text-xs text-[#7a6f67] tracking-wider mb-2 font-medium">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-[#ede8e0] rounded-2xl px-4 py-3 text-sm text-[#2d2520] placeholder-[#b0a89f] focus:border-[#c8956c] focus:outline-none transition"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs text-[#7a6f67] tracking-wider mb-2 font-medium">
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="hana_kitchen"
                className="w-full border border-[#ede8e0] rounded-2xl px-4 py-3 text-sm text-[#2d2520] placeholder-[#b0a89f] focus:border-[#c8956c] focus:outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-[#7a6f67] tracking-wider mb-2 font-medium">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-[#ede8e0] rounded-2xl px-4 py-3 text-sm text-[#2d2520] placeholder-[#b0a89f] focus:border-[#c8956c] focus:outline-none transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c8956c] text-white rounded-2xl py-3 font-serif text-sm tracking-wider hover:bg-[#b8845c] disabled:opacity-50 transition mt-6"
          >
            {loading ? '処理中...' : isSignUp ? 'アカウント作成' : 'ログイン'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="w-full text-[#c8956c] text-sm hover:underline mt-2"
          >
            {isSignUp ? 'ログインはこちら' : 'アカウント作成はこちら'}
          </button>
        </form>
      </div>
    </div>
  );
}
