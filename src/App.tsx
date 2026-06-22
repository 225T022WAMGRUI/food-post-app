import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import MainApp from './pages/MainApp';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          // Only set loading false on initial load, not every auth change
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <p className="text-[#7a6f67]">読み込み中...</p>
      </div>
    );
  }

  return user ? <MainApp user={user} /> : <Auth />;
}

export default App;
