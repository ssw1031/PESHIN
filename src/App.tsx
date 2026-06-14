import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  ThumbsUp, 
  Plus, 
  Minus, 
  Scale, 
  Check, 
  Eye, 
  Sparkle,
  Star,
  Baby,
  Smile,
  Coins
} from 'lucide-react';
import MeasuringCup from './components/MeasuringCup';
import MascotCharacter from './components/MascotCharacter';
import { audio } from './components/AudioEngine';

// Typical recipes designed dynamically for developmental level practicing
interface Mission {
  drinkType: 'water' | 'cola' | 'juice' | 'milk';
  targetVolume: number;
  grade: string; // e.g. "물 150ml 만들기"
}

const PRESET_MISSIONS: Mission[] = [
  { drinkType: 'water', targetVolume: 100, grade: '물 100mL 담기' },
  { drinkType: 'juice', targetVolume: 150, grade: '달콤한 주스 150mL 담기' },
  { drinkType: 'cola', targetVolume: 200, grade: '검은색 콜라 200mL 담기' },
  { drinkType: 'milk', targetVolume: 120, grade: '딸기우유 120mL 담기' },
  { drinkType: 'water', targetVolume: 250, grade: '물 250mL 가득 담기' },
  { drinkType: 'juice', targetVolume: 80, grade: '달콤한 주스 80mL 담기' },
  { drinkType: 'cola', targetVolume: 110, grade: '콜라 110mL 담기' },
  { drinkType: 'milk', targetVolume: 180, grade: '딸기우유 180mL 담기' },
];

export default function App() {
  // Global states for custom Accessibility Settings
  const [highContrastTicks, setHighContrastTicks] = useState<boolean>(false);
  const [fontSizeLarge, setFontSizeLarge] = useState<boolean>(false);
  const [slowSpeech, setSlowSpeech] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  // Core application states
  const [volume, setVolume] = useState<number>(0);
  const [levelMode, setLevelMode] = useState<'C' | 'B' | 'A' | 'practice'>('C'); // C: 하, B: 중, A: 상, practice: 자유
  const [drinkType, setDrinkType] = useState<'water' | 'cola' | 'juice' | 'milk'>('water');
  
  // Custom generated or cycled tasks/missions
  const [missionIndex, setMissionIndex] = useState<number>(0);
  const [customTargetVolume, setCustomTargetVolume] = useState<number>(100); // For Free Practice
  
  // Active liquid pouring state trackers
  const [isPouring, setIsPouring] = useState<boolean>(false);
  const [isEmptying, setIsEmptying] = useState<boolean>(false);
  
  // Voice Assist Speech Synthesis tracker
  const [isTtsPlaying, setIsTtsPlaying] = useState<boolean>(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Confetti / Star Shower effect states on successfully matching targets
  const [celebrate, setCelebrate] = useState<boolean>(false);
  const [stars, setStars] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

  // Timer intervals for long-holding action buttons
  const timerRef = useRef<number | null>(null);

  // Initialize and load mission volume parameters based on level presets
  const currentMission = PRESET_MISSIONS[missionIndex % PRESET_MISSIONS.length];
  const targetVolume = levelMode === 'practice' ? customTargetVolume : currentMission.targetVolume;

  // Active beverage settings mapping
  const activeDrinkType = levelMode === 'practice' ? drinkType : currentMission.drinkType;

  // Sound Engine sync
  useEffect(() => {
    audio.setSoundEnabled(soundOn);
  }, [soundOn]);

  // Read current guides automatically when switching levels or landing on a new mission
  useEffect(() => {
    // Slight timeout to let student settle
    const t = setTimeout(() => {
      speakCurrentIntroduction();
    }, 400);
    return () => clearTimeout(t);
  }, [levelMode, missionIndex]);

  // Core success validation check inside specified buffer modes
  useEffect(() => {
    if (levelMode === 'practice') {
      return; 
    }

    // Determine target offset bounds depending on visual aid helpers (A, B, C)
    const successBuffer = getTolerance(levelMode);
    const diff = Math.abs(volume - targetVolume);

    if (diff <= successBuffer && volume > 0) {
      if (!celebrate) {
        handleSuccess();
      }
    } else {
      if (celebrate && diff > successBuffer) {
        setCelebrate(false);
      }
    }
  }, [volume, targetVolume, levelMode]);

  // Clean-up synthesis triggers on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getTolerance = (mode: 'C' | 'B' | 'A' | 'practice') => {
    if (mode === 'C') return 6;    // Level C: Super generous (±6mL)
    if (mode === 'B') return 3;    // Level B: Moderate (±3mL)
    if (mode === 'A') return 1;    // Level A: High Precision (±1mL)
    return 0;
  };

  // Sound and Visual Party Celebrations
  const handleSuccess = () => {
    setCelebrate(true);
    audio.playSuccess();
    
    // Create random confetti stars falling across the page layout
    const cuteColors = ['#facc15', '#f43f5e', '#10b981', '#3b82f6', '#a855f7', '#ff9f43'];
    const newStars = Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage x-axis
      delay: Math.random() * 3, // staggered fall delay
      color: cuteColors[Math.floor(Math.random() * cuteColors.length)]
    }));
    setStars(newStars);

    // Prompt Mascot sound message
    const praiseMessages = [
      "축하합니다! 눈금을 아주 완벽하게 잘 맞추었습니다! 정말 대단해요! ⭐🏆",
      "와! 성공이에요! 다음 음료도 만들러 가볼까요?",
      "정말 대단해요! 대장금 요리사처럼 최고예요!",
      "참 잘했어요! 무밍이가 아주 감동받았어요!"
    ];
    const pickMessage = praiseMessages[Math.floor(Math.random() * praiseMessages.length)];
    speakText(pickMessage);
  };

  // Reset the current level cup
  const resetCup = () => {
    setVolume(0);
    setCelebrate(false);
    audio.playReset();
    speakText("컵을 비웠습니다. 다시 차근차근 시작해보자!");
  };

  // TTS Voice Speak Trigger
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    // Stop current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = slowSpeech ? 0.72 : 0.98; // Slowly voice tailored for developmental therapy
    utterance.pitch = 1.15; // slightly cuter pitch

    utterance.onstart = () => setIsTtsPlaying(true);
    utterance.onend = () => setIsTtsPlaying(false);
    utterance.onerror = () => setIsTtsPlaying(false);

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Dynamic Instructions based on level & mission
  const getMascotMessage = () => {
    if (celebrate) {
      return "🎉 우왕! 멋져요! 목표 양에 딱 맞췄어요! 아주 훌륭한 계량 솜씨를 보여주었습니다! 다음 문제를 맞춰볼까요?";
    }

    const drinkName = getDrinkKoreanName(activeDrinkType);

    if (levelMode === 'practice') {
      return `🥛 [자유 연습 모드] 입니다! ${drinkName}을/를 자유롭게 담거나 덜어내며 컵의 눈금이 몇 mL를 나타내는지 직접 관찰해봐요!`;
    }

    if (levelMode === 'C') {
      return `🔴 [C그룹: 하급 도움] ${drinkName} ${targetVolume}mL를 담아봅시다! 컵 옆의 빨갛고 깜빡거리는 🛑 멈춤(STOP) 스티커를 만나면 따르기를 즉각 멈춰주세요!`;
    }

    if (levelMode === 'B') {
      return `⭐ [B그룹: 중급 도움] ${drinkName} ${targetVolume}mL를 맞춰봅시다! 노란색 스티커 띠 가이드라인선 안에 알맞게 도달할 수 있도록 조심히 담아봐요!`;
    }

    // A Group / High
    return `📝 [A그룹: 고급 스스로하기] 레시피 카드에 적힌 ${drinkName} ${targetVolume}mL 수치만을 관찰하고, 컵의 눈금을 혼자서 직접 손수 해석하여 완벽하게 맞춰봅시다!`;
  };

  const speakCurrentIntroduction = () => {
    const textToSpeak = getMascotMessage().replace(/🛑|⭐|📝|🥛|🔴|🎉|\[|\]/g, ""); // strip emojis for smoother speech reading
    speakText(textToSpeak);
  };

  const getDrinkKoreanName = (type: string) => {
    switch (type) {
      case 'cola': return '콜라 (검정색)';
      case 'juice': return '달콤 오렌지 주스';
      case 'milk': return '딸기 우유 (분홍색)';
      case 'water':
      default:
        return '깨끗한 물';
    }
  };

  // Precise button increments
  const adjustVolume = (amount: number) => {
    setVolume((prev) => {
      const next = Math.max(0, Math.min(300, prev + amount));
      if (next !== prev) {
        audio.playPop();
      }
      return next;
    });
  };

  // Continuous Hold pour triggers
  const startContinuousChange = (amount: number, isAdding: boolean) => {
    if (celebrate) return;
    
    // Stop any previous timer just in case
    if (timerRef.current) clearInterval(timerRef.current);

    if (isAdding) {
      setIsPouring(true);
      audio.startPourSound(activeDrinkType === 'water' || activeDrinkType === 'milk');
    } else {
      setIsEmptying(true);
      audio.startPourSound(false);
    }

    // Tick increment every 80ms for fluid continuous reaction
    timerRef.current = window.setInterval(() => {
      setVolume((prev) => {
        const step = isAdding ? (amount > 10 ? 3 : 1) : (amount < -10 ? -3 : -1);
        const next = Math.max(0, Math.min(300, prev + step));
        return next;
      });
    }, 45);
  };

  const stopContinuousChange = () => {
    setIsPouring(false);
    setIsEmptying(false);
    audio.stopPourSound();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Skip / Next task trigger
  const handleNextMission = () => {
    setCelebrate(false);
    setVolume(0);
    setMissionIndex((prev) => prev + 1);
  };

  return (
    <div className={`min-h-screen bg-sky-50 text-slate-800 ${fontSizeLarge ? 'font-cute text-xl' : 'font-sans text-base'} transition-all`}>
      
      {/* Visual background star animations during celebration */}
      {celebrate && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute text-5xl tracking-normal select-none"
              style={{
                left: `${star.left}%`,
                top: `-40px`,
                animation: `dropFall 4s linear infinite`,
                animationDelay: `${star.delay}s`,
                color: star.color,
                zIndex: 60
              }}
            >
              ★
            </div>
          ))}
          {/* Confetti party flash details */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] animate-pulse"></div>
        </div>
      )}

      {/* Title & Navigation Header Area */}
      <header className="bg-gradient-to-r from-teal-400 via-emerald-400 to-yellow-300 p-4 shadow-md text-amber-950 border-b-6 border-emerald-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Title block with cute emoji icons */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-2.5 rounded-2xl border-3 border-amber-800 shadow-md animate-bounce">
              <Scale className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight font-title text-amber-950 stroke-white drop-shadow">
                알록달록 맛있는 계량 교실 🥤
              </h1>
              <p className="text-xs md:text-sm font-bold text-teal-900 opacity-90 font-sans mt-0.5">
                특수학급 학생들을 위한 눈맞춤형 물·음료 따르기 실습 가상 교구
              </p>
            </div>
          </div>

          {/* Accessibility Option Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-white/95 px-4 py-2 rounded-2xl border-3 border-emerald-400/80 shadow-sm">
            <span className="text-xs font-bold text-amber-900 font-cute border-r-2 border-emerald-100 pr-2 mr-1 flex items-center gap-1">
              🎨 쉬운 화면 옵션:
            </span>

            {/* Bigger Font Option */}
            <button
              onClick={() => { setFontSizeLarge(!fontSizeLarge); audio.playPop(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                fontSizeLarge 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              id="accessibility-font-toggle"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{fontSizeLarge ? '글자 표준으로' : '글자 크게 보기'}</span>
            </button>

            {/* High Contrast Ticks */}
            <button
              onClick={() => { setHighContrastTicks(!highContrastTicks); audio.playPop(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                highContrastTicks 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              id="accessibility-mode-toggle"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{highContrastTicks ? '눈금 표준으로' : '눈금 두껍게 크게'}</span>
            </button>

            {/* Speak Slow Option */}
            <button
              onClick={() => { setSlowSpeech(!slowSpeech); audio.playPop(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                slowSpeech 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              id="accessibility-slow-speech"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{slowSpeech ? '보통 말소리' : '목소리 천천히'}</span>
            </button>

            {/* Sound Toggle Button */}
            <button
              onClick={() => setSoundOn(!soundOn)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                soundOn 
                  ? 'bg-amber-400 text-amber-950' 
                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
              }`}
              id="accessibility-sound-toggle"
              title={soundOn ? "소리 끄기" : "소리 켜기"}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundOn ? '소리 켜짐' : '소리 꺼짐'}</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Educational Dashboard Content */}
      <main className="max-w-6xl mx-auto p-4 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Mission Description, Levels & Beverage Selection (lg:col-span-4) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Level Selection Block (하, 중, 상, 자유연습) */}
          <div className="p-5 bg-white rounded-3xl border-4 border-teal-300 shadow-md">
            <h3 className="text-lg font-extrabold text-teal-800 mb-3 flex items-center gap-1.5 font-cute">
              <Baby className="w-5 h-5 text-teal-500" />
              수준별 학습 단계 선택하기
            </h3>
            <div className="grid grid-cols-2 gap-2">
              
              {/* Level C */}
              <button
                onClick={() => { setLevelMode('C'); setVolume(0); setCelebrate(false); audio.playPop(); }}
                className={`py-3 px-2 rounded-2xl text-center border-3 flex flex-col items-center justify-center transition-all ${
                  levelMode === 'C'
                    ? 'bg-rose-100 border-rose-500 text-rose-950 font-extrabold scale-102 ring-4 ring-rose-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                id="btn-level-c"
              >
                <span className="text-2xl">🔴</span>
                <span className="text-sm font-extrabold mt-1">C그룹 (하급 도움)</span>
                <span className="text-2xs font-bold text-slate-500 mt-0.5">멈춤 스티커 가이드</span>
              </button>

              {/* Level B */}
              <button
                onClick={() => { setLevelMode('B'); setVolume(0); setCelebrate(false); audio.playPop(); }}
                className={`py-3 px-2 rounded-2xl text-center border-3 flex flex-col items-center justify-center transition-all ${
                  levelMode === 'B'
                    ? 'bg-yellow-100 border-yellow-500 text-yellow-950 font-extrabold scale-102 ring-4 ring-yellow-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                id="btn-level-b"
              >
                <span className="text-2xl">🟡</span>
                <span className="text-sm font-extrabold mt-1">B그룹 (중급 도움)</span>
                <span className="text-2xs font-bold text-slate-500 mt-0.5">노란 띠 가이드</span>
              </button>

              {/* Level A */}
              <button
                onClick={() => { setLevelMode('A'); setVolume(0); setCelebrate(false); audio.playPop(); }}
                className={`py-3 px-2 rounded-2xl text-center border-3 flex flex-col items-center justify-center transition-all ${
                  levelMode === 'A'
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-950 font-extrabold scale-102 ring-4 ring-indigo-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                id="btn-level-a"
              >
                <span className="text-2xl">🔵</span>
                <span className="text-sm font-extrabold mt-1">A그룹 (고급 스스로)</span>
                <span className="text-2xs font-bold text-slate-500 mt-0.5">순수 눈금 보고 맞추기</span>
              </button>

              {/* Practice Sandbox */}
              <button
                onClick={() => { setLevelMode('practice'); setVolume(0); setCelebrate(false); audio.playPop(); }}
                className={`py-3 px-2 rounded-2xl text-center border-3 flex flex-col items-center justify-center transition-all ${
                  levelMode === 'practice'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-extrabold scale-102 ring-4 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                id="btn-level-practice"
              >
                <span className="text-2xl">🥛</span>
                <span className="text-sm font-extrabold mt-1">자유연습 놀이터</span>
                <span className="text-2xs font-bold text-slate-500 mt-0.5">원하는 만큼 연습하기</span>
              </button>

            </div>
          </div>

          {/* Current Mission Order Note / Recipe Card */}
          <div className="bg-amber-100 rounded-3xl border-4 border-dashed border-amber-400 p-5 shadow-sm relative overflow-hidden">
            
            {/* Design binder rings for notebook concept */}
            <div className="absolute top-2 left-6 right-6 flex justify-between">
              <div className="w-5 h-5 rounded-full bg-slate-300 border-2 border-white shadow-inner"></div>
              <div className="w-5 h-5 rounded-full bg-slate-300 border-2 border-white shadow-inner"></div>
              <div className="w-5 h-5 rounded-full bg-slate-300 border-2 border-white shadow-inner"></div>
            </div>

            <div className="mt-4 pt-1">
              <span className="text-2xs font-extrabold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">
                목표 레시피 카드 📝
              </span>
              
              {levelMode !== 'practice' ? (
                <div className="mt-3">
                  <h4 className="text-2xl font-black text-amber-950 tracking-tight font-cute">
                    음료 종류: {getDrinkKoreanName(activeDrinkType)}
                  </h4>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-sm font-bold text-amber-800">목표 용량:</span>
                    <span className="text-4xl font-extrabold text-blue-700 underline decoration-wavy decoration-emerald-500 decoration-3">
                      {targetVolume}
                    </span>
                    <span className="text-2xl font-black text-amber-900">mL</span>
                  </div>
                  
                  {/* Small tip box helping visual identification */}
                  <div className="mt-4 p-2.5 bg-white/70 rounded-xl border border-amber-300 text-xs font-bold text-amber-900">
                    💡 <span className="font-sans">힌트: 컵에서 숫자 <strong className="text-rose-600">{targetVolume}</strong>이 쓰여진 선까지 채워보세요!</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-amber-950">
                  <h4 className="text-lg font-extrabold mb-1">
                    [자유 연습 모드] 내 맘대로 목표 정하기
                  </h4>
                  <p className="text-xs text-amber-800 mb-3">직접 목표 용량을 바꾸어가며 탐구해보세요!</p>
                  
                  {/* target adjustment buttons for sandbox training */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setCustomTargetVolume(prev => Math.max(50, prev - 50)); audio.playPop(); }}
                      className="px-2.5 py-1 bg-amber-400 text-amber-950 hover:bg-amber-500 rounded-lg text-xs font-black shadow-sm"
                    >
                      -50mL
                    </button>
                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="10"
                      value={customTargetVolume}
                      onChange={(e) => { setCustomTargetVolume(Number(e.target.value)); audio.playPop(); }}
                      className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <button
                      onClick={() => { setCustomTargetVolume(prev => Math.min(250, prev + 50)); audio.playPop(); }}
                      className="px-2.5 py-1 bg-amber-400 text-amber-950 hover:bg-amber-500 rounded-lg text-xs font-black shadow-sm"
                    >
                      +50mL
                    </button>
                  </div>
                  <div className="text-center font-extrabold text-xl text-blue-700 mt-2">
                    설정한 가상 목표: {customTargetVolume} mL
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Beverage Choice Selection Panel (Active ONLY in Practice Mode or shows corresponding flavor visually) */}
          <div className="p-5 bg-white rounded-3xl border-4 border-orange-200 shadow-md">
            <h3 className="text-base font-extrabold text-orange-950 mb-3 flex items-center gap-1.5 font-cute">
              <span>🥤</span>
              실습 음료수 냉장고
            </h3>
            
            {levelMode !== 'practice' ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500 text-center leading-relaxed">
                📢 지금은 <span className="text-teal-700 font-extrabold">미션 해결 모드</span>입니다.<br />
                레시피에 지정된 <span className="font-extrabold text-[#7dd3fc] bg-sky-950 px-1 rounded">{getDrinkKoreanName(activeDrinkType)}</span>로 자동 선택되어 있어요!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                
                {/* Clean Water */}
                <button
                  onClick={() => { setDrinkType('water'); audio.playPop(); }}
                  className={`p-3 rounded-2xl border-3 flex items-center gap-2 transition-all ${
                    drinkType === 'water'
                      ? 'bg-sky-100 border-sky-400 text-sky-950 font-black scale-102 ring-3 ring-sky-100'
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="drink-select-water"
                >
                  <span className="text-2xl">💧</span>
                  <div className="text-left leading-none">
                    <span className="text-xs font-semibold block text-slate-400">깨끗한</span>
                    <span className="text-sm">물</span>
                  </div>
                </button>

                {/* Sparkling Cola */}
                <button
                  onClick={() => { setDrinkType('cola'); audio.playPop(); }}
                  className={`p-3 rounded-2xl border-3 flex items-center gap-2 transition-all ${
                    drinkType === 'cola'
                      ? 'bg-amber-100 border-amber-950 text-amber-950 font-black scale-102 ring-3 ring-amber-100'
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="drink-select-cola"
                >
                  <span className="text-2xl">🥤</span>
                  <div className="text-left leading-none">
                    <span className="text-xs font-semibold block text-slate-400">시원한</span>
                    <span className="text-sm">콜라</span>
                  </div>
                </button>

                {/* Sweet Orange Juice */}
                <button
                  onClick={() => { setDrinkType('juice'); audio.playPop(); }}
                  className={`p-3 rounded-2xl border-3 flex items-center gap-2 transition-all ${
                    drinkType === 'juice'
                      ? 'bg-orange-100 border-orange-500 text-orange-950 font-black scale-102 ring-3 ring-orange-100'
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="drink-select-juice"
                >
                  <span className="text-2xl">🍊</span>
                  <div className="text-left leading-none">
                    <span className="text-xs font-semibold block text-slate-400">달콤한</span>
                    <span className="text-sm">주스</span>
                  </div>
                </button>

                {/* Strawberry Milk */}
                <button
                  onClick={() => { setDrinkType('milk'); audio.playPop(); }}
                  className={`p-3 rounded-2xl border-3 flex items-center gap-2 transition-all ${
                    drinkType === 'milk'
                      ? 'bg-pink-100 border-pink-400 text-pink-950 font-black scale-102 ring-3 ring-pink-100'
                      : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="drink-select-milk"
                >
                  <span className="text-2xl">🍓</span>
                  <div className="text-left leading-none">
                    <span className="text-xs font-semibold block text-slate-400">부드러운</span>
                    <span className="text-sm">딸기우유</span>
                  </div>
                </button>

              </div>
            )}
          </div>

        </div>

        {/* Center Column: Graphic Pitcher & Measuring SVG Beaker Layer (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-50/50 to-orange-50/30 rounded-3xl border-3 border-amber-200/50">
          
          {/* Animated Tilting Pitcher pouring fluid down */}
          <div className="relative h-18 w-full flex items-center justify-center mb-1 overflow-visible">
            <div className={`relative transition-all duration-300 transform origin-right ${isPouring ? '-rotate-42 translate-y-3 -translate-x-12' : 'rotate-0'}`}>
              
              {/* Pitcher graphics depending on drink flavor color */}
              <div className="flex items-center justify-center">
                <span className="text-7xl select-none filter drop-shadow">🥛</span>
                
                {/* Active fluid badge spilling from mouth on active pouring style */}
                {isPouring && (
                  <div className="absolute -right-3 top-6 w-5 h-5 rounded-full animate-ping" style={{ backgroundColor: activeDrinkType === 'cola' ? '#3d2012' : activeDrinkType === 'juice' ? '#FFA500' : activeDrinkType === 'milk' ? '#F48FBB' : '#38bdf8' }}></div>
                )}
              </div>
            </div>
          </div>

          {/* Core SVG Beaker drawing */}
          <MeasuringCup
            volume={volume}
            targetVolume={targetVolume}
            levelMode={levelMode}
            drinkType={activeDrinkType}
            highContrastTicks={highContrastTicks}
            isPouring={isPouring}
            isEmptying={isEmptying}
          />
          
          {/* Beaker Drainage Base Visual tray */}
          <div className="w-48 h-3.5 bg-slate-300 rounded-full border-t border-white shadow-md relative -mt-1 flex items-center justify-center">
            {/* Fake drain holes */}
            <div className="absolute bottom-1 w-20 flex justify-between">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Steering Controls & Button Arrays (lg:col-span-4) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Main Visual interactive liquid adjustment Steering Center */}
          <div className="p-5 bg-white rounded-3xl border-4 border-amber-300 shadow-md">
            <h3 className="text-lg font-extrabold text-amber-950 mb-4 flex items-center gap-1.5 font-cute">
              <span>👉</span>
              누르며 음료수 조절하기
            </h3>

            {/* Hold-down Action Controllers for Smooth Flowing */}
            <div className="flex flex-col gap-3">
              
              {/* Continuous Pour in */}
              <div>
                <span className="text-xs font-bold text-slate-500 mb-1 block">1. 꾹 누르고 있는 동안 음료가 채워져요:</span>
                <button
                  onMouseDown={() => startContinuousChange(50, true)}
                  onMouseUp={stopContinuousChange}
                  onMouseLeave={stopContinuousChange}
                  onTouchStart={(e) => { e.preventDefault(); startContinuousChange(50, true); }}
                  onTouchEnd={(e) => { e.preventDefault(); stopContinuousChange(); }}
                  disabled={celebrate}
                  className={`w-full py-4 rounded-2xl text-lg font-black tracking-wide shadow-md flex items-center justify-center gap-2 select-none active:translate-y-1 transition-all ${
                    celebrate 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-b-0' 
                      : 'bg-emerald-400 hover:bg-emerald-500 text-amber-950 border-b-6 border-emerald-600 font-cute'
                  }`}
                  id="btn-pour-hold"
                >
                  <span className="text-2xl animate-bounce">💧</span>
                  <span>꾸욱 따르기 (채우기)</span>
                </button>
              </div>

              {/* Continuous Pour out */}
              <div>
                <span className="text-xs font-bold text-slate-500 mb-1 block">2. 꾹 누르고 있는 동안 음료를 덜어내요:</span>
                <button
                  onMouseDown={() => startContinuousChange(-50, false)}
                  onMouseUp={stopContinuousChange}
                  onMouseLeave={stopContinuousChange}
                  onTouchStart={(e) => { e.preventDefault(); startContinuousChange(-50, false); }}
                  onTouchEnd={(e) => { e.preventDefault(); stopContinuousChange(); }}
                  disabled={volume <= 0}
                  className={`w-full py-4 rounded-2xl text-lg font-black tracking-wide shadow-md flex items-center justify-center gap-2 select-none active:translate-y-1 transition-all ${
                    volume <= 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-b-0' 
                      : 'bg-amber-400 hover:bg-amber-500 text-amber-950 border-b-6 border-amber-600 font-cute'
                  }`}
                  id="btn-empty-hold"
                >
                  <span className="text-2xl">🗑️</span>
                  <span>꾸욱 덜어내기 (빼기)</span>
                </button>
              </div>

            </div>

            <hr className="my-5 border-dashed border-amber-200" />

            {/* Quick Step Buttons for motor skills assistance */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-500 block">3. 조금씩 쪼개어 정확하게 담기:</span>
              
              {/* Increments Grid */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => adjustVolume(50)}
                  disabled={celebrate || volume >= 300}
                  className="py-2.5 px-1 bg-teal-100 hover:bg-teal-200 text-teal-950 border-2 border-teal-300 rounded-xl font-bold text-sm tracking-tighter flex items-center justify-center gap-0.5 shadow-sm active:scale-95"
                  id="btn-add-50"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-700" />
                  <span>50mL 가득 채우기</span>
                </button>

                <button
                  onClick={() => adjustVolume(10)}
                  disabled={celebrate || volume >= 300}
                  className="py-2.5 px-1 bg-teal-50 hover:bg-teal-100 text-teal-950 border-2 border-teal-250 rounded-xl font-bold text-sm tracking-tighter flex items-center justify-center gap-0.5 shadow-sm active:scale-95"
                  id="btn-add-10"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-700" />
                  <span>10mL 더담기</span>
                </button>

                <button
                  onClick={() => adjustVolume(-50)}
                  disabled={volume <= 0}
                  className="py-2.5 px-1 bg-rose-50 hover:bg-rose-100 text-rose-950 border-2 border-rose-200 rounded-xl font-bold text-sm tracking-tighter flex items-center justify-center gap-0.5 shadow-sm active:scale-95"
                  id="btn-sub-50"
                >
                  <Minus className="w-3.5 h-3.5 text-rose-700" />
                  <span>50mL 버리기</span>
                </button>

                <button
                  onClick={() => adjustVolume(-10)}
                  disabled={volume <= 0}
                  className="py-2.5 px-1 bg-rose-50 hover:bg-rose-100 text-rose-950 border-2 border-rose-200 rounded-xl font-bold text-sm tracking-tighter flex items-center justify-center gap-0.5 shadow-sm active:scale-95"
                  id="btn-sub-10"
                >
                  <Minus className="w-3.5 h-3.5 text-rose-700" />
                  <span>10mL 빼기</span>
                </button>
              </div>

              {/* Ultra precise fine adjustments */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => adjustVolume(1)}
                  disabled={celebrate || volume >= 300}
                  className="py-1 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 active:scale-95"
                >
                  ➕ 1mL 초세밀 더하기
                </button>
                <button
                  onClick={() => adjustVolume(-1)}
                  disabled={volume <= 0}
                  className="py-1 px-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 active:scale-95"
                >
                  ➖ 1mL 초세밀 빼기
                </button>
              </div>

              {/* Total clearing button */}
              <button
                onClick={resetCup}
                className="mt-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl border-3 border-dashed border-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                id="btn-clear-all"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>🗑️ 컵 깨끗하게 싹 비우기</span>
              </button>

            </div>

          </div>

          {/* Current Volume readout gauge cards */}
          <div className="p-4 bg-slate-800 text-white rounded-3xl border-3 border-slate-700 shadow-md flex justify-between items-center px-6">
            <div>
              <span className="text-2xs font-extrabold text-[#7dd3fc] uppercase tracking-wide">
                컵 속의 음료 양
              </span>
              <p className="text-3xl font-black font-cute tracking-wide text-white" id="displayed-volume-ml">
                {Math.round(volume)} <span className="text-lg">mL</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xs font-extrabold text-amber-300 block">
                레시피 목표량
              </span>
              <p className="text-base font-black">
                {targetVolume} mL
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Floating Mascot Character & Dialogue speech guidelines block */}
      <section className="max-w-6xl mx-auto p-4 mb-8">
        <MascotCharacter
          expression={celebrate ? 'success' : isPouring ? 'pouring' : isEmptying ? 'empty' : volume > targetVolume ? 'warn' : 'idle'}
          message={getMascotMessage()}
          onSpeak={speakCurrentIntroduction}
          isTtsPlaying={isTtsPlaying}
          fontSizeLarge={fontSizeLarge}
        />
      </section>

      {/* Embedded Success Modal / Cheerbox overlay */}
      {celebrate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="success-screen-overlay">
          <div className="bg-white rounded-[32px] border-8 border-yellow-300 p-8 max-w-md w-full text-center relative shadow-2xl animate-bounce-slow">
            
            {/* Star visual items */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-8xl filter drop-shadow">
              👑
            </div>

            <div className="mt-8 flex justify-center gap-1 items-center">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-500 animate-spin" />
              <Star className="w-12 h-12 fill-yellow-400 text-yellow-500 animate-bounce" />
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-500 animate-spin" />
            </div>

            <h2 className="text-3.5xl font-black text-slate-900 tracking-tight mt-4 font-title">
              참 잘했어요! 성공! 🎉
            </h2>
            
            <p className="text-lg font-bold text-emerald-600 mt-2">
              정확하게 {targetVolume}mL를 맞추었습니다!
            </p>

            <div className="bg-teal-50 border-2 border-teal-200 mt-6 p-4 rounded-2xl text-sm font-semibold text-teal-900 leading-relaxed break-keep">
              셰프 무밍이와 함께 {getDrinkKoreanName(activeDrinkType)} 완벽 계량 레시피 성료! 🏆 다음 미션으로 레벨업 해볼까요?
            </div>

            {/* Next question CTA button */}
            <div className="mt-6 flex flex-col gap-2">
              {levelMode !== 'practice' ? (
                <button
                  onClick={handleNextMission}
                  className="w-full py-4 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-amber-950 font-black text-xl rounded-2xl shadow-lg border-b-6 border-teal-600 tracking-wide font-cute flex items-center justify-center gap-2 transition-all active:translate-y-1 active:border-b-0"
                  id="btn-next-mission-congratulations"
                >
                  <span>다음 문제 도전하기! ⭐</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={() => { setCelebrate(false); setVolume(0); }}
                  className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-400 text-white font-black text-xl rounded-2xl shadow-lg hover:from-sky-500 hover:to-indigo-500 tracking-wide font-cute transition-all"
                >
                  다시 자유롭게 연습하기 🥛
                </button>
              )}
              
              <button
                onClick={() => { setCelebrate(false); }}
                className="text-xs text-slate-500 font-bold hover:underline py-1.5"
              >
                닫기 (이 화면에 남아있기)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Curriculum Summary Panel explaining user parameters */}
      <footer className="bg-slate-100 border-t-4 border-slate-200 p-6 text-slate-500 text-center leading-relaxed">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h5 className="font-extrabold text-slate-700 text-sm font-sans mb-1">
              🏫 수준별 피드백 및 지도 가이드라인 (학습 설계 원리):
            </h5>
            <ul className="text-2xs text-slate-500 font-medium space-y-1 font-sans">
              <li><strong>C그룹(하):</strong> '멈춤' 문구가 들어간 직관적 빨간 스티커 배치, 화살표 가이드로 시지각을 촉진하여 오차 보정.</li>
              <li><strong>B그룹(중):</strong> 오차 범위를 나타내는 점선 노란색 스티커 가이드를 제공하여, 오차를 줄이는 연습을 점진적 유도.</li>
              <li><strong>A그룹(상):</strong> 레시피의 계량 숫자를 보고 스스로 정교하게 눈금을 해석하여 물을 조심스럽게 담아보는 종합 훈련.</li>
            </ul>
          </div>
          <p className="text-2xs font-extrabold text-slate-400 font-sans mt-2 md:mt-0">
            © 알록달록 계량 교실 | 특수학교 과학교사·특수교사 수업지원 보조도구
          </p>
        </div>
      </footer>

    </div>
  );
}
