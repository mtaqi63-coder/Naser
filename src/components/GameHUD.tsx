/**
 * Interactive Arabic HUD & Control Overlay for Nasser's Palm Road Adventure
 * Built with Tailwind CSS, Lucide icons, responsive touch controls,
 * and ergonomic collapsible bottom dock.
 */
import React, { useState, useEffect } from 'react';
import {
  Heart,
  Trophy,
  Volume2,
  VolumeX,
  Eye,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  HelpCircle,
  X,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Wind,
  Sun,
  Moon,
  CloudSun,
} from 'lucide-react';
import { GameState, CameraViewMode, TimeOfDayPreset } from '../game/GameEngine';
import { soundManager } from '../audio/soundManager';

interface GameHUDProps {
  gameState: GameState;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onHug: () => void;
  onStrike: () => void;
  onSwordStrike?: () => void;
  onSelectStage?: (stage: 1 | 2) => void;
  onShoutYaAli: () => void;
  onRestart: () => void;
  onRestartFromBeginning?: () => void;
  onTogglePause: () => void;
  onChangeCamera: (mode: CameraViewMode) => void;
  onResetCamera: () => void;
  onChangeWeatherPreset: (preset: TimeOfDayPreset) => void;
  currentCamera: CameraViewMode;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  onMoveLeft,
  onMoveRight,
  onJump,
  onHug,
  onStrike,
  onSwordStrike,
  onSelectStage,
  onShoutYaAli,
  onRestart,
  onRestartFromBeginning,
  onTogglePause,
  onChangeCamera,
  onResetCamera,
  onChangeWeatherPreset,
  currentCamera,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: string } | null>(null);

  // Sync notifications
  useEffect(() => {
    if (gameState.notification) {
      setToast({
        text: gameState.notification.text,
        type: gameState.notification.type,
      });
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [gameState.notification]);

  const handleToggleMute = () => {
    soundManager.init();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const cycleCamera = () => {
    const modes: CameraViewMode[] = ['chase', 'firstPerson', 'shoulder', 'overhead', 'free'];
    const nextIdx = (modes.indexOf(currentCamera) + 1) % modes.length;
    onChangeCamera(modes[nextIdx]);
  };

  const cycleWeather = () => {
    const presets: TimeOfDayPreset[] = ['auto', 'morning', 'noon', 'sunset', 'night'];
    const curr = gameState.weather?.preset || 'auto';
    const nextIdx = (presets.indexOf(curr) + 1) % presets.length;
    onChangeWeatherPreset(presets[nextIdx]);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // First key interaction warms up audio
      soundManager.init();

      if (e.key === 'v' || e.key === 'V' || e.key === 'ي' || ((e.key === ' ' || e.key === 'Enter') && gameState.isAtFortressGate && !gameState.gateTorn)) {
        e.preventDefault();
        onShoutYaAli();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        // In RTL Arabic layout: ArrowRight steers right lane
        onMoveRight();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        onMoveLeft();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        onJump();
      } else if (e.key === 'e' || e.key === 'E' || e.key === '1' || e.key === 'ع') {
        onHug();
      } else if (e.key === 'q' || e.key === 'Q' || e.key === '2' || e.key === 'ض') {
        if (gameState.stage === 2 || gameState.hasSword) {
          if (onSwordStrike) onSwordStrike();
          else onStrike();
        } else {
          onStrike();
        }
      } else if (e.key === 'p' || e.key === 'P') {
        onTogglePause();
      } else if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'ؤ') {
        cycleCamera();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'ق') {
        onResetCamera();
      } else if (e.key === 't' || e.key === 'T' || e.key === 'ف') {
        cycleWeather();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMoveLeft, onMoveRight, onJump, onHug, onStrike, onSwordStrike, onShoutYaAli, onTogglePause, currentCamera, onChangeCamera, onResetCamera, gameState.weather?.preset, onChangeWeatherPreset, gameState.isAtFortressGate, gameState.gateTorn, gameState.stage, gameState.hasSword]);

  const totalProgress = gameState.loyalPassed + gameState.enemyPassed;
  const progressPercent = Math.min(100, Math.round((totalProgress / gameState.totalEncountersTarget) * 100));

  const getStage2ProgressPercent = () => {
    if (gameState.catapultDestroyed) return 100;
    if (gameState.stage2Phase === 'catapult') return 85;
    if (gameState.stage2Phase === 'gate3') return 70;
    if (gameState.stage2Phase === 'tanks') {
      return 40 + Math.round(((gameState.tanksDefeated || 0) / 5) * 30);
    }
    if (gameState.stage2Phase === 'gate2') return 30;
    // knights phase
    return Math.round(((gameState.knightsDefeated || 0) / 5) * 25);
  };

  // Health color
  const getHealthColor = () => {
    if (gameState.health > 50) return 'bg-emerald-500';
    if (gameState.health > 25) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 sm:p-5 font-sans overflow-hidden">
      {/* --------------------------------------------------------------------- */}
      {/* TOP REGION: Stats Header + Top Docked Notifications (Never in center)  */}
      {/* --------------------------------------------------------------------- */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-2 pointer-events-none">
        <header className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between gap-3 bg-neutral-900/85 backdrop-blur-md border border-neutral-700/60 rounded-2xl p-3 shadow-xl pointer-events-auto">
            {/* Nasser Balance (رصيد ناصر) */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700">
                <Heart className={`w-6 h-6 ${gameState.health > 25 ? 'text-rose-400' : 'text-rose-500 animate-pulse'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-300 font-medium">رصيد ناصر</span>
                  <span className="text-base font-extrabold text-white tracking-tight">{gameState.health} / 100</span>
                </div>
                <div className="w-28 sm:w-36 h-2.5 bg-neutral-800 rounded-full overflow-hidden mt-1 p-0.5 border border-neutral-700">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getHealthColor()}`}
                    style={{ width: `${gameState.health}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Counters: Stage 1 (Loyal / Enemy) vs Stage 2 (Knights / Tanks) */}
            {gameState.stage === 1 ? (
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-600/40 text-emerald-200">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>الموالون:</span>
                  <span className="font-bold text-white text-base">{gameState.loyalPassed} / 5</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-600/40 text-rose-200">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>المعادون:</span>
                  <span className="font-bold text-white text-base">{gameState.enemyPassed} / 5</span>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-600/50 text-slate-200">
                  <span className="text-base">🛡️</span>
                  <span>الفرسان المدرعون:</span>
                  <span className="font-bold text-white text-base">{gameState.knightsDefeated || 0} / 5</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-600/50 text-amber-200">
                  <span className="text-base">🪵</span>
                  <span>الدبابات:</span>
                  <span className="font-bold text-white text-base">{gameState.tanksDefeated || 0} / 5</span>
                </div>
              </div>
            )}

            {/* Live Weather & Wind Badge */}
            {gameState.weather && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-xs shadow-inner">
                <span className="text-amber-300 font-bold">{gameState.weather.timeOfDayLabel}</span>
                <span className="text-neutral-500">|</span>
                <span className="text-teal-300 font-bold flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  {gameState.weather.windSpeedLabel}
                </span>
              </div>
            )}

            {/* Score, Stage Switcher & Controls */}
            <div className="flex items-center gap-2">
              {onSelectStage && (
                <button
                  onClick={() => onSelectStage(gameState.stage === 1 ? 2 : 1)}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="التبديل بين المرحلة الأولى والثانية"
                >
                  <span>{gameState.stage === 1 ? '🌴 المرحلة 1' : '⚔️ المرحلة 2'}</span>
                </button>
              )}

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-200">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-base">{gameState.score}</span>
              </div>

              <button
                onClick={handleToggleMute}
                title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              </button>

              <button
                onClick={onTogglePause}
                title={gameState.isPaused ? 'استئناف' : 'إيقاف مؤقت'}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
              >
                {gameState.isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setShowHelpModal(true)}
                title="تعليمات اللعبة"
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-5 h-5 text-amber-300" />
              </button>
            </div>
          </div>

          {/* Road Progress Bar (Stage 1 Palm Road vs Stage 2 Fortress Citadel) */}
          {gameState.stage === 1 ? (
            <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 rounded-xl px-3 py-1.5 flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold whitespace-nowrap">
                <span>مسار المرحلة 1:</span>
                <span>{totalProgress} من 10 عابرين</span>
              </div>
              <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
                <div
                  className="h-full bg-gradient-to-l from-emerald-400 to-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-amber-300 font-bold whitespace-nowrap">🏰 بوابة الحصن</span>
            </div>
          ) : (
            <div className="bg-neutral-900/80 backdrop-blur-sm border border-neutral-700/50 rounded-xl px-3 py-1.5 flex items-center gap-3 pointer-events-auto">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold whitespace-nowrap">
                <span>المرحلة 2 (اقتحام الحصن):</span>
                <span className="font-bold text-white">
                  {gameState.stage2Phase === 'knights'
                    ? `قتال الفرسان (${gameState.knightsDefeated || 0}/5)`
                    : gameState.stage2Phase === 'gate2'
                    ? 'بوابة الحصن 2'
                    : gameState.stage2Phase === 'tanks'
                    ? `تحطيم الدبابات (${gameState.tanksDefeated || 0}/5)`
                    : gameState.stage2Phase === 'gate3'
                    ? 'بوابة الحصن 3'
                    : 'ساحة المنجنيق 💥'}
                </span>
              </div>
              <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
                <div
                  className="h-full bg-gradient-to-l from-amber-400 via-orange-500 to-rose-500 rounded-full transition-all duration-300"
                  style={{ width: `${getStage2ProgressPercent()}%` }}
                />
              </div>
              <span className="text-xs text-rose-400 font-bold whitespace-nowrap">💥 تحطيم المنجنيق</span>
            </div>
          )}
        </header>

        {/* ACTIVE ENCOUNTER TOP BANNER - Docked right under header, not in center */}
        {gameState.activePrompt && gameState.activePrompt.visible && !gameState.isGameOver && !gameState.isVictory && (
          <div className="self-center w-full max-w-xl pointer-events-auto animate-fade-in">
            <div
              className={`px-3.5 py-2 rounded-xl border shadow-xl backdrop-blur-md flex items-center justify-between gap-3 transition-all ${
                gameState.activePrompt.npcType === 'loyal'
                  ? 'bg-emerald-950/95 border-emerald-400/80 text-emerald-100 shadow-emerald-950/40'
                  : 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {gameState.activePrompt.npcType === 'loyal' ? '✨' : '🔥'}
                </span>
                <span className="text-xs sm:text-sm font-black">
                  {gameState.activePrompt.npcName}
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {gameState.activePrompt.phrase}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black shadow-sm ${
                  gameState.activePrompt.npcType === 'loyal'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {gameState.activePrompt.npcType === 'loyal' ? 'اصطدم به لتربح!' : 'تجنبه ولا تصطدم به!'}
                </span>
                <span className="text-[11px] text-neutral-300 hidden sm:inline">
                  {gameState.activePrompt.distance}م
                </span>
              </div>
            </div>
          </div>
        )}

        {/* FORTRESS GATE TOP CALLOUT BANNER ("الغي زر ناد: ياعلي") */}
        {gameState.isAtFortressGate && !gameState.gateTorn && (
          <div className="self-center w-full max-w-xl pointer-events-auto animate-bounce-in">
            <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-950/95 via-stone-900/95 to-amber-950/95 border-2 border-amber-400 text-amber-100 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-pulse">🏰</span>
                <div>
                  <div className="text-xs sm:text-sm font-black text-amber-300">
                    يقف ناصر أمام بوابة الحصن المنيعة!
                  </div>
                  <div className="text-[11px] text-amber-200">
                    البوابة مغلقة ومحكمة.. المس ناصر ليصدح «يا علي!» فتنقلع البوابة وتلقى بعيداً!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING TOAST NOTIFICATION - Docked at top */}
        {toast && (
          <div className="self-center pointer-events-auto animate-bounce-in">
            <div
              className={`px-4 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2 ${
                toast.type === 'success'
                  ? 'bg-emerald-900/95 border-emerald-500 text-emerald-100 shadow-emerald-950/40'
                  : toast.type === 'danger'
                  ? 'bg-rose-900/95 border-rose-500 text-rose-100 shadow-rose-950/40'
                  : toast.type === 'warning'
                  ? 'bg-amber-900/95 border-amber-500 text-amber-100 shadow-amber-950/40'
                  : 'bg-neutral-900/95 border-neutral-600 text-neutral-100'
              }`}
            >
              <span>{toast.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* CLEAR VIEWPORT CENTER: 100% completely open view, zero obstruction    */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 pointer-events-none" />

      {/* --------------------------------------------------------------------- */}
      {/* BOTTOM REGION: Touch Drag Guidance + Collapsible Dock                 */}
      {/* --------------------------------------------------------------------- */}
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center pointer-events-none">
        {/* Tactile drag hint pill placed at bottom right above the dock */}
        <div className="mb-1 pointer-events-none">
          <div className="px-3.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md border border-neutral-700/60 text-neutral-300 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-md">
            {gameState.stage === 2 ? (
              <>
                <span className="text-amber-400">⚔️</span>
                <span>انقر مرتين على ظهر ناصر للضرب بالسيف وصراخ «يا علي!» • اسحب للأعلى للقفز ويميناً/يساراً للتفادي</span>
              </>
            ) : (
              <>
                <span className="text-amber-400">👆</span>
                <span>المس ناصر وجره يميناً ويساراً للتوجيه • اسحب للأعلى للقفز فوق الحفر</span>
              </>
            )}
          </div>
        </div>

        <footer className="w-full flex flex-col items-center pointer-events-auto">
        {/* Toggle Collapse Pill */}
        <button
          onClick={() => setIsDockCollapsed((prev) => !prev)}
          className="mb-1 px-3 py-1 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 text-xs font-medium flex items-center gap-1.5 shadow-md transition-colors"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>إظهار لوحة التحكم [H]</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>إخفاء لوحة التحكم [H]</span>
            </>
          )}
        </button>

        {/* The Dock */}
        {!isDockCollapsed && (
          <div className="w-full bg-neutral-900/90 backdrop-blur-md border border-neutral-700/70 rounded-2xl p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            {/* Camera View Switcher */}
            <div className="flex flex-wrap items-center gap-1 bg-neutral-800/80 p-1 rounded-xl border border-neutral-700">
              <span className="text-neutral-400 text-xs px-2 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                الكاميرا:
              </span>
              <button
                onClick={() => onChangeCamera('chase')}
                title="منظور المطاردة الثالث (الافتراضي)"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  currentCamera === 'chase'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                خلفي
              </button>
              <button
                onClick={() => onChangeCamera('firstPerson')}
                title="منظور الشخص الأول (عينا ناصر مباشرة)"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  currentCamera === 'firstPerson'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                شخص أول
              </button>
              <button
                onClick={() => onChangeCamera('shoulder')}
                title="منظور الكتف المقرب"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  currentCamera === 'shoulder'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                كتف
              </button>
              <button
                onClick={() => onChangeCamera('overhead')}
                title="منظور علوي بانورامي"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  currentCamera === 'overhead'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                علوي
              </button>
              <button
                onClick={() => onChangeCamera('free')}
                title="المنظور الحر (دوران 360 درجة بالسحب)"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  currentCamera === 'free'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                حر 360°
              </button>

              <button
                onClick={onResetCamera}
                title="إعادة ضبط الكاميرا إلى الزاوية الافتراضية [R]"
                className="px-2 py-1 rounded-lg text-xs font-medium text-amber-300 hover:text-white hover:bg-neutral-700/60 transition-colors flex items-center gap-1 border-r border-neutral-700 pr-2 mr-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>ضبط [R]</span>
              </button>
            </div>

            {/* Weather & Dynamic Lighting Switcher */}
            <div className="flex flex-wrap items-center gap-1 bg-neutral-800/80 p-1 rounded-xl border border-neutral-700">
              <span className="text-neutral-400 text-xs px-2 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                الطقس:
              </span>
              <button
                onClick={() => onChangeWeatherPreset('auto')}
                title="دورة طقس ديناميكية تلقائية مستمرة [T]"
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                  gameState.weather?.preset === 'auto'
                    ? 'bg-teal-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                🔄 تلقائي
              </button>
              <button
                onClick={() => onChangeWeatherPreset('morning')}
                title="شروق وصباح مشرق"
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                  gameState.weather?.preset === 'morning'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                🌅 شروق
              </button>
              <button
                onClick={() => onChangeWeatherPreset('noon')}
                title="ظهيرة مشمسة ساطعة"
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                  gameState.weather?.preset === 'noon'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                ☀️ ظهيرة
              </button>
              <button
                onClick={() => onChangeWeatherPreset('sunset')}
                title="أصيل وغروب بأشعة ذهبية دافئة"
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                  gameState.weather?.preset === 'sunset'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                🌇 غروب
              </button>
              <button
                onClick={() => onChangeWeatherPreset('night')}
                title="ليل قمري هادئ مع يراعات مضيئة"
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                  gameState.weather?.preset === 'night'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                🌙 ليل
              </button>
            </div>

            {/* Travelled Distance & Drag Hint */}
            <div className="flex items-center gap-3 text-neutral-300 font-medium">
              <span className="hidden md:inline-block text-[11px] text-neutral-400">
                ✋ اسحب الشاشة لتحريك الكاميرا بحرية
              </span>
              <div>
                المسافة: <span className="text-white font-bold">{gameState.distance} م</span>
              </div>
            </div>

            {/* Actions / Reset Shortcuts */}
            <div className="flex items-center gap-2">
              <button
                onClick={onRestart}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white flex items-center gap-1.5 transition-colors font-medium text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة البدء</span>
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>

      {/* --------------------------------------------------------------------- */}
      {/* VICTORY OVERLAY MODAL                                                 */}
      {/* --------------------------------------------------------------------- */}
      {gameState.isVictory && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto animate-fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-4">
              🏆
            </div>

            {gameState.stage === 2 ? (
              <>
                <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mb-2">
                  مبارك النصر المبين يا ناصر!
                </h2>
                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-6">
                  صدح ناصر بصوت مدوٍّ <strong>«يا علي!»</strong>، ودحر الفرسان الخمسة المدججين بالدروع، وحطم بوابة الحصن والدبابات الخشبية الخمس، واقتحم ساحة المنجنيق متفادياً قذائفه النارية حتى حطمه بسيفه، محققاً الفوز المؤزر والنصر الأعظم!
                </p>

                {/* Stage 2 Stats Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-600/40">
                    <span className="text-slate-300 block text-xs">الفرسان المدرعون</span>
                    <span className="text-2xl font-black text-white">{gameState.knightsDefeated || 5} / 5</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-600/40">
                    <span className="text-amber-300 block text-xs">الدبابات الخشبية</span>
                    <span className="text-2xl font-black text-white">{gameState.tanksDefeated || 5} / 5</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-600/40">
                    <span className="text-emerald-300 block text-xs">المنجنيق المنيع</span>
                    <span className="text-2xl font-black text-emerald-400">محطم بنجاح 💥</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-800 border border-neutral-700">
                    <span className="text-neutral-400 block text-xs">النقاط الإجمالية</span>
                    <span className="text-2xl font-black text-white">{gameState.score}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mb-2">
                  مبارك النصر يا ناصر! انفتحت بوابة الحصن
                </h2>
                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-6">
                  وقف ناصر أمام بوابة الحصن العظيمة وصدح بنداء <strong>«يا علي!»</strong>، فانقلعت البوابة وأُلقيت بعيداً في الآفاق، وعبر ناصر إلى المعقل العظيم محققاً الفوز بعد اجتياز خمسة موالين وخمسة معادين بنجاح وبصيرة!
                </p>

                {/* Stage 1 Stats Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-600/40">
                    <span className="text-emerald-300 block text-xs">الموالون المعانقون</span>
                    <span className="text-2xl font-black text-white">{gameState.loyalPassed} / 5</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-600/40">
                    <span className="text-rose-300 block text-xs">المعادون المدحورون</span>
                    <span className="text-2xl font-black text-white">{gameState.enemyPassed} / 5</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-600/40">
                    <span className="text-amber-300 block text-xs">النقاط الإجمالية</span>
                    <span className="text-2xl font-black text-white">{gameState.score}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-800 border border-neutral-700">
                    <span className="text-neutral-400 block text-xs">الرصيد المتبقي</span>
                    <span className="text-2xl font-black text-white">{gameState.health}</span>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-3">
              {/* Primary Action: Start the game from its beginning (طريق النخيل) */}
              <button
                onClick={() => {
                  if (onRestartFromBeginning) {
                    onRestartFromBeginning();
                  } else if (onSelectStage) {
                    onSelectStage(1);
                  } else {
                    onRestart();
                  }
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-neutral-950 font-black text-base sm:text-lg shadow-xl shadow-amber-500/30 transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2.5 ring-2 ring-amber-300/60"
              >
                <RotateCcw className="w-5 h-5 text-neutral-950" />
                <span>بدء اللعبة من بدايتها (المرحلة الأولى - طريق النخيل)</span>
              </button>

              {/* Secondary Options */}
              {gameState.stage === 2 ? (
                <button
                  onClick={onRestart}
                  className="w-full py-3 px-5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold text-sm border border-neutral-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⚔️ إعادة معركة الحصن فقط (المرحلة 2)</span>
                </button>
              ) : (
                onSelectStage && (
                  <button
                    onClick={() => onSelectStage(2)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>⚔️ الانتقال للمرحلة الثانية (معركة السيف والحصن)</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* GAME OVER MODAL                                                       */}
      {/* --------------------------------------------------------------------- */}
      {gameState.isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border-2 border-rose-600 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-4xl mb-4">
              💔
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-rose-400 mb-2">
              انتهى رصيد ناصر!
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed mb-5">
              نفد رصيد الطاقة والحياة قبل بلوغ نهاية الطريق. تذكّر دائماً:
            </p>

            {/* Rules reminder */}
            <div className="bg-neutral-800/80 rounded-2xl p-3.5 mb-6 text-xs text-right space-y-2 border border-neutral-700">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <span>✨ الموالي (وجه منير ينادي يا زهراء):</span>
                <span>اصطدم به لتكسب رصيداً وبركة!</span>
              </div>
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <span>🔥 المعادي (وجه مظلم ينادي احرقوهم):</span>
                <span>تجنب الاصطدام به كي لا تخسر!</span>
              </div>
              <div className="flex items-center gap-2 text-amber-300 font-medium">
                <span>👆 التحكم باللمس المباشر:</span>
                <span>المس ناصر وجره يميناً ويساراً، واسحب للأعلى للقفز!</span>
              </div>
            </div>

            <button
              onClick={onRestart}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base shadow-lg shadow-rose-600/30 transition-transform active:scale-98 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>إعادة المحاولة من البداية</span>
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* HELP / RULES MODAL                                                    */}
      {/* --------------------------------------------------------------------- */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto animate-fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-right">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-amber-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              قواعد مغامرة ناصر في طريق النخيل
            </h3>

            <div className="space-y-3.5 text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/30">
                <h4 className="font-bold text-amber-300 text-sm mb-1">👆 طريقة التحكم المباشر:</h4>
                <p>
                  • المس ناصر وجره <strong>يميناً ويساراً</strong> على الطريق للتوجيه وتغيير المسار.
                  <br />
                  • اسحب ناصر <strong>للأعلى (فوق)</strong> ليقفز فوق الحفر العميقة في الطريق (السقوط في الحفرة ينهي حياة ناصر فوراً!).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-600/30">
                <h4 className="font-bold text-emerald-300 text-sm mb-1">1. الشخص الموالي:</h4>
                <p>
                  وجهه منير مشرق، وينادي بصوت عذب <strong>"يا زهراء"</strong>.
                  <br />
                  • إذا <strong>اصطدم به ناصر يكسب</strong> (+150 نقطة و +20 رصيد وبركة).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-600/30">
                <h4 className="font-bold text-rose-300 text-sm mb-1">2. الشخص المعادي:</h4>
                <p>
                  وجهه مظلم قاتم، وينادي <strong>"احرقوهم"</strong>.
                  <br />
                  • إذا <strong>اصطدم به ناصر يخسر</strong> (-35 رصيد وتناقص نقاطه).
                  <br />
                  • راوغه وجره بعيداً عنه لتمر بسلام وأمان (+50 نقطة).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700">
                <h4 className="font-bold text-white text-sm mb-1">3. شروط الفوز والخسارة:</h4>
                <p>
                  • <strong>الخسارة:</strong> إذا انتهى رصيد ناصر ووصل إلى 0 أو سقط في الحفر العميقة.
                  <br />
                  • <strong>المسير:</strong> اجتياز <strong>5 موالين و 5 معادين</strong> بنجاح لبلوغ نهاية الطريق.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-950/50 border border-amber-600/30">
                <h4 className="font-bold text-amber-300 text-sm mb-1">4. انقلاع البوابة الأولى والانتقال للمرحلة الثانية:</h4>
                <p>
                  • في نهاية طريق النخيل، يقف ناصر أمام <strong>بوابة الحصن العظيمة الأولى</strong>.
                  <br />
                  • <strong>لا تفتح له إلا بأن يقول «يا علي!»</strong>: المس ناصر مباشرة ليصدح بنداء «يا علي!»، فتنقلع البوابة وتُلقى بعيداً في الآفاق، ويعبر ناصر شاهراً سيفه للقتال في <strong>المرحلة الثانية</strong>!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-950/50 border border-sky-600/40">
                <h4 className="font-bold text-sky-300 text-sm mb-1">5. المرحلة الثانية: قتال السيف واقتحام الحصن:</h4>
                <p>
                  • ينقر اللاعب <strong>نقرتين متتاليتين على ظهر ناصر</strong> ليضرب ناصر أعداءه بسيفه ويصرخ <strong>«يا علي!»</strong>.
                  <br />
                  • <strong>الفرسان المدرعون (5):</strong> يظهر لناصر فارس مدجج بالدرع الحديد على كامل جسده، وعلى ناصر القضاء عليه سريعاً قبل أن يهاجمه.
                  <br />
                  • <strong>بوابة الحصن الثانية:</strong> يصل ناصر إليها ويضربها بسيفه صائحاً «يا علي!» لتحطيمها.
                  <br />
                  • <strong>الدبابات الخشبية المقببة (5):</strong> تظهر دبابات مصفحة مغطاة شبيهة بالقبة لها عجلات ضخمة وتسير نحو ناصر، وعلى ناصر تحطيمها بسيفه كي لا تدهسه.
                  <br />
                  • <strong>بوابة الحصن الثالثة:</strong> يصل إليها ويحطمها بسيفه.
                  <br />
                  • <strong>منجنيق الحصن:</strong> يلقي المنجنيق 5 صخور حجرية ضخمة؛ إذا أصابت إحداها ناصر تقضي على حياته فوراً! راوغها بالسحب يميناً ويساراً، ثم تقدم للمنجنيق وحطمه بسيفك لتحقيق الفوز المبين!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-teal-950/40 border border-teal-600/30">
                <h4 className="font-bold text-teal-300 text-sm mb-1">5. طقس ورياح ديناميكية واقعية:</h4>
                <p>
                  • تتمايل أشجار النخيل وسعفها بفعل الرياح وعصفاتها مع تطاير أوراق الشجر والذرات في الهواء.
                  <br />
                  • تتغير الإضاءة وألوان السماء تدريجياً بين الصباح والظهيرة والغروب والليل القمري، ويمكنك التبديل بمفتاح [T] أو من الشريط السفلي.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition-colors"
            >
              فهمت، لننطلق في الطريق!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
