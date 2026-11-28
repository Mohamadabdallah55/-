import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Timer,
  Clock,
  Flag,
  Maximize2,
  Minimize2,
  Target,
  Eye,
  EyeOff,
  Trophy,
  Zap,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { Team } from '../types';
import { CinematicStage } from './CinematicStage';
import { TeamCrest } from './TeamCrest';
import './TimerArena.css';
import { revealWithGsap } from '../utils/gsapMotion';
import { broadcastMessage, subscribeToBroadcast } from '../utils/storage';

interface DualTimerProps {
  teamA?: Team;
  teamB?: Team;
  isStandalone?: boolean;
}

export const DualTimer: React.FC<DualTimerProps> = ({
  teamA,
  teamB,
  isStandalone = false,
}) => {
  // Countdown Timer State
  const [countdownInitial, setCountdownInitial] = useState<number>(60);
  const [countdownLeft, setCountdownLeft] = useState<number>(60);
  const [countdownActive, setCountdownActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Target Time & Blind Challenge State
  const [targetSeconds, setTargetSeconds] = useState<number>(10);
  const [isBlindChallenge, setIsBlindChallenge] = useState<boolean>(true);

  // Independent Team Stopwatch States (Big Tap-to-Start / Tap-to-Stop for Stop The Timer Challenge)
  const [teamAMs, setTeamAMs] = useState<number>(0);
  const [teamAActive, setTeamAActive] = useState<boolean>(false);
  const [teamAFinished, setTeamAFinished] = useState<boolean>(false);

  const [teamBMs, setTeamBMs] = useState<number>(0);
  const [teamBActive, setTeamBActive] = useState<boolean>(false);
  const [teamBFinished, setTeamBFinished] = useState<boolean>(false);

  // High performance refs for sub-millisecond accuracy (performance.now())
  const teamAStartRef = useRef<number>(0);
  const teamBStartRef = useRef<number>(0);

  // High-precision ~60fps (16ms) loop for Team A
  useEffect(() => {
    let rafId: number | null = null;
    if (teamAActive) {
      
      const tick = () => {
        setTeamAMs(Math.max(0, Math.round(performance.now() - teamAStartRef.current)));
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [teamAActive]);

  // High-precision ~60fps (16ms) loop for Team B
  useEffect(() => {
    let rafId: number | null = null;
    if (teamBActive) {
      
      const tick = () => {
        setTeamBMs(Math.max(0, Math.round(performance.now() - teamBStartRef.current)));
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [teamBActive]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedTimer, setExpandedTimer] = useState<'none' | 'countdown' | 'stopwatch'>('none');
  const containerRef = useRef<HTMLDivElement>(null);

  const remoteState = useRef({countdownInitial,teamAActive,teamBActive,teamAFinished,teamBFinished,teamAMs,teamBMs});
  remoteState.current={countdownInitial,teamAActive,teamBActive,teamAFinished,teamBFinished,teamAMs,teamBMs};
  useEffect(()=>{const change=()=>setIsFullscreen(Boolean(document.fullscreenElement));document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change)},[]);
  // Sync duel settings & status to the phone remote so Blind Mode, Target Time, and Lock states match automatically
  useEffect(() => {
    broadcastMessage('DUEL_STATE_SYNC', {
      targetSeconds,
      isBlindChallenge,
      teamAActive,
      teamAFinished,
      teamAMs: teamAFinished ? teamAMs : 0,
      teamBActive,
      teamBFinished,
      teamBMs: teamBFinished ? teamBMs : 0,
    });
  }, [
    targetSeconds,
    isBlindChallenge,
    teamAActive,
    teamAFinished,
    teamBActive,
    teamBFinished,
  ]);

  // Commands sent from the phone remote. Keeping this listener inside the timer
  // makes the same controls work in the main tab and the standalone timer screen.
  useEffect(() => subscribeToBroadcast((type, payload) => {
    const {countdownInitial,teamAActive,teamBActive,teamAFinished,teamBFinished,teamAMs,teamBMs}=remoteState.current;
    if (type === 'STOP_TIMER_P1') {
      if(!teamAActive || teamAFinished) return;
      sound.playPick('ban');
      const exactMs =
        payload && typeof (payload as { exactMs?: number }).exactMs === 'number'
          ? Math.max(10, Math.round((payload as { exactMs: number }).exactMs))
          : teamAActive
          ? Math.max(10, Math.round(performance.now() - teamAStartRef.current))
          : teamAMs;
      setTeamAActive(false);
      setTeamAMs(exactMs);
      setTeamAFinished(true);
      return;
    }
    if (type === 'STOP_TIMER_P2') {
      if(!teamBActive || teamBFinished) return;
      sound.playPick('ban');
      const exactMs =
        payload && typeof (payload as { exactMs?: number }).exactMs === 'number'
          ? Math.max(10, Math.round((payload as { exactMs: number }).exactMs))
          : teamBActive
          ? Math.max(10, Math.round(performance.now() - teamBStartRef.current))
          : teamBMs;
      setTeamBActive(false);
      setTeamBMs(exactMs);
      setTeamBFinished(true);
      return;
    }
    if (type !== 'TIMER_COMMAND' || !payload || typeof payload !== 'object') return;
    const command = payload as {
      action?: string;
      seconds?: number;
      delta?: number;
      target?: number;
      blind?: boolean;
      exactMs?: number;
      mode?: 'none' | 'countdown' | 'stopwatch';
    };
    const seconds = Math.max(1, Math.min(3600, Number(command.seconds) || countdownInitial));
    if (command.action === 'set') {
      setCountdownActive(false);
      setCountdownInitial(seconds);
      setCountdownLeft(seconds);
    }
    if (command.action === 'start') {
      setCountdownInitial(seconds);
      setCountdownLeft(seconds);
      setCountdownActive(true);
      setExpandedTimer('countdown');
    }
    if (command.action === 'resume') {
      setCountdownActive(true);
    }
    if (command.action === 'pause') {
      setCountdownActive(false);
    }
    if (command.action === 'reset') {
      setCountdownActive(false);
      setCountdownInitial(seconds);
      setCountdownLeft(seconds);
    }
    if (command.action === 'adjust' && typeof command.delta === 'number') {
      setCountdownLeft((prev) => Math.max(1, Math.min(3600, prev + command.delta!)));
    }
    if (command.action === 'set_target' && typeof command.target === 'number' && Number.isFinite(command.target) && !teamAActive && !teamBActive && !teamAFinished && !teamBFinished) {
      setTargetSeconds(Math.max(0.5, Math.min(300, command.target)));
    }
    if (command.action === 'set_blind' && typeof command.blind === 'boolean' && !teamAActive && !teamBActive && !teamAFinished && !teamBFinished) {
      setIsBlindChallenge(command.blind);
    }
    if (command.action === 'expand' && command.mode) {
      setExpandedTimer(command.mode);
    }
    if (command.action === 'duel_start_both') {
      if(teamAActive||teamBActive||teamAFinished||teamBFinished)return;
      sound.playPick('pick');
      teamAStartRef.current = teamBStartRef.current = performance.now();
      setTeamAMs(0);
      setTeamBMs(0);
      setTeamAFinished(false);
      setTeamBFinished(false);
      setTeamAActive(true);
      setTeamBActive(true);
      setExpandedTimer('stopwatch');
    }
    if (command.action === 'duel_reset_both') {
      sound.playTick();
      setTeamAActive(false);
      setTeamBActive(false);
      setTeamAFinished(false);
      setTeamBFinished(false);
      setTeamAMs(0);
      setTeamBMs(0);
    }
    if (command.action === 'duel_start_a') {
      if(teamAActive || teamAFinished) return;
      sound.playPick('pick');
      teamAStartRef.current = performance.now();
      setTeamAMs(0);
      setTeamAFinished(false);
      setTeamAActive(true);
    }
    if (command.action === 'duel_stop_a') {
      if(!teamAActive || teamAFinished) return;
      sound.playPick('ban');
      const finalMs =
        typeof command.exactMs === 'number' && command.exactMs > 0
          ? Math.round(command.exactMs)
          : Math.max(10, Math.round(performance.now() - teamAStartRef.current));
      setTeamAActive(false);
      setTeamAMs(finalMs);
      setTeamAFinished(true);
    }
    if (command.action === 'duel_reset_a') {
      sound.playTick();
      setTeamAActive(false);
      setTeamAFinished(false);
      setTeamAMs(0);
    }
    if (command.action === 'duel_start_b') {
      if(teamBActive || teamBFinished) return;
      sound.playPick('pick');
      teamBStartRef.current = performance.now();
      setTeamBMs(0);
      setTeamBFinished(false);
      setTeamBActive(true);
    }
    if (command.action === 'duel_stop_b') {
      if(!teamBActive || teamBFinished) return;
      sound.playPick('ban');
      const finalMs =
        typeof command.exactMs === 'number' && command.exactMs > 0
          ? Math.round(command.exactMs)
          : Math.max(10, Math.round(performance.now() - teamBStartRef.current));
      setTeamBActive(false);
      setTeamBMs(finalMs);
      setTeamBFinished(true);
    }
    if (command.action === 'duel_reset_b') {
      sound.playTick();
      setTeamBActive(false);
      setTeamBFinished(false);
      setTeamBMs(0);
    }
    if (command.action === 'duel_toggle_a') {
      duelStateRef.current.handleToggleTeamA();
    }
    if (command.action === 'duel_toggle_b') {
      duelStateRef.current.handleToggleTeamB();
    }
  }), []);

  useLayoutEffect(() => revealWithGsap(containerRef.current, '.timer-countdown-card, .timer-duel-card', {
    y: 30,
    stagger: 0.16,
    duration: 0.82,
  }), []);

  // Countdown Interval Ref (clean, does NOT trigger on countdownLeft)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (countdownActive) {
      interval = setInterval(() => {
        setCountdownLeft((prev) => {
          if (prev <= 1) {
            // Reached zero!
            if (soundEnabled) {
              sound.playBuzzer();
            }
            setCountdownActive(false);
            return 0;
          }
          if (prev <= 6 && prev > 1 && soundEnabled) {
            sound.playWarningBeep();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdownActive, soundEnabled]);

  // Format countdown mm:ss
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Team Stopwatch Handlers (1st Tap = Start, 2nd Tap = Stop & Lock until Reset)
  const handleToggleTeamA = () => {
    if (teamAActive) {
      const exactMs = Math.max(10, Math.round(performance.now() - teamAStartRef.current));
      sound.playPick('ban');
      setTeamAMs(exactMs);
      setTeamAActive(false);
      setTeamAFinished(true);
    } else if (teamAFinished) {
      // Locked after 2nd tap to protect result against accidental 3rd touch
      return;
    } else {
      sound.playPick('pick');
      teamAStartRef.current = performance.now();
      setTeamAMs(0);
      setTeamAFinished(false);
      setTeamAActive(true);
    }
  };

  const handleResetTeamA = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTick();
    setTeamAActive(false);
    setTeamAFinished(false);
    setTeamAMs(0);
  };

  const handleToggleTeamB = () => {
    if (teamBActive) {
      const exactMs = Math.max(10, Math.round(performance.now() - teamBStartRef.current));
      sound.playPick('ban');
      setTeamBMs(exactMs);
      setTeamBActive(false);
      setTeamBFinished(true);
    } else if (teamBFinished) {
      // Locked after 2nd tap to protect result against accidental 3rd touch
      return;
    } else {
      sound.playPick('pick');
      teamBStartRef.current = performance.now();
      setTeamBMs(0);
      setTeamBFinished(false);
      setTeamBActive(true);
    }
  };

  const handleResetTeamB = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTick();
    setTeamBActive(false);
    setTeamBFinished(false);
    setTeamBMs(0);
  };

  // Start Both Teams Simultaneously (انطلاق الفريقين معاً بنفس اللحظة)
  const startBothSimultaneously = () => {
    if(teamAActive||teamBActive||teamAFinished||teamBFinished)return;
    sound.playPick('pick');
    teamAStartRef.current = teamBStartRef.current = performance.now();
    setTeamAMs(0);
    setTeamBMs(0);
    setTeamAFinished(false);
    setTeamBFinished(false);
    setTeamAActive(true);
    setTeamBActive(true);
  };

  // Reset Both Teams Together
  const resetBothTeams = () => {
    sound.playTick();
    setTeamAActive(false);
    setTeamBActive(false);
    setTeamAFinished(false);
    setTeamBFinished(false);
    setTeamAMs(0);
    setTeamBMs(0);
  };

  // Stable ref for keyboard events to prevent re-attaching listeners and frame drops
  const duelStateRef = useRef({
    expandedTimer,
    teamAActive,
    teamBActive,
    handleToggleTeamA,
    handleToggleTeamB,
    startBothSimultaneously,
    setExpandedTimer,
  });

  duelStateRef.current = {
    expandedTimer,
    teamAActive,
    teamBActive,
    handleToggleTeamA,
    handleToggleTeamB,
    startBothSimultaneously,
    setExpandedTimer,
  };

  // Keyboard Dual Battle Listeners (Team A = 'A', Team B = 'L', ESC = close fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if(e.key==='Escape'&&duelStateRef.current.expandedTimer!=='none'){duelStateRef.current.setExpandedTimer('none');return;}
      if(e.repeat)return;
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement | null;
      const activeElement = document.activeElement as HTMLElement | null;
      if (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        Boolean(target.closest('button, a, select, [role="button"]'))
      )) {
        return;
      }
      if (activeElement && activeElement !== document.body && activeElement !== document.documentElement) {
        return;
      }

      if (e.key === 'Escape' && duelStateRef.current.expandedTimer !== 'none') {
        duelStateRef.current.setExpandedTimer('none');
        return;
      }

      // Team A Duel Key: 'A', 'a', Arabic 'ش'
      if (e.key === 'a' || e.key === 'A' || e.key === 'ش') {
        e.preventDefault();
        duelStateRef.current.handleToggleTeamA();
        return;
      }

      // Team B Duel Key: 'l', 'L', or Arabic 'م'. Enter stays available to app navigation.
      if (e.key === 'l' || e.key === 'L' || e.key === 'م') {
        e.preventDefault();
        duelStateRef.current.handleToggleTeamB();
        return;
      }

      // Space Key: start both together if neither is running
      if (e.code === 'Space') {
        if (!duelStateRef.current.teamAActive && !duelStateRef.current.teamBActive) {
          e.preventDefault();
          duelStateRef.current.startBothSimultaneously();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Target Time & Accuracy Calculations (من الأقرب للثواني المستهدفة)
  const teamASecs = teamAMs / 1000;
  const teamBSecs = teamBMs / 1000;
  const teamADiff = Math.abs(teamAMs - Math.round(targetSeconds*1000))/1000;
  const teamBDiff = Math.abs(teamBMs - Math.round(targetSeconds*1000))/1000;

  const bothFinished = teamAFinished && teamBFinished && teamAMs > 0 && teamBMs > 0;
  const isTeamAWinner = bothFinished && teamADiff < teamBDiff;
  const isTeamBWinner = bothFinished && teamBDiff < teamADiff;
  const isDraw = bothFinished && teamADiff === teamBDiff;
  const winnerTeam = isTeamAWinner ? teamA : isTeamBWinner ? teamB : null;
  const winnerDiff = bothFinished ? Math.min(teamADiff, teamBDiff).toFixed(2) : null;

  // Countdown Quick Presets
  const setPreset = (sec: number) => {
    sound.playTick();
    setCountdownActive(false);
    setCountdownInitial(sec);
    setCountdownLeft(sec);
  };

  const adjustCountdown = (delta: number) => {
    sound.playTick();
    setCountdownLeft((prev) => Math.max(0, prev + delta));
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    } catch {}
  };

  const locked = teamAActive||teamBActive||teamAFinished||teamBFinished;
  const toggleCountdown=()=>{if(countdownActive){setCountdownActive(false);return;}if(countdownLeft===0)setCountdownLeft(countdownInitial);setCountdownActive(true);};
  const resetCountdown=()=>{setCountdownActive(false);setCountdownLeft(countdownInitial);};
  const setTarget=(n:number)=>{if(!locked&&Number.isFinite(n))setTargetSeconds(Math.max(.5,Math.min(300,n)));};
  const soundControl=<button type="button" aria-label={soundEnabled?'كتم الصوت':'تفعيل الصوت'} onClick={()=>setSoundEnabled(!soundEnabled)}>{soundEnabled?<Volume2/>:<VolumeX/>}</button>;
  const countdownPanel=(large:boolean)=><section className={'ce-timer-panel ce-countdown '+(large?'ce-timer-large':'')} dir="rtl">
    <div className="ce-timer-back"><CinematicStage gold={false}/></div>
    <header className="ce-timer-head"><div><small>CLASH OF ELITES / COUNTDOWN</small><h2>المؤقت التنازلي</h2></div><div className="ce-timer-tools">{soundControl}<button aria-label={large?'إغلاق التكبير':'تكبير المؤقت'} onClick={()=>setExpandedTimer(large?'none':'countdown')}>{large?<Minimize2/>:<Maximize2/>}</button>{large&&<button onClick={toggleFullscreen} aria-label="ملء الشاشة الفعلي">{isFullscreen?<Minimize2/>:<Maximize2/>}</button>}</div></header>
    <div className={'ce-clock-face '+(countdownLeft<=5?'ce-clock-warning':'')}><div className="ce-clock-label">{countdownLeft===0?'انتهى الوقت':countdownActive?'الوقت المتبقي':'جاهز'}</div><div className="ce-clock-digits" dir="ltr">{formatCountdown(countdownLeft)}</div><div className="ce-clock-progress"><i style={{width:Math.min(100,100*countdownLeft/Math.max(1,countdownInitial))+'%'}}/></div></div>
    <div className="ce-timer-presets">{[15,30,45,60,90,120,180,300].map(sec=><button key={sec} onClick={()=>setPreset(sec)} aria-pressed={countdownInitial===sec}>{sec<60?sec+' ث':sec===90?'90 ث':sec/60+' د'}</button>)}</div>
    <div className="ce-timer-actions"><button className="ce-timer-primary" onClick={toggleCountdown}>{countdownActive?<Pause/>:<Play/>}{countdownActive?'إيقاف مؤقت':countdownLeft===0?'بدء من جديد':'بدء المؤقت'}</button><button onClick={()=>adjustCountdown(-10)}>-10 ث</button><button onClick={()=>adjustCountdown(10)}>+10 ث</button><button onClick={resetCountdown} aria-label="إعادة ضبط"><RotateCcw/></button></div>
  </section>;
  const duelPanel=(large:boolean)=><section className={'ce-timer-panel ce-duel '+(large?'ce-timer-large':'')} dir="rtl">
    <div className="ce-timer-back"><CinematicStage left={teamB?.color} right={teamA?.color} gold/></div>
    <header className="ce-timer-head"><div><small>CLASH OF ELITES / STOP THE TIMER</small><h2>وقف المؤقت</h2></div><div className="ce-timer-tools"><button onClick={()=>setExpandedTimer(large?'none':'stopwatch')} aria-label={large?'إغلاق التكبير':'تكبير تحدي وقف المؤقت'}>{large?<Minimize2/>:<Maximize2/>}</button>{large&&<button onClick={toggleFullscreen} aria-label="ملء الشاشة الفعلي">{isFullscreen?<Minimize2/>:<Maximize2/>}</button>}</div></header>
    <div className="ce-duel-settings"><label>الهدف بالثواني <input type="number" min=".5" max="300" step=".1" value={targetSeconds} disabled={locked} onChange={e=>setTarget(Number(e.target.value))}/></label><div className="ce-timer-presets">{[1,3.5,5,7,10].map(n=><button key={n} disabled={locked} onClick={()=>setTarget(n)} aria-pressed={targetSeconds===n}>{n}</button>)}</div><button disabled={locked} onClick={()=>setIsBlindChallenge(!isBlindChallenge)}>{isBlindChallenge?<EyeOff/>:<Eye/>}{isBlindChallenge?'الوقت مخفي':'الوقت ظاهر'}</button></div>
    <div className="ce-duel-players">{([teamA,teamB] as const).map((team,i)=>{const a=i===0,active=a?teamAActive:teamBActive,finished=a?teamAFinished:teamBFinished,ms=a?teamAMs:teamBMs,win=a?isTeamAWinner:isTeamBWinner;return <div className="ce-duel-player" key={i} style={{'--duel-team':team?.color||(a?'#a855f7':'#06b6d4')} as React.CSSProperties}><div className="ce-duel-name"><TeamCrest team={team} className="ce-duel-crest"/><strong>{team?.name||(a?'الفريق الأول':'الفريق الثاني')}</strong></div><button type="button" disabled={finished} className={'ce-duel-pad '+(active?'ce-duel-running':finished?'ce-duel-done':'')+(win?' ce-duel-win':'')} onClick={a?handleToggleTeamA:handleToggleTeamB}><span>{finished?'النتيجة مقفلة':active?'اضغط للإيقاف':'اضغط للبدء'}</span><b dir="ltr">{active&&isBlindChallenge?'••••':(ms/1000).toFixed(2)}</b><small>{finished?'الفارق '+Math.abs(ms/1000-targetSeconds).toFixed(3)+' ث':active&&isBlindChallenge?'الوقت مخفي': 'ثانية'}</small></button><div className="ce-duel-key" dir="ltr">{a?'A':'L'}</div><button className="ce-duel-reset" onClick={a?handleResetTeamA:handleResetTeamB}><RotateCcw size={16}/> إعادة</button></div>})}</div>
    {bothFinished&&<div className="ce-duel-result" role="status"><Trophy/>{isDraw?'تعادل تام':(winnerTeam?.name||(isTeamAWinner?'الفريق الأول':'الفريق الثاني'))+' — الأقرب للهدف'}{!isDraw&&<small>الفارق {Math.min(teamADiff,teamBDiff).toFixed(3)} ثانية</small>}</div>}
    <div className="ce-timer-actions"><button className="ce-timer-primary" disabled={locked} onClick={startBothSimultaneously}><Zap/> انطلاق الفريقين معًا</button><button onClick={resetBothTeams}><RotateCcw/> إعادة التحدي</button></div>
  </section>;
  return <div ref={containerRef} className={'ce-timer-root '+(isStandalone?'ce-timer-standalone':'')}>
    <div className="ce-timer-layout">{countdownPanel(false)}{duelPanel(false)}</div>
    {expandedTimer!=='none'&&<div className="ce-timer-overlay" role="dialog" aria-modal="true" aria-label={expandedTimer==='countdown'?'عرض المؤقت':'عرض وقف المؤقت'}>{expandedTimer==='countdown'?countdownPanel(true):duelPanel(true)}</div>}
  </div>;
};
