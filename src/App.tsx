/**
 * Main App Component for "طريق ناصر: مغامرة النخيل ثلاثية الأبعاد"
 * Coordinates Three.js Game Engine and React HUD overlay.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameState, CameraViewMode, TimeOfDayPreset } from './game/GameEngine';
import { GameHUD } from './components/GameHUD';
import { soundManager } from './audio/soundManager';
import { Play } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initial user start screen to ensure Web Audio & Speech API contexts are unlocked
  const [hasStarted, setHasStarted] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');

  // React state synced from GameEngine
  const [gameState, setGameState] = useState<GameState>({
    stage: 1,
    stage2Phase: 'knights',
    knightsDefeated: 0,
    tanksDefeated: 0,
    catapultDestroyed: false,
    hasSword: false,
    health: 100,
    score: 0,
    loyalPassed: 0,
    enemyPassed: 0,
    totalEncountersTarget: 20,
    distance: 0,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    isAtFortressGate: false,
    gateTorn: false,
    weather: {
      preset: 'auto',
      timeOfDayLabel: '🌅 الصباح المشرق',
      isNight: false,
      windSpeedLabel: '🍃 نسيم عليل',
      windGust: 0.5,
    },
    activePrompt: null,
    notification: null,
  });

  const handleStateChange = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  // Initialize Three.js GameEngine once container is mounted
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, handleStateChange);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleStateChange]);

  const handleStartGame = () => {
    soundManager.init();
    setHasStarted(true);
    engineRef.current?.start();
  };

  const handleMoveLeft = () => engineRef.current?.moveLeft();
  const handleMoveRight = () => engineRef.current?.moveRight();
  const handleJump = () => engineRef.current?.jump();
  const handleHug = () => engineRef.current?.performHug();
  const handleStrike = () => engineRef.current?.performStrike();
  const handleSwordStrike = () => engineRef.current?.performSwordStrike();
  const handleSelectStage = (stage: 1 | 2) => engineRef.current?.setStage(stage);
  const handleShoutYaAli = () => engineRef.current?.shoutYaAliAndTearGate();
  const handleRestart = () => engineRef.current?.restart();
  const handleRestartFromBeginning = () => engineRef.current?.restartFromBeginning();
  const handleTogglePause = () => engineRef.current?.togglePause();
  const handleResetCamera = () => engineRef.current?.resetCamera();

  const handleChangeCamera = (mode: CameraViewMode) => {
    setCameraMode(mode);
    engineRef.current?.setCameraMode(mode);
  };

  const handleChangeWeatherPreset = (preset: TimeOfDayPreset) => {
    engineRef.current?.setTimeOfDayPreset(preset);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none text-right">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Intro Welcome Splash Screen (Unlocks audio and presents story) */}
      {!hasStarted && (
        <div className="absolute inset-0 z-40 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center text-3xl shadow-lg mb-3">
              🌴
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              طريق ناصر: مغامرة النخيل والحصن
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4">
              ملحمة ناصر ثلاثية الأبعاد عبر مرحلتين: طريق النخيل الزراعي، ثم اقتحام الحصن بالسيف ومواجهة الفرسان والدبابات والمنجنيق!
            </p>

            <div className="bg-neutral-800/80 rounded-2xl p-3.5 mb-5 text-xs text-right space-y-2 border border-neutral-700">
              <div className="flex items-start gap-2">
                <span className="text-base">🌴</span>
                <div>
                  <strong className="text-amber-400 block">المرحلة الأولى (طريق النخيل):</strong>
                  <span className="text-neutral-300">اجتز 5 موالين و5 معادين واقفر فوق الحفر العميقة، ثم قف على بوابة الحصن والمس ناصر ليصدح «يا علي!» فتنقلع البوابة وتقتحم المعقل!</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-base">⚔️</span>
                <div>
                  <strong className="text-sky-400 block">المرحلة الثانية (قتال السيف والحصن):</strong>
                  <span className="text-neutral-300">
                    بيد ناصر سيف للقتال.. انقر نقرتين على ظهر ناصر لضرب الأعداء بصياح <strong>«يا علي!»</strong>:
                    <br />
                    • اقضِ على 5 فرسان مدرعين بالحديد.
                    <br />
                    • حطم بوابة الحصن الثانية بسيفك.
                    <br />
                    • حطم 5 دبابات خشبية مقببة ذات عجلات تسير نحوك كي لا تدهسك.
                    <br />
                    • اقتحم بوابة الحصن الثالثة.
                    <br />
                    • راوغ صخور المنجنيق الـ 5 كي لا تقضي على حياتك فوراً، ثم اقترب وحطمه بسيفك لتحقيق الفوز المبين!
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-base">👆</span>
                <div>
                  <strong className="text-emerald-400 block">التحكم:</strong>
                  <span className="text-neutral-300">المس ناصر وجره يميناً ويساراً للتوجيه، واسحبه للأعلى للقفز فوق الحفر. انقر مرتين على ظهر ناصر للضرب بالسيف وصراخ «يا علي!»</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>ابدأ الرحلة الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive HUD Overlay */}
      {hasStarted && (
        <GameHUD
          gameState={gameState}
          onMoveLeft={handleMoveLeft}
          onMoveRight={handleMoveRight}
          onJump={handleJump}
          onHug={handleHug}
          onStrike={handleStrike}
          onSwordStrike={handleSwordStrike}
          onSelectStage={handleSelectStage}
          onShoutYaAli={handleShoutYaAli}
          onRestart={handleRestart}
          onRestartFromBeginning={handleRestartFromBeginning}
          onTogglePause={handleTogglePause}
          onChangeCamera={handleChangeCamera}
          onResetCamera={handleResetCamera}
          onChangeWeatherPreset={handleChangeWeatherPreset}
          currentCamera={cameraMode}
        />
      )}
    </div>
  );
}
