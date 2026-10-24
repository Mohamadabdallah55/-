import React, { useEffect, useState } from 'react';
import {
  Download,
  ExternalLink,
  Gamepad2,
  Keyboard,
  LayoutDashboard,
  LibraryBig,
  MonitorPlay,
  Smartphone,
  Settings2,
  Timer,
  Trophy,
  Tv,
  Users,
  Wifi,
} from 'lucide-react';
import { webrtcSync } from '../utils/webrtcSync';
import { BrandMark } from './BrandMark';

type Tab = 'match' | 'arena' | 'library' | 'standings' | 'timer' | 'broadcast';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onOpenTeamsModal: () => void;
  onOpenSettingsModal?: () => void;
  onOpenResetModal: () => void;
  onOpenMobileConnectModal?: () => void;
  onToggleStageView?: () => void;
  onOpenHotkeys?: () => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

const navItems: Array<{ id: Tab; label: string; en: string; icon: React.ElementType }> = [
  { id: 'match', label: 'مركز المباراة', en: 'MATCH CONTROL', icon: LayoutDashboard },
  { id: 'arena', label: 'اختيار الألعاب', en: 'BAN & PICK', icon: Gamepad2 },
  { id: 'standings', label: 'ترتيب الدوري', en: 'LEADERBOARD', icon: Trophy },
  { id: 'library', label: 'مكتبة الألعاب', en: 'GAME LIBRARY', icon: LibraryBig },
  { id: 'timer', label: 'المؤقت الميداني', en: 'FIELD TIMER', icon: Timer },
  { id: 'broadcast', label: 'شاشة العرض', en: 'BROADCAST', icon: MonitorPlay },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTeamsModal,
  onOpenSettingsModal,
  onOpenMobileConnectModal,
  onToggleStageView,
  onOpenHotkeys,
  canInstallPwa,
  onInstallPwa,
}) => {
  const [clientCount, setClientCount] = useState(0);
  const [connectionReady, setConnectionReady] = useState(false);

  useEffect(() => webrtcSync.onStatusChange((status, count) => {
    setClientCount(count);
    setConnectionReady(status !== 'disconnected');
  }), []);

  const openStandaloneTimer = () => {
    window.open(`${window.location.href.split('#')[0]}#standalone-timer`, '_blank', 'width=1100,height=750');
  };

  const renderNav = (mobile = false) => navItems.map(({ id, label, en, icon: Icon }, index) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      aria-current={activeTab === id ? 'page' : undefined}
      className={`${mobile ? 'mobile-nav-item' : 'sidebar-nav-item'} ${activeTab === id ? 'is-active' : ''}`}
      title={label}
    >
      <Icon aria-hidden="true" />
      <span className="nav-copy"><strong>{label}</strong>{!mobile && <small>{en}</small>}</span>
      {!mobile && <span className="nav-index">0{index + 1}</span>}
    </button>
  ));

  return (
    <>
      <aside className="site-sidebar" aria-label="التنقل الرئيسي">
        <button className="new-brand" onClick={() => setActiveTab('match')} aria-label="العودة للمواجهة">
          <span className="brand-emblem"><BrandMark /></span>
          <span className="brand-copy"><strong>صراع النخبة</strong><small>CLASH OF ELITES</small></span>
        </button>

        <div className="season-card">
          <div className="season-card-top"><span className="season-dot" /> SEASON 01</div>
          <strong>ليلة التحدي</strong>
          <span>منصة إدارة المنافسة</span>
          <div className="season-progress"><i /></div>
        </div>

        <div className="nav-section-label">إدارة البطولة <span>TOURNAMENT</span></div>
        <nav className="sidebar-nav">{renderNav()}</nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-connection">
          <span className={`connection-icon ${clientCount ? 'is-live' : ''}`}><Wifi /></span>
          <span><strong>{clientCount ? `الريموت متصل (${clientCount})` : 'التحكم عن بُعد'}</strong><small>{connectionReady ? 'جاهز للاتصال' : 'بانتظار الاتصال'}</small></span>
          <i className={connectionReady ? 'status-led is-ready' : 'status-led'} />
        </div>

        <div className="sidebar-actions">
          <button onClick={onOpenTeamsModal}><Users /><span>إدارة الفرق</span></button>
          {onOpenSettingsModal && <button onClick={onOpenSettingsModal}><Settings2 /><span>إعدادات الدوري</span></button>}
          <button onClick={onOpenMobileConnectModal}><Smartphone /><span>ربط الهاتف</span></button>
          {onToggleStageView && <button onClick={onToggleStageView}><Tv /><span>وضع المسرح</span></button>}
          {onOpenHotkeys && <button onClick={onOpenHotkeys}><Keyboard /><span>اختصارات</span></button>}
          <button onClick={openStandaloneTimer}><ExternalLink /><span>مؤقت منفصل</span></button>
          {canInstallPwa && onInstallPwa && <button onClick={onInstallPwa}><Download /><span>تثبيت التطبيق</span></button>}
        </div>

        <div className="sidebar-footnote"><span>CE / 26</span><span>COMPETITION SYSTEM</span></div>
      </aside>

      <header className="mobile-topbar">
        <button className="new-brand" onClick={() => setActiveTab('match')}>
          <span className="brand-emblem"><BrandMark /></span>
          <span className="brand-copy"><strong>صراع النخبة</strong><small>CLASH OF ELITES</small></span>
        </button>
        <div className="mobile-top-actions">
          <button onClick={onOpenTeamsModal} aria-label="إدارة الفرق"><Users /></button>
          {onOpenSettingsModal && <button onClick={onOpenSettingsModal} aria-label="إعدادات الدوري"><Settings2 /></button>}
          <button onClick={onOpenMobileConnectModal} aria-label="ربط الهاتف"><Smartphone /></button>
          {onToggleStageView && <button onClick={onToggleStageView} aria-label="وضع المسرح"><Tv /></button>}
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="التنقل الرئيسي">{renderNav(true)}</nav>
    </>
  );
};
