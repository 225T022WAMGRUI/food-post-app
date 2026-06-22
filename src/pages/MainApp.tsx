import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Home, PlusCircle, User as UserIcon } from 'lucide-react';
import Feed from '../components/Feed';
import Post from '../components/Post';
import MyPage from '../components/MyPage';
import UserProfile from '../components/UserProfile';

interface MainAppProps {
  user: User;
}

type PageType = 'feed' | 'post' | 'my' | 'user-profile';

export default function MainApp({ user }: MainAppProps) {
  const [currentPage, setCurrentPage] = useState<PageType>('feed');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const handlePostSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setCurrentPage('feed');
  };

  const handleUserClick = (userId: string) => {
    setViewingUserId(userId);
    setCurrentPage('user-profile');
  };

  const handleBackFromProfile = () => {
    setCurrentPage('feed');
    setViewingUserId(null);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#e8e4de] p-4">
      <div className="w-[375px] h-[812px] max-h-[100vh] bg-[#faf8f4] rounded-[44px] overflow-hidden shadow-2xl flex flex-col relative">
        {/* Status bar */}
        <div className="h-11 bg-[#faf8f4] flex items-center justify-between px-7 flex-shrink-0">
          <span className="text-sm font-medium text-[#2d2520] tracking-wide">9:41</span>
          <div className="flex gap-1.5 items-center text-xs text-[#2d2520]">
            <span>●●●</span>
            <span>WiFi</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Pages - scrollable area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {currentPage === 'feed' && (
            <Feed userId={user.id} refresh={refreshTrigger} onUserClick={handleUserClick} />
          )}
          {currentPage === 'post' && <Post userId={user.id} onSuccess={handlePostSuccess} />}
          {currentPage === 'my' && <MyPage userId={user.id} />}
          {currentPage === 'user-profile' && viewingUserId && (
            <UserProfile
              userId={viewingUserId}
              currentUserId={user.id}
              onBack={handleBackFromProfile}
              onPostDeleted={() => setRefreshTrigger((prev) => prev + 1)}
            />
          )}
        </div>

        {/* Bottom nav - fixed */}
        <div className="h-20 bg-white border-t border-[#ede8e0] flex items-center justify-center flex-shrink-0 px-4 gap-2">
          <NavItem
            icon={Home}
            label="ホーム"
            active={currentPage === 'feed'}
            onClick={() => { setCurrentPage('feed'); setViewingUserId(null); }}
          />
          <NavItem
            icon={PlusCircle}
            label="投稿"
            active={currentPage === 'post'}
            onClick={() => setCurrentPage('post')}
            isPlus
          />
          <NavItem
            icon={UserIcon}
            label="マイページ"
            active={currentPage === 'my'}
            onClick={() => { setCurrentPage('my'); setViewingUserId(null); }}
          />
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  isPlus?: boolean;
}

function NavItem({ icon: Icon, label, active, onClick, isPlus }: NavItemProps) {
  if (isPlus) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 px-5 py-2 transition"
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
          active ? 'bg-[#9A7B5F]' : 'bg-[#c8a98a] hover:bg-[#b89a7a]'
        }`}>
          <Icon size={28} className="text-white" strokeWidth={1.5} />
        </div>
        <span className={`text-xs font-medium tracking-wider ${active ? 'text-[#9A7B5F]' : 'text-[#b0a89f]'}`}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 px-5 py-2 transition"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
        active ? 'bg-[#f0e0d0]' : 'hover:bg-[#f0e0d0]'
      }`}>
        <Icon
          size={26}
          className={active ? 'text-[#9A7B5F]' : 'text-[#b0a89f]'}
          strokeWidth={1.5}
        />
      </div>
      <span className={`text-xs font-medium tracking-wider ${active ? 'text-[#9A7B5F]' : 'text-[#b0a89f]'}`}>
        {label}
      </span>
    </button>
  );
}
