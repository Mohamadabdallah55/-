import React, { useMemo, useRef, useState } from 'react';
import { GameItem, BanPickStatus, Team } from '../types';
import { GameIcon } from './GameIcons';
import { Ban, Check, Play, RotateCcw, Scale, Search, X, Maximize2, Minimize2 } from 'lucide-react';
import { sound } from '../utils/audio';

interface GamesLibraryMapProps {
  games: GameItem[];
  cardStates: Record<string, { gameId: string; status: BanPickStatus }>;
  activeGameId: string | null;
  teamA?: Team;
  teamB?: Team;
  onSetCardStatus?: (gameId: string, status: BanPickStatus) => void;
  onSetActiveGame?: (gameId: string | null) => void;
}

const categories = [
  { id: 'all', label: 'كل الألعاب', en: 'ALL', color: 'lime' },
  { id: 'digital', label: 'إلكتروني', en: 'DIGITAL', color: 'blue' },
  { id: 'mental', label: 'ذكاء', en: 'MENTAL', color: 'mint' },
  { id: 'physical', label: 'بدني', en: 'PHYSICAL', color: 'orange' },
  { id: '1v1', label: 'تحدي الكباتن', en: '1V1', color: 'lime' },
  { id: 'fan_vote', label: 'تصويت الجمهور', en: 'FAN VOTE', color: 'violet' },
];

export const GamesLibraryMap: React.FC<GamesLibraryMapProps> = ({
  games,
  cardStates,
  activeGameId,
  teamA,
  teamB,
  onSetCardStatus,
  onSetActiveGame,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const libraryRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await libraryRef.current?.requestFullscreen();
    } catch { /* Fullscreen can be unavailable in embedded browser contexts. */ }
  };
  React.useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === libraryRef.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  const filteredGames = useMemo(() => games.filter((game) => {
    const matchesCategory = categoryFilter === 'all' ||
      (categoryFilter === '1v1'
        ? game.categoryId === '1v1' || game.categoryId === 'captains'
        : game.categoryId === categoryFilter);
    const needle = query.trim().toLocaleLowerCase();
    const matchesQuery = !needle || game.nameAr.toLocaleLowerCase().includes(needle) ||
      game.nameEn.toLocaleLowerCase().includes(needle) || game.description?.toLocaleLowerCase().includes(needle);
    return matchesCategory && matchesQuery;
  }), [games, categoryFilter, query]);

  const getStatus = (game: GameItem) => {
    const status = cardStates[game.id]?.status || 'available';
    if (activeGameId === game.id || status === 'current') return { label: 'اللعبة الحالية', className: 'status-current' };
    if (status === 'picked_team_a') return { label: `اختارها ${teamA?.shortName || 'الفريق A'}`, className: 'status-picked' };
    if (status === 'picked_team_b') return { label: `اختارها ${teamB?.shortName || 'الفريق B'}`, className: 'status-picked' };
    if (status === 'banned_team_a') return { label: `حظرها ${teamA?.shortName || 'الفريق A'}`, className: 'status-banned' };
    if (status === 'banned_team_b') return { label: `حظرها ${teamB?.shortName || 'الفريق B'}`, className: 'status-banned' };
    return { label: 'متاحة للاختيار', className: 'status-available' };
  };

  const categoryFor = (game: GameItem) => categories.find((category) =>
    category.id === game.categoryId || (category.id === '1v1' && game.categoryId === 'captains')
  ) || categories[0];

  return (
    <div ref={libraryRef} className={`games-vault ${isFullscreen ? 'games-vault-fullscreen' : ''}`}>
      <div className="vault-toolbar">
        <div className="vault-count"><span className="vault-count-number">{filteredGames.length.toString().padStart(2, '0')}</span><span>لعبة<br /><small>في المكتبة</small></span></div>
        <div className="vault-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن لعبة بالاسم..." aria-label="ابحث في مكتبة الألعاب" /><kbd>⌘ K</kbd></div>
        <button className="vault-fullscreen-toggle" onClick={toggleFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />} {isFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}</button>
        <div className="vault-caption"><span className="vault-caption-mark">05</span><span><strong>فئات الدوري</strong><small>مجموعة الألعاب المعتمدة</small></span></div>
      </div>

      <div className="vault-filters" role="tablist" aria-label="تصفية فئات الألعاب">
        {categories.map((category) => (
          <button
            key={category.id}
            role="tab"
            aria-selected={categoryFilter === category.id}
            className={`vault-filter rb-spring-hover ${categoryFilter === category.id ? 'is-selected' : ''}`}
            onClick={() => setCategoryFilter(category.id)}
          >
            <span>{category.label}</span><small>{category.en}</small>
          </button>
        ))}
      </div>

      {filteredGames.length ? (
        <div className="vault-grid">
          {filteredGames.map((game, index) => {
            const category = categoryFor(game);
            const status = getStatus(game);
            const isBanned = status.className === 'status-banned';
            return (
              <button
                key={game.id}
                className={`vault-game-card rb-spring-hover vault-tone-${category.color} ${status.className}`}
                style={{ '--stagger-index': index % 8 } as React.CSSProperties}
                onClick={() => { sound.playTick(); setSelectedGame(game); }}
              >
                <div className="vault-card-top"><span className="vault-card-index">{String(index + 1).padStart(2, '0')}</span><span className="vault-card-category">{category.en}</span><i /></div>
                <div className="vault-game-art">
                  <div className="vault-art-orbit" />
                  <GameIcon name={game.iconType} />
                  {isBanned && <span className="vault-ban-mark"><Ban /></span>}
                  {status.className === 'status-current' && <span className="vault-live-mark">LIVE</span>}
                </div>
                <div className="vault-card-copy"><strong>{game.nameAr}</strong><small>{game.nameEn || category.label}</small></div>
                <div className={`vault-status ${status.className}`}><span />{status.label}</div>
                <span className="vault-card-arrow">↖</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="vault-empty"><Search /><strong>ما لقينا لعبة بهذا الاسم</strong><span>جرّب بحثاً آخر أو غيّر الفئة.</span></div>
      )}

      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in text-right" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedGame(null); }}>
          <div className="vault-modal max-w-lg w-full p-5 sm:p-6 relative">
            <button onClick={() => setSelectedGame(null)} className="vault-modal-close" aria-label="إغلاق"><X /></button>
            <div className="vault-modal-head">
              <div className="vault-modal-art"><GameIcon name={selectedGame.iconType} /></div>
              <div><span className="vault-modal-kicker">{categoryFor(selectedGame).en} · GAME PROFILE</span><h3>{selectedGame.nameAr}</h3><p>{selectedGame.nameEn}</p></div>
            </div>
            {selectedGame.description && <p className="vault-description">{selectedGame.description}</p>}
            {selectedGame.rules?.trim() && (
              <div className="vault-rules"><span><Scale /> قوانين المواجهة</span><p>{selectedGame.rules}</p></div>
            )}
            {onSetCardStatus && teamA && teamB && (
              <div className="vault-actions">
                <span className="vault-actions-label">إجراء على بطاقة اللعبة</span>
                <div className="vault-actions-grid">
                  <button onClick={() => { sound.playPick('ban'); onSetCardStatus(selectedGame.id, 'banned_team_a'); if (activeGameId === selectedGame.id) onSetActiveGame?.(null); setSelectedGame(null); }}><Ban /> حظر {teamA.shortName}</button>
                  <button onClick={() => { sound.playPick('ban'); onSetCardStatus(selectedGame.id, 'banned_team_b'); if (activeGameId === selectedGame.id) onSetActiveGame?.(null); setSelectedGame(null); }}><Ban /> حظر {teamB.shortName}</button>
                  <button onClick={() => { sound.playPick('pick'); onSetCardStatus(selectedGame.id, 'picked_team_a'); if (activeGameId === selectedGame.id) onSetActiveGame?.(null); setSelectedGame(null); }}><Check /> اختيار {teamA.shortName}</button>
                  <button onClick={() => { sound.playPick('pick'); onSetCardStatus(selectedGame.id, 'picked_team_b'); if (activeGameId === selectedGame.id) onSetActiveGame?.(null); setSelectedGame(null); }}><Check /> اختيار {teamB.shortName}</button>
                </div>
                {onSetActiveGame && <button className="vault-set-current" onClick={() => { sound.playPick('pick'); onSetCardStatus(selectedGame.id, 'current'); onSetActiveGame(selectedGame.id); setSelectedGame(null); }}><Play /> تعيين لعبة الجولة الحالية</button>}
                <button className="vault-reset-state" onClick={() => { sound.playTick(); onSetCardStatus(selectedGame.id, 'available'); if (activeGameId === selectedGame.id) onSetActiveGame?.(null); setSelectedGame(null); }}><RotateCcw /> إعادة اللعبة للحالة المتاحة</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
