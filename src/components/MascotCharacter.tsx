import React from 'react';
import { Volume2, VolumeX, Sparkles, Smile, Star } from 'lucide-react';

interface MascotCharacterProps {
  expression: 'idle' | 'pouring' | 'success' | 'warn' | 'empty';
  message: string;
  onSpeak: () => void;
  isTtsPlaying: boolean;
  fontSizeLarge: boolean;
}

export default function MascotCharacter({
  expression,
  message,
  onSpeak,
  isTtsPlaying,
  fontSizeLarge
}: MascotCharacterProps) {
  
  // Custom Mascot visual characteristics
  const getMascotData = () => {
    switch (expression) {
      case 'pouring':
        return {
          emoji: '😮',
          color: 'bg-cyan-200 border-cyan-400',
          textColor: 'text-cyan-800',
          animation: 'animate-pulse',
          accessory: '💧'
        };
      case 'success':
        return {
          emoji: '🥳',
          color: 'bg-emerald-200 border-emerald-400',
          textColor: 'text-emerald-800',
          animation: 'animate-bounce',
          accessory: '✨'
        };
      case 'warn':
        return {
          emoji: '🥺',
          color: 'bg-rose-200 border-rose-400',
          textColor: 'text-rose-800',
          animation: 'animate-shake',
          accessory: '⚠️'
        };
      case 'empty':
        return {
          emoji: '🥛',
          color: 'bg-violet-200 border-violet-400',
          textColor: 'text-violet-800',
          animation: 'animate-float',
          accessory: '🔍'
        };
      case 'idle':
      default:
        return {
          emoji: '😊',
          color: 'bg-amber-200 border-amber-400',
          textColor: 'text-amber-800',
          animation: 'animate-float',
          accessory: '🍎'
        };
    }
  };

  const mascot = getMascotData();

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border-4 border-amber-300 shadow-md max-w-full">
      
      {/* Visual Mascot Circle Character Block */}
      <div className="relative flex-shrink-0">
        {/* Floating background glowing sparkles */}
        {expression === 'success' && (
          <div className="absolute -top-3 -left-3 animate-ping">
            <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-300" />
          </div>
        )}
        
        {/* Main circular body */}
        <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-inner relative transition-all duration-300 ${mascot.color} ${mascot.animation}`}>
          {/* Animated cute face emoji */}
          <span className="text-6xl drop-shadow-sm select-none">{mascot.emoji}</span>
          
          {/* Cute character cheeks blush helper */}
          <div className="absolute bottom-5 left-4 w-4 h-2 bg-pink-400/35 rounded-full filter blur-sm"></div>
          <div className="absolute bottom-5 right-4 w-4 h-2 bg-pink-400/35 rounded-full filter blur-sm"></div>

          {/* Sparkly mini accessory star badge */}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border border-amber-300 flex items-center justify-center text-sm shadow-md">
            {mascot.accessory}
          </div>
        </div>
        
        {/* Mascot Name Badge */}
        <div className="mt-2 text-center">
          <span className="bg-amber-400 text-amber-950 px-3 py-0.5 rounded-full font-bold text-sm tracking-wide shadow-sm font-cute">
            셰프 무밍이
          </span>
        </div>
      </div>

      {/* Bubble Speech Box containing written instructions */}
      <div className="relative flex-grow flex flex-col justify-between p-4 bg-white rounded-2xl border-3 border-amber-200 shadow-inner min-w-[200px] w-full">
        {/* Triangular tail pointer for voice speech bubble */}
        <div className="hidden md:block absolute left-0 top-1/2 transform -translate-x-3.5 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white"></div>
        <div className="hidden md:block absolute left-0 top-1/2 transform -translate-x-4.5 -translate-y-1/2 w-0 h-0 border-t-[9px] border-t-transparent border-b-[9px] border-b-transparent border-r-[9px] border-r-amber-200 -z-10"></div>

        {/* Dynamic description message text */}
        <p className={`font-medium text-slate-800 break-keep leading-relaxed mb-3 ${fontSizeLarge ? 'text-xl' : 'text-base'}`}>
          {message}
        </p>

        {/* Interactive Speech (TTS) Controls */}
        <div className="flex items-center justify-between border-t border-amber-100 pt-2 mt-1">
          <span className="text-xs text-amber-600 font-medium font-sans flex items-center gap-1">
            <Smile className="w-3.5 h-3.5" /> 대화 말하기 도우미
          </span>
          <button
            onClick={onSpeak}
            className={`px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-bold transition-all ${
              isTtsPlaying 
                ? 'bg-rose-500 text-white animate-pulse' 
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 active:scale-95'
            }`}
            title="목소리로 들려주기"
          >
            {isTtsPlaying ? (
              <>
                <VolumeX className="w-4 h-4 text-white" />
                <span>듣는 중... (멈추기)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-amber-700" />
                <span>목소리 듣기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
