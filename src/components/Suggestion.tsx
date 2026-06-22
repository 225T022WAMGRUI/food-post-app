import { X } from 'lucide-react';

interface SuggestionProps {
  tags: any[];
  onClose: () => void;
}

const SUGGESTIONS = [
  {
    emoji: '🍜',
    name: 'ラーメン',
    reason: '近くに美味しい醤油ラーメンのお店があります',
  },
  {
    emoji: '🍛',
    name: 'カレー',
    reason: '今日は3人がカレーを食べています',
  },
  {
    emoji: '🥗',
    name: 'サラダ',
    reason: '今週まだ野菜少なめ。ちょっと食べてみては？',
  },
  {
    emoji: '🍙',
    name: 'おにぎり',
    reason: 'シンプルで美味しい。コンビニでも手に入ります',
  },
  {
    emoji: '🍱',
    name: '弁当',
    reason: '栄養バランスの取れた一食です',
  },
  {
    emoji: '🍣',
    name: '寿司',
    reason: '今日のみんなの人気メニューです',
  },
];

export default function Suggestion({ tags, onClose }: SuggestionProps) {
  const randomSuggestions = SUGGESTIONS.sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#faf8f4] rounded-t-[40px] w-full p-7 pb-10 max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-[#e8e4de] rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="text-center mb-6 relative">
          <h2 className="font-serif text-xl text-[#2d2520] mb-1">今日なに食べる？</h2>
          <p className="text-xs text-[#b0a89f] tracking-wider">
            みんなの投稿からヒントを届けます
          </p>
        </div>

        {/* Suggestions */}
        <div className="space-y-3 mb-5">
          {randomSuggestions.map((suggestion) => (
            <button
              key={suggestion.name}
              className="w-full bg-white border border-[#ede8e0] rounded-3xl p-4 flex items-center gap-4 hover:shadow-md hover:border-[#e0d5c8] transition-all text-left group"
            >
              <span className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">{suggestion.emoji}</span>
              <div className="flex-1">
                <p className="font-serif text-base text-[#2d2520] mb-0.5">{suggestion.name}</p>
                <p className="text-xs text-[#b0a89f] leading-relaxed">{suggestion.reason}</p>
              </div>
              <span className="text-xl text-[#d9d4cc] flex-shrink-0 group-hover:text-[#c8a98a] group-hover:translate-x-0.5 transition-all">›</span>
            </button>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full bg-white border border-[#ede8e0] rounded-2xl py-4 text-xs text-[#9A7B5F] font-medium tracking-wider hover:bg-[#fdf8f0] hover:border-[#e0d5c8] transition"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
