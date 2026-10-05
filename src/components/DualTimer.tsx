import React, { useState, useEffect, useRef } from 'react';
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

  // High performance refs for smooth, non-blocking time updates
  const teamAStartRef = useRef<number>(0);
  const teamBStartRef = useRef<number>(0);

  // Interval for Team A (50ms interval = lightweight 20fps without UI freeze)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (teamAActive) {
      teamAStartRef.current = Date.now() - teamAMs;
      interval = setInterval(() => {
        setTeamAMs(Date.now() - teamAStartRef.current);
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [teamAActive]);

  // Interval for Team B
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (teamBActive) {
      teamBStartRef.current = Date.now() - teamBMs;
      interval = setInterval(() => {
        setTeamBMs(Date.now() - teamBStartRef.current);
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [teamBActive]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedTimer, setExpandedTimer] = useState<'none' | 'countdown' | 'stopwatch'>('none');
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Team Stopwatch Handlers (Tap to start / Tap to finish)
  const handleToggleTeamA = () => {
    if (teamAActive) {
      sound.playPick('ban');
      setTeamAActive(false);
      setTeamAFinished(true);
    } else {
      sound.playPick('pick');
      if (teamAFinished) {
        setTeamAMs(0);
      }
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
      sound.playPick('ban');
      setTeamBActive(false);
      setTeamBFinished(true);
    } else {
      sound.playPick('pick');
      if (teamBFinished) {
        setTeamBMs(0);
      }
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
    sound.playPick('pick');
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

  // Keyboard Dual Battle Listeners (Team A = 'A', Team B = 'L' or 'Enter', ESC = close fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
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

      // Team B Duel Key: 'l', 'L', Arabic 'م', or 'Enter'
      if (e.key === 'l' || e.key === 'L' || e.key === 'م' || e.key === 'Enter') {
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
  const teamADiff = Math.abs(teamASecs - targetSeconds);
  const teamBDiff = Math.abs(teamBSecs - targetSeconds);

  const bothFinished = teamAFinished && teamBFinished && teamAMs > 0 && teamBMs > 0;
  const isTeamAWinner = bothFinished && teamADiff < teamBDiff;
  const isTeamBWinner = bothFinished && teamBDiff < teamADiff;
  const isDraw = bothFinished && Math.abs(teamADiff - teamBDiff) < 0.001;
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

  return (
    <div
      ref={containerRef}
      className={`w-full ${
        isStandalone ? 'min-h-screen bg-[#070B19] p-4 sm:p-8' : ''
      }`}
    >
      {/* Standalone Header if opened in secondary window */}
      {isStandalone && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center font-bold text-white font-orbitron text-sm shadow-lg">
              CE
            </div>
            <div>
              <h1 className="text-xl font-bold font-changa text-white">
                دوري صراع النخبة - واجهة الموقّت الميداني المستقلة
              </h1>
              <p className="text-xs text-slate-400">
                مؤقت تنازلي بصافرة رقمية وساعة إيقاف لحساب أجزاء الثانية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-purple-950/60 border-purple-500/60 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت الصافرة'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* DUAL TIMERS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. COUNTDOWN TIMER CARD */}
        <div className="bg-[#0C1226]/90 border border-slate-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Timer className="w-6 h-6" />
              <h2 className="text-lg font-bold font-changa text-white">
                المؤقت التنازلي (Countdown)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedTimer('countdown')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="تكبير شاشة المؤقت التنازلي على كامل الشاشة"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>تكبير الشاشة</span>
              </button>

              {!isStandalone && (
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl border text-xs transition-colors ${
                    soundEnabled
                      ? 'bg-purple-950/50 border-purple-700 text-purple-300'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                  title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت الصافرة'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Big Digital Display */}
          <div className="my-6 text-center">
            <div
              className={`font-orbitron font-black text-6xl sm:text-8xl md:text-9xl tracking-wider py-6 px-4 rounded-3xl border-2 transition-all ${
                countdownLeft <= 5 && countdownLeft > 0
                  ? 'bg-rose-950/40 border-rose-500 text-rose-400 shadow-[0_0_50px_rgba(244,63,94,0.4)] animate-pulse'
                  : countdownLeft === 0
                  ? 'bg-red-950/60 border-red-500 text-red-500 shadow-[0_0_60px_rgba(239,68,68,0.6)]'
                  : 'bg-[#050814] border-purple-900/60 text-purple-200 shadow-[0_0_40px_rgba(168,85,247,0.25)]'
              }`}
            >
              {formatCountdown(countdownLeft)}
            </div>

            {countdownLeft === 0 && (
              <div className="mt-3 text-red-400 font-bold font-changa text-base sm:text-lg animate-bounce">
                انتهى الوقت! (TIME OUT)
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="mb-6">
            <div className="text-xs text-slate-400 font-semibold mb-2 text-right">
              الأوقات السريعة الجاهزة:
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[
                { label: '15ث', sec: 15 },
                { label: '30ث', sec: 30 },
                { label: '45ث', sec: 45 },
                { label: '1د (60ث)', sec: 60 },
                { label: '90ث', sec: 90 },
                { label: '2د', sec: 120 },
                { label: '3د', sec: 180 },
                { label: '5د', sec: 300 },
              ].map((p) => (
                <button
                  key={p.sec}
                  onClick={() => setPreset(p.sec)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                    countdownInitial === p.sec && !countdownActive
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Large Field Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Start / Pause Big Button */}
            <button
              onClick={() => {
                sound.playTick();
                setCountdownActive(!countdownActive);
              }}
              className={`w-full flex-1 py-4 sm:py-5 px-6 rounded-2xl font-bold font-changa text-lg sm:text-xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${
                countdownActive
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/40'
              }`}
            >
              {countdownActive ? (
                <>
                  <Pause className="w-6 h-6 fill-white" />
                  <span>إيقاف مؤقت</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-white" />
                  <span>بدء العداد التنازلي</span>
                </>
              )}
            </button>

            {/* Stepper + / - 10s */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => adjustCountdown(-10)}
                className="flex-1 sm:flex-initial py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                title="خصم 10 ثوانٍ"
              >
                <Minus className="w-4 h-4" />
                <span>10ث</span>
              </button>
              <button
                onClick={() => adjustCountdown(10)}
                className="flex-1 sm:flex-initial py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                title="إضافة 10 ثوانٍ"
              >
                <Plus className="w-4 h-4" />
                <span>10ث</span>
              </button>

              {/* Reset */}
              <button
                onClick={() => {
                  sound.playTick();
                  setCountdownActive(false);
                  setCountdownLeft(countdownInitial);
                }}
                className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="إعادة ضبط العداد"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. STOP THE TIMER CHALLENGE CARD */}
        <div className="bg-[#0C1226]/90 border border-slate-800/90 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-changa text-white">
                  تحدي وقف المؤقت (Stop The Timer)
                </h2>
                <p className="text-[11px] text-slate-400 font-changa">
                  تحدي الوصول للثواني المستهدفة وإيقاف العداد بالرأس
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedTimer('stopwatch')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                title="تكبير شاشة التحدي على كامل الشاشة"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>تكبير الشاشة</span>
              </button>
            </div>
          </div>

          {/* TARGET SECONDS & BLIND CHALLENGE CONFIG BAR */}
          <div className="mb-6 p-4 rounded-2xl bg-[#070B1E] border border-cyan-900/60 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold font-changa text-xs sm:text-sm">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>الهدف (اكتب أي ثوانٍ تريدها):</span>
              </div>

              {/* Free Custom Number Input for Any Seconds (e.g. 1, 3.5, 10.2) */}
              <div className="flex items-center gap-1 bg-[#050814] px-2.5 py-1.5 rounded-xl border border-amber-500/50 shadow-inner">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="999"
                  value={targetSeconds}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTargetSeconds(isNaN(val) ? 0 : val);
                  }}
                  className="w-16 bg-transparent text-center font-orbitron font-black text-amber-300 text-base focus:outline-none"
                  placeholder="10"
                />
                <span className="text-xs text-amber-400 font-bold font-changa">ثانية</span>
              </div>

              {/* Increments / Decrements */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    sound.playTick();
                    setTargetSeconds((prev) => Math.max(0.5, parseFloat((prev - 0.5).toFixed(1))));
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold"
                  title="نقصان نصف ثانية (-0.5s)"
                >
                  -0.5ث
                </button>
                <button
                  onClick={() => {
                    sound.playTick();
                    setTargetSeconds((prev) => parseFloat((prev + 0.5).toFixed(1)));
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold"
                  title="زيادة نصف ثانية (+0.5s)"
                >
                  +0.5ث
                </button>
              </div>

              {/* Quick Sample Presets */}
              <div className="flex items-center gap-1">
                {[1, 3.5, 5, 7, 10].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      sound.playTick();
                      setTargetSeconds(sec);
                    }}
                    className={`py-1 px-2.5 rounded-xl text-xs font-bold font-orbitron transition-all ${
                      targetSeconds === sec
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {sec}ث
                  </button>
                ))}
              </div>
            </div>

            {/* Blind Mode Toggle (Immediate from start) */}
            <button
              onClick={() => {
                sound.playTick();
                setIsBlindChallenge(!isBlindChallenge);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                isBlindChallenge
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
              title="إخفاء الشاشة فوراً من بداية الضغط للتخمين بالرأس بدون النظر للمؤقت"
            >
              {isBlindChallenge ? <EyeOff className="w-4 h-4 text-purple-300" /> : <Eye className="w-4 h-4" />}
              <span>{isBlindChallenge ? 'وضع التحدي الأعمى: مخفي فوراً من البداية 🙈' : 'إخفاء الشاشة (مُعطّل)'}</span>
            </button>
          </div>

          {/* Winner Announcement Banner if both finished */}
          {bothFinished && (
            <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-cyan-500/20 border-2 border-amber-400 text-center animate-bounce-short shadow-lg">
              <div className="text-amber-300 font-black font-changa text-base sm:text-lg flex flex-wrap items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>الفائز بتحدي الـ {targetSeconds} ثوانٍ (الأقرب للهدف): </span>
                <span className="text-white text-xl underline underline-offset-4">
                  {winnerTeam?.name || 'تعادل تام!'}
                </span>
                {!isDraw && (
                  <span className="text-amber-300 text-xs font-mono">
                    (أقرب بفارق {winnerDiff} ثانية عن الهدف!)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SIMULTANEOUS DUAL LAUNCH & KEYBOARD GUIDE BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 border border-slate-700/80 mb-6">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={startBothSimultaneously}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black font-changa text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
                title="يبدأ عداد الفريقين معاً بنفس اللحظة بالضبط 0.00s، ثم يوقف كل لاعب دائرته بنفسه"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>⚡ انطلاق الفريقين معاً بنفس اللحظة</span>
              </button>

              <button
                type="button"
                onClick={resetBothTeams}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-changa font-bold flex items-center gap-1.5 transition-colors"
                title="تصفير توقيت الفريقين"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير الاثنين</span>
              </button>
            </div>

            {/* Hotkey Guide Pill */}
            <div className="text-[11px] sm:text-xs text-slate-300 font-changa flex flex-wrap items-center gap-2 bg-[#050814] px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-amber-400 font-bold">🎮 اللعب معاً بنفس اللحظة:</span>
              <span>فريق 1: مفتاح <kbd className="px-1.5 py-0.5 rounded bg-purple-900 border border-purple-500 text-white font-mono font-bold">A</kbd></span>
              <span className="text-slate-500">|</span>
              <span>فريق 2: مفتاح <kbd className="px-1.5 py-0.5 rounded bg-cyan-900 border border-cyan-500 text-white font-mono font-bold">L</kbd> أو <kbd className="px-1.5 py-0.5 rounded bg-cyan-900 border border-cyan-500 text-white font-mono font-bold">Enter</kbd></span>
            </div>
          </div>

          {/* GIANT CIRCULAR BUZZER BUTTONS (أزرار دائرية ضخمة جداً) */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center justify-items-center">
            {/* TEAM A CIRCULAR BUZZER */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamA?.color || '#A855F7' }} />
                <span className="font-changa font-bold text-sm text-purple-200">
                  {teamA?.name || 'الفريق الأول'}
                </span>
                {teamAFinished && (
                  <button
                    onClick={handleResetTeamA}
                    className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-700 text-xs flex items-center gap-1"
                    title="إعادة المحاولة"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إعادة</span>
                  </button>
                )}
              </div>

              {/* Circular Button with Touch & Click */}
              <button
                type="button"
                onClick={handleToggleTeamA}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleToggleTeamA();
                }}
                className={`w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-full border-4 sm:border-[6px] shadow-2xl transition-all duration-150 active:scale-90 flex flex-col items-center justify-center p-3 select-none relative cursor-pointer ${
                  teamAActive
                    ? 'bg-rose-950/90 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.7)] animate-pulse ring-8 ring-rose-500/20'
                    : teamAFinished
                    ? isTeamAWinner
                      ? 'bg-purple-950/90 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.6)] ring-8 ring-amber-400/30'
                      : 'bg-purple-950/70 border-purple-500/80 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                    : 'bg-gradient-to-br from-[#1A0E3D] via-[#110A26] to-[#070412] hover:from-purple-900/60 border-purple-500/80 hover:border-purple-300 shadow-[0_0_35px_rgba(168,85,247,0.4)]'
                }`}
              >
                {/* Inner Content */}
                {teamAActive ? (
                  isBlindChallenge ? (
                    <div className="flex flex-col items-center justify-center text-center animate-pulse">
                      <span className="text-4xl sm:text-5xl mb-1">🙈</span>
                      <span className="text-xs text-rose-300 font-black font-changa">التحدي الأعمى (مخفي فوراً)</span>
                      <span className="text-[11px] text-slate-300">خمّن الـ {targetSeconds}ث بالرأس</span>
                      <span className="mt-2 py-1 px-3.5 rounded-full bg-rose-600 text-white font-black font-changa text-xs shadow-md">
                        ⏹ انقر للإيقاف!
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="font-orbitron font-black text-3xl sm:text-4xl text-rose-100">
                        {teamASecs.toFixed(2)}s
                      </span>
                      <span className="mt-2 py-1 px-3 rounded-full bg-rose-600 text-white font-black font-changa text-xs shadow-md animate-pulse">
                        ⏹ انقر للإيقاف!
                      </span>
                    </div>
                  )
                ) : teamAFinished ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="font-orbitron font-black text-3xl sm:text-4xl text-purple-100">
                      {teamASecs.toFixed(2)}s
                    </span>
                    <span className="text-xs text-purple-300 font-mono mt-1">
                      فارق: {teamASecs >= targetSeconds ? '+' : ''}{(teamASecs - targetSeconds).toFixed(2)}ث
                    </span>
                    {isTeamAWinner && (
                      <span className="mt-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black font-changa text-xs shadow">
                        👑 الأقرب للهدف!
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 mt-2">انقر للإعادة</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center group-hover:scale-105 transition-transform">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/50 mb-2">
                      <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white translate-x-0.5" />
                    </div>
                    <span className="font-changa font-black text-base sm:text-lg text-white">
                      انقر للبدء
                    </span>
                    <span className="text-[11px] text-purple-300 font-mono mt-0.5">
                      الهدف: {targetSeconds} ثوانٍ
                    </span>
                  </div>
                )}
              </button>

              {/* Keyboard Cue Badge */}
              <div className="text-[11px] text-purple-300 font-mono font-bold bg-purple-950/70 px-3 py-1 rounded-full border border-purple-800/80 shadow">
                ⌨️ اضغط مفتاح [ A ] للبدء/الإيقاف
              </div>
            </div>

            {/* TEAM B CIRCULAR BUZZER */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamB?.color || '#06B6D4' }} />
                <span className="font-changa font-bold text-sm text-cyan-200">
                  {teamB?.name || 'الفريق الثاني'}
                </span>
                {teamBFinished && (
                  <button
                    onClick={handleResetTeamB}
                    className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-700 text-xs flex items-center gap-1"
                    title="إعادة المحاولة"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>إعادة</span>
                  </button>
                )}
              </div>

              {/* Circular Button with Touch & Click */}
              <button
                type="button"
                onClick={handleToggleTeamB}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleToggleTeamB();
                }}
                className={`w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-full border-4 sm:border-[6px] shadow-2xl transition-all duration-150 active:scale-90 flex flex-col items-center justify-center p-3 select-none relative cursor-pointer ${
                  teamBActive
                    ? 'bg-rose-950/90 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.7)] animate-pulse ring-8 ring-rose-500/20'
                    : teamBFinished
                    ? isTeamBWinner
                      ? 'bg-cyan-950/90 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.6)] ring-8 ring-amber-400/30'
                      : 'bg-cyan-950/70 border-cyan-500/80 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                    : 'bg-gradient-to-br from-[#0B2535] via-[#071624] to-[#040C14] hover:from-cyan-900/60 border-cyan-500/80 hover:border-cyan-300 shadow-[0_0_35px_rgba(6,182,212,0.4)]'
                }`}
              >
                {/* Inner Content */}
                {teamBActive ? (
                  isBlindChallenge ? (
                    <div className="flex flex-col items-center justify-center text-center animate-pulse">
                      <span className="text-4xl sm:text-5xl mb-1">🙈</span>
                      <span className="text-xs text-rose-300 font-black font-changa">التحدي الأعمى (مخفي فوراً)</span>
                      <span className="text-[11px] text-slate-300">خمّن الـ {targetSeconds}ث بالرأس</span>
                      <span className="mt-2 py-1 px-3.5 rounded-full bg-rose-600 text-white font-black font-changa text-xs shadow-md">
                        ⏹ انقر للإيقاف!
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="font-orbitron font-black text-3xl sm:text-4xl text-rose-100">
                        {teamBSecs.toFixed(2)}s
                      </span>
                      <span className="mt-2 py-1 px-3 rounded-full bg-rose-600 text-white font-black font-changa text-xs shadow-md animate-pulse">
                        ⏹ انقر للإيقاف!
                      </span>
                    </div>
                  )
                ) : teamBFinished ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <span className="font-orbitron font-black text-3xl sm:text-4xl text-cyan-100">
                      {teamBSecs.toFixed(2)}s
                    </span>
                    <span className="text-xs text-cyan-300 font-mono mt-1">
                      فارق: {teamBSecs >= targetSeconds ? '+' : ''}{(teamBSecs - targetSeconds).toFixed(2)}ث
                    </span>
                    {isTeamBWinner && (
                      <span className="mt-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black font-changa text-xs shadow">
                        👑 الأقرب للهدف!
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 mt-2">انقر للإعادة</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center group-hover:scale-105 transition-transform">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/50 mb-2">
                      <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white translate-x-0.5" />
                    </div>
                    <span className="font-changa font-black text-base sm:text-lg text-white">
                      انقر للبدء
                    </span>
                    <span className="text-[11px] text-cyan-300 font-mono mt-0.5">
                      الهدف: {targetSeconds} ثوانٍ
                    </span>
                  </div>
                )}
              </button>

              {/* Keyboard Cue Badge */}
              <div className="text-[11px] text-cyan-300 font-mono font-bold bg-cyan-950/70 px-3 py-1 rounded-full border border-cyan-800/80 shadow">
                ⌨️ اضغط مفتاح [ L أو Enter ] للبدء/الإيقاف
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* FULLSCREEN COUNTDOWN TIMER OVERLAY */}
      {expandedTimer === 'countdown' && (
        <div className="fixed inset-0 z-50 bg-[#040612] text-white flex flex-col justify-between p-4 sm:p-8 md:p-10 select-none animate-fade-in overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-600/40">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-changa text-white flex items-center gap-2">
                  <span>المؤقت التنازلي الميداني العملاق</span>
                  <span className="text-xs font-orbitron px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/50 text-purple-300">
                    FULLSCREEN ARENA
                  </span>
                </h2>
                <p className="text-xs text-purple-300/80 font-changa">
                  شاشة عرض مخصصة للصالات والبروجكتر وشاشات الـ LED
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  soundEnabled
                    ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="hidden sm:inline">{soundEnabled ? 'الصافرة مفعلة' : 'مكتوم'}</span>
              </button>

              <button
                onClick={() => setExpandedTimer('none')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95"
                title="خروج من التكبير (ESC)"
              >
                <Minimize2 className="w-4 h-4" />
                <span>تصغير الشاشة (ESC)</span>
              </button>
            </div>
          </div>

          {/* Central Mega Digits Display */}
          <div className="flex-1 flex flex-col items-center justify-center my-auto py-6 relative">
            <div
              className={`w-full max-w-5xl py-8 sm:py-12 px-6 rounded-3xl border-2 transition-colors text-center flex flex-col items-center justify-center ${
                countdownLeft <= 5 && countdownLeft > 0
                  ? 'bg-rose-950/70 border-rose-500 text-rose-300 shadow-[0_0_50px_rgba(244,63,94,0.4)] animate-pulse'
                  : countdownLeft === 0
                  ? 'bg-red-950/80 border-red-500 text-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)]'
                  : 'bg-[#060818] border-purple-600/70 text-purple-100 shadow-[0_0_50px_rgba(168,85,247,0.25)]'
              }`}
            >
              <span className="font-orbitron font-black text-7xl sm:text-9xl md:text-[12rem] lg:text-[14rem] leading-none tracking-wider select-none">
                {formatCountdown(countdownLeft)}
              </span>

              {countdownLeft === 0 && (
                <div className="mt-4 text-red-400 font-black font-changa text-2xl sm:text-4xl animate-bounce tracking-wide">
                  انتهى الوقت! (TIME OUT)
                </div>
              )}
            </div>

            {/* Adjustment (+10s / -10s) */}
            <div className="flex items-center gap-3 mt-4 relative z-10">
              <button
                onClick={() => adjustCountdown(10)}
                className="px-4 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>10 ثوانٍ</span>
              </button>
              <button
                onClick={() => adjustCountdown(-10)}
                className="px-4 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/50 text-purple-300 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>10 ثوانٍ</span>
              </button>
            </div>
          </div>

          {/* Quick Presets & Bottom Big Controls */}
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { label: '15ث', sec: 15 },
                { label: '30ث', sec: 30 },
                { label: '45ث', sec: 45 },
                { label: '1دقيقة', sec: 60 },
                { label: '90ثانية', sec: 90 },
                { label: 'دقيقتان', sec: 120 },
                { label: '3 دقائق', sec: 180 },
                { label: '5 دقائق', sec: 300 },
              ].map((p) => (
                <button
                  key={p.sec}
                  onClick={() => setPreset(p.sec)}
                  className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl border transition-all ${
                    countdownInitial === p.sec && !countdownActive
                      ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40 scale-105'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Giant Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  sound.playTick();
                  setCountdownActive(!countdownActive);
                }}
                className={`flex-1 py-5 px-8 rounded-2xl font-black font-changa text-xl sm:text-2xl flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-98 ${
                  countdownActive
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/40'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-600/50'
                }`}
              >
                {countdownActive ? (
                  <>
                    <Pause className="w-7 h-7 fill-slate-950" />
                    <span>إيقاف المؤقت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-7 h-7 fill-white" />
                    <span>بدء العداد التنازلي</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  sound.playTick();
                  setCountdownActive(false);
                  setCountdownLeft(countdownInitial);
                }}
                className="py-5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-slate-300 transition-colors"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN STOPWATCH OVERLAY */}
      {expandedTimer === 'stopwatch' && (
        <div className="fixed inset-0 z-50 bg-[#020713] text-white flex flex-col justify-between p-4 sm:p-8 md:p-10 select-none animate-fade-in overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-500/50 flex items-center justify-center font-bold text-white shadow-lg">
                <Target className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black font-changa text-white flex items-center gap-2">
                  <span>تحدي وقف المؤقت الميداني (Stop The Timer)</span>
                  <span className="text-xs font-orbitron px-2 py-0.5 rounded-full bg-cyan-900/60 border border-cyan-500/50 text-cyan-300">
                    ARENA DUEL
                  </span>
                </h2>
                <p className="text-xs text-cyan-300/80 font-changa">
                  تحدي الوصول للثواني المستهدفة وإيقاف العداد بالرأس
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setExpandedTimer('none')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all hover:scale-105 active:scale-95"
                title="خروج من التكبير (ESC)"
              >
                <Minimize2 className="w-4 h-4" />
                <span>تصغير الشاشة (ESC)</span>
              </button>
            </div>
          </div>

          {/* Split Team Records for Field Challenges (MEGA CIRCULAR BUZZER BUTTONS) */}
          <div className="max-w-5xl mx-auto w-full my-auto space-y-4">
            {/* Target Settings Bar in Fullscreen */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#070B1E]/90 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex flex-wrap items-center gap-2.5">
                <Target className="w-5 h-5 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold font-changa text-amber-300">
                  هدف التحدي (اكتب أي ثوانٍ):
                </span>

                {/* Free Custom Number Input */}
                <div className="flex items-center gap-1 bg-[#050814] px-2.5 py-1 rounded-xl border border-amber-500/50 shadow-inner">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="999"
                    value={targetSeconds}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTargetSeconds(isNaN(val) ? 0 : val);
                    }}
                    className="w-16 bg-transparent text-center font-orbitron font-black text-amber-300 text-base focus:outline-none"
                    placeholder="10"
                  />
                  <span className="text-xs text-amber-400 font-bold font-changa">ثانية</span>
                </div>

                {/* Increments */}
                <button
                  onClick={() => {
                    sound.playTick();
                    setTargetSeconds((prev) => Math.max(0.5, parseFloat((prev - 0.5).toFixed(1))));
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold"
                >
                  -0.5ث
                </button>
                <button
                  onClick={() => {
                    sound.playTick();
                    setTargetSeconds((prev) => parseFloat((prev + 0.5).toFixed(1)));
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold"
                >
                  +0.5ث
                </button>

                {[1, 3.5, 5, 7, 10].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      sound.playTick();
                      setTargetSeconds(sec);
                    }}
                    className={`py-1 px-3 rounded-xl text-xs font-bold font-orbitron transition-all ${
                      targetSeconds === sec
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md scale-105'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {sec}ث
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  sound.playTick();
                  setIsBlindChallenge(!isBlindChallenge);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isBlindChallenge
                    ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {isBlindChallenge ? <EyeOff className="w-4 h-4 text-purple-300" /> : <Eye className="w-4 h-4" />}
                <span>{isBlindChallenge ? 'وضع التحدي الأعمى: مخفي فوراً من البداية 🙈' : 'إخفاء الشاشة (مُعطّل)'}</span>
              </button>
            </div>

            {/* Winner Announcement Banner if both finished */}
            {bothFinished && (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/30 via-purple-600/30 to-cyan-500/30 border-2 border-amber-400 text-center animate-bounce-short shadow-2xl">
                <div className="text-amber-300 font-black font-changa text-lg sm:text-xl flex items-center justify-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <span>الفائز بتحدي الـ {targetSeconds} ثوانٍ (الأقرب للهدف): </span>
                  <span className="text-white text-2xl underline underline-offset-4">
                    {winnerTeam?.name || 'تعادل تام!'}
                  </span>
                  {!isDraw && (
                    <span className="text-amber-300 text-sm font-mono">
                      (أقرب بفارق {winnerDiff} ثانية عن الهدف!)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Simultaneous Dual Launch Bar in Fullscreen */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 border border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={startBothSimultaneously}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black font-changa text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
                  title="يبدأ عداد الفريقين معاً بنفس اللحظة بالضبط 0.00s"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>⚡ انطلاق الفريقين معاً بنفس اللحظة</span>
                </button>

                <button
                  type="button"
                  onClick={resetBothTeams}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-changa font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تصفير الاثنين</span>
                </button>
              </div>

              <div className="text-xs text-slate-300 font-changa flex items-center gap-2 bg-[#050814] px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-amber-400 font-bold">🎮 اللعب معاً بالكيبورد:</span>
                <span>فريق 1: مفتاح <kbd className="px-1.5 py-0.5 rounded bg-purple-900 border border-purple-500 text-white font-mono font-bold">A</kbd></span>
                <span className="text-slate-500">|</span>
                <span>فريق 2: مفتاح <kbd className="px-1.5 py-0.5 rounded bg-cyan-900 border border-cyan-500 text-white font-mono font-bold">L</kbd> أو <kbd className="px-1.5 py-0.5 rounded bg-cyan-900 border border-cyan-500 text-white font-mono font-bold">Enter</kbd></span>
              </div>
            </div>

            {/* TWO GIANT FULLSCREEN CIRCULAR BUZZERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-items-center my-2">
              {/* Team A Fullscreen Giant Circle */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: teamA?.color || '#A855F7' }} />
                  <h3 className="text-base sm:text-lg font-black font-changa text-purple-200">
                    {teamA?.name || 'الفريق الأول'} ({teamA?.shortName})
                  </h3>
                  {teamAFinished && (
                    <button
                      onClick={handleResetTeamA}
                      className="px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleTeamA}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleToggleTeamA();
                  }}
                  className={`w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border-[6px] shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-150 active:scale-95 flex flex-col items-center justify-center p-4 select-none relative cursor-pointer ${
                    teamAActive
                      ? 'bg-rose-950/95 border-rose-500 shadow-[0_0_70px_rgba(244,63,94,0.8)] animate-pulse ring-12 ring-rose-500/20'
                      : teamAFinished
                      ? isTeamAWinner
                        ? 'bg-purple-950/95 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.7)] ring-12 ring-amber-400/30'
                        : 'bg-purple-950/80 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.4)]'
                      : 'bg-gradient-to-br from-[#1C0E42] via-[#12092B] to-[#070414] hover:from-purple-900/60 border-purple-500 hover:border-purple-300 shadow-[0_0_45px_rgba(168,85,247,0.5)]'
                  }`}
                >
                  {teamAActive ? (
                    isBlindChallenge ? (
                      <div className="flex flex-col items-center justify-center text-center animate-pulse">
                        <span className="text-4xl sm:text-5xl mb-2">🙈</span>
                        <span className="text-sm sm:text-base text-rose-300 font-black font-changa">
                          التحدي الأعمى (مخفي فوراً)
                        </span>
                        <span className="text-xs text-slate-300 mt-1">خمّن الـ {targetSeconds} ثوانٍ بالرأس</span>
                        <span className="mt-3 py-1.5 px-4 rounded-full bg-rose-600 text-white font-black font-changa text-sm sm:text-base shadow-xl">
                          ⏹ انقر للإيقاف!
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl text-rose-100">
                          {teamASecs.toFixed(2)}s
                        </span>
                        <span className="mt-3 py-1.5 px-4 rounded-full bg-rose-600 text-white font-black font-changa text-sm shadow-xl animate-pulse">
                          ⏹ انقر للإيقاف!
                        </span>
                      </div>
                    )
                  ) : teamAFinished ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl text-purple-100">
                        {teamASecs.toFixed(2)}s
                      </span>
                      <span className="text-xs sm:text-sm text-purple-300 font-mono mt-1">
                        فارق: {teamASecs >= targetSeconds ? '+' : ''}{(teamASecs - targetSeconds).toFixed(2)}ث
                      </span>
                      {isTeamAWinner && (
                        <span className="mt-2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black font-changa text-sm shadow-lg">
                          👑 الأقرب للهدف!
                        </span>
                      )}
                      <span className="text-xs text-slate-400 mt-3">انقر للإعادة</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center group-hover:scale-105 transition-transform">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-600 flex items-center justify-center shadow-2xl shadow-purple-600/60 mb-3">
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-1" />
                      </div>
                      <span className="font-changa font-black text-xl sm:text-2xl text-white">
                        انقر للبدء
                      </span>
                      <span className="text-xs sm:text-sm text-purple-300 font-mono mt-1">
                        الهدف: {targetSeconds} ثوانٍ
                      </span>
                    </div>
                  )}
                </button>

                {/* Keyboard Cue Badge */}
                <div className="text-xs text-purple-300 font-mono font-bold bg-purple-950/80 px-3 py-1 rounded-full border border-purple-800 shadow">
                  ⌨️ اضغط مفتاح [ A ] للبدء/الإيقاف
                </div>
              </div>

              {/* Team B Fullscreen Giant Circle */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: teamB?.color || '#06B6D4' }} />
                  <h3 className="text-base sm:text-lg font-black font-changa text-cyan-200">
                    {teamB?.name || 'الفريق الثاني'} ({teamB?.shortName})
                  </h3>
                  {teamBFinished && (
                    <button
                      onClick={handleResetTeamB}
                      className="px-2 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleTeamB}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleToggleTeamB();
                  }}
                  className={`w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border-[6px] shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-150 active:scale-95 flex flex-col items-center justify-center p-4 select-none relative cursor-pointer ${
                    teamBActive
                      ? 'bg-rose-950/95 border-rose-500 shadow-[0_0_70px_rgba(244,63,94,0.8)] animate-pulse ring-12 ring-rose-500/20'
                      : teamBFinished
                      ? isTeamBWinner
                        ? 'bg-cyan-950/95 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.7)] ring-12 ring-amber-400/30'
                        : 'bg-cyan-950/80 border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.4)]'
                      : 'bg-gradient-to-br from-[#0C293A] via-[#081B2B] to-[#040E17] hover:from-cyan-900/60 border-cyan-500 hover:border-cyan-300 shadow-[0_0_45px_rgba(6,182,212,0.5)]'
                  }`}
                >
                  {teamBActive ? (
                    isBlindChallenge ? (
                      <div className="flex flex-col items-center justify-center text-center animate-pulse">
                        <span className="text-4xl sm:text-5xl mb-2">🙈</span>
                        <span className="text-sm sm:text-base text-rose-300 font-black font-changa">
                          التحدي الأعمى (مخفي فوراً)
                        </span>
                        <span className="text-xs text-slate-300 mt-1">خمّن الـ {targetSeconds} ثوانٍ بالرأس</span>
                        <span className="mt-3 py-1.5 px-4 rounded-full bg-rose-600 text-white font-black font-changa text-sm sm:text-base shadow-xl">
                          ⏹ انقر للإيقاف!
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl text-rose-100">
                          {teamBSecs.toFixed(2)}s
                        </span>
                        <span className="mt-3 py-1.5 px-4 rounded-full bg-rose-600 text-white font-black font-changa text-sm shadow-xl animate-pulse">
                          ⏹ انقر للإيقاف!
                        </span>
                      </div>
                    )
                  ) : teamBFinished ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl text-cyan-100">
                        {teamBSecs.toFixed(2)}s
                      </span>
                      <span className="text-xs sm:text-sm text-cyan-300 font-mono mt-1">
                        فارق: {teamBSecs >= targetSeconds ? '+' : ''}{(teamBSecs - targetSeconds).toFixed(2)}ث
                      </span>
                      {isTeamBWinner && (
                        <span className="mt-2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black font-changa text-sm shadow-lg">
                          👑 الأقرب للهدف!
                        </span>
                      )}
                      <span className="text-xs text-slate-400 mt-3">انقر للإعادة</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center group-hover:scale-105 transition-transform">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cyan-600 flex items-center justify-center shadow-2xl shadow-cyan-600/60 mb-3">
                        <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-1" />
                      </div>
                      <span className="font-changa font-black text-xl sm:text-2xl text-white">
                        انقر للبدء
                      </span>
                      <span className="text-xs sm:text-sm text-cyan-300 font-mono mt-1">
                        الهدف: {targetSeconds} ثوانٍ
                      </span>
                    </div>
                  )}
                </button>

                {/* Keyboard Cue Badge */}
                <div className="text-xs text-cyan-300 font-mono font-bold bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800 shadow">
                  ⌨️ اضغط مفتاح [ L أو Enter ] للبدء/الإيقاف
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
