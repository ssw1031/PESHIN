import React, { useEffect, useState } from 'react';

interface MeasuringCupProps {
  volume: number;          // Current liquid volume in mL (0 to 300)
  targetVolume: number;    // Target volume (e.g., 50, 100, 150, 200, 250)
  levelMode: 'C' | 'B' | 'A' | 'practice'; // C: STOP sticker, B: Guide line, A: Numeric only, practice: free
  drinkType: 'water' | 'cola' | 'juice' | 'milk';
  highContrastTicks: boolean; // Enlarge and enhance tick contrast
  isPouring: boolean;
  isEmptying: boolean;
}

export default function MeasuringCup({
  volume,
  targetVolume,
  levelMode,
  drinkType,
  highContrastTicks,
  isPouring,
  isEmptying
}: MeasuringCupProps) {
  // Max measurable limit
  const maxVolume = 300;
  
  // Determine drink styling
  // Water: soft semi-translucent blue
  // Cola: deep dark cocoa-brown
  // Juice: vivid orange-yellow
  // Strawberry milk: sweet creamy pink
  const getDrinkConfig = () => {
    switch (drinkType) {
      case 'cola':
        return {
          fill: 'rgba(38, 15, 5, 0.95)',
          waveColor: '#4d200c',
          bubbleColor: 'rgba(255, 255, 255, 0.45)',
          name: '콜라'
        };
      case 'juice':
        return {
          fill: 'rgba(255, 140, 0, 0.95)',
          waveColor: '#ffa500',
          bubbleColor: 'rgba(255, 255, 255, 0.3)',
          name: '주스'
        };
      case 'milk':
        return {
          fill: 'rgba(244, 143, 177, 0.95)',
          waveColor: '#f8bbd0',
          bubbleColor: 'rgba(255, 255, 255, 0.5)',
          name: '딸기우유'
        };
      case 'water':
      default:
        return {
          fill: 'rgba(56, 189, 248, 0.85)',
          waveColor: '#7dd3fc',
          bubbleColor: 'rgba(255, 255, 255, 0.45)',
          name: '물'
        };
    }
  };

  const drink = getDrinkConfig();

  // Handle subtle wave movement offsets using a simple state ticking
  const [waveOffset, setWaveOffset] = useState(0);
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    
    const animateWave = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const delta = time - lastTime;
      if (delta > 30) {
        setWaveOffset((prev) => (prev + 0.1) % (Math.PI * 2));
        lastTime = time;
      }
      animationId = requestAnimationFrame(animateWave);
    };
    
    animationId = requestAnimationFrame(animateWave);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Set up random bubble visual data
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; delay: number; speed: number }>>([]);
  
  useEffect(() => {
    // Generate static floating lanes for bubbles
    const newBubbles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70, // 15% to 85% width
      delay: Math.random() * 2,
      speed: 1.5 + Math.random() * 1.5
    }));
    setBubbles(newBubbles);
  }, [drinkType]);

  // Viewport and cup geometry config
  const cupWidthTop = 220;
  const cupWidthBottom = 170;
  const cupHeight = 350;
  const cupYOffset = 40; // blank space at top of viewport
  const cupXCenter = 150; // SVG Width: 300
  
  const bottomY = cupYOffset + cupHeight; // 390
  const topY = cupYOffset; // 40

  // Calculate Y coordinate for a specific volume (0 to 300)
  // Liquid starts slightly offset from the bottom of the cup
  const getVolumeY = (vol: number) => {
    const clampedVol = Math.max(0, Math.min(maxVolume, vol));
    const percentage = clampedVol / maxVolume;
    // Map percentage to actual height from bottom to top
    // Scale slightly inside the cup (bottom starts 15px above absolute bottom, top ends 30px below absolute top)
    const activeHeight = cupHeight - 45;
    const posY = bottomY - 15 - (percentage * activeHeight);
    return posY;
  };

  const liquidY = getVolumeY(volume);
  const targetY = getVolumeY(targetVolume);

  // Generate SVG path for the liquid surface + volume body
  // Width changes as volume goes up (since cup is trapezoid - flared out at top)
  const getWidthAtY = (y: number) => {
    const ratio = (bottomY - y) / cupHeight;
    const width = cupWidthBottom + (cupWidthTop - cupWidthBottom) * ratio;
    return width;
  };

  const getLiquidPath = () => {
    if (volume <= 0) return '';

    const width = getWidthAtY(liquidY);
    const halfW = width / 2;
    const leftX = cupXCenter - halfW;
    const rightX = cupXCenter + halfW;
    const bottomW = cupWidthBottom / 2;
    
    // Smooth wave profile
    const waveHeight = isPouring ? 4 : 2;
    const segments = 10;
    let wavePoints = '';
    
    for (let i = 0; i <= segments; i++) {
      const segmentRatio = i / segments;
      const x = leftX + (rightX - leftX) * segmentRatio;
      // Add sine-wave offsets
      const sineVal = Math.sin(waveOffset + (segmentRatio * Math.PI * 2.5));
      const y = liquidY + (sineVal * waveHeight);
      wavePoints += ` L ${x} ${y}`;
    }

    // Connect wave points to the trapezoid base
    const path = `
      M ${leftX} ${liquidY}
      ${wavePoints}
      L ${cupXCenter + bottomW - 5} ${bottomY - 8}
      L ${cupXCenter - bottomW + 5} ${bottomY - 8}
      Z
    `;
    return path;
  };

  // Generate ticks list
  // Major ticks: 50, 100, 150, 200, 250, 300 (large lines and text labels)
  // Minor ticks: every 10mL (smaller lines)
  const ticksList: Array<{ vol: number; label: string; isMajor: boolean; y: number }> = [];
  for (let v = 50; v <= 300; v += 10) {
    const isMajor = v % 50 === 0;
    ticksList.push({
      vol: v,
      label: isMajor ? `${v}` : '',
      isMajor,
      y: getVolumeY(v)
    });
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-white select-none rounded-[32px] border-4 border-amber-200 shadow-xl max-w-full overflow-hidden" id="measuring-cup-container">
      {/* Dynamic sound indicators / splashing water drops from top when pouring */}
      {isPouring && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-24 flex items-start justify-center overflow-hidden pointer-events-none z-10">
          <div className="w-2 rounded-full h-8 opacity-75 animate-drop-fall" style={{ backgroundColor: drink.waveColor }} />
        </div>
      )}

      {/* Main SVG Cup Drawing */}
      <svg width="300" height="420" viewBox="0 0 300 420" className="drop-shadow-lg overflow-visible">
        {/* Gradients */}
        <defs>
          <linearGradient id="cupGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
            <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="70%" stopColor="rgba(255, 255, 255, 0.15)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.45)" />
          </linearGradient>
          <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={drink.waveColor} />
            <stop offset="10%" stopColor={drink.fill} />
            <stop offset="100%" stopColor={drink.fill} />
          </linearGradient>
          <filter id="cupShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* Back handle of the cup - cute thick style */}
        <path
          d={`M ${cupXCenter - (cupWidthTop/2) + 3} ${cupYOffset + 60} 
             C ${cupXCenter - (cupWidthTop/2) - 65} ${cupYOffset + 100}, 
               ${cupXCenter - (cupWidthBottom/2) - 55} ${bottomY - 140}, 
               ${cupXCenter - (cupWidthBottom/2) + 5} ${bottomY - 90}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="20"
          strokeLinecap="round"
          className="filter drop-shadow-md"
        />
        <path
          d={`M ${cupXCenter - (cupWidthTop/2) + 3} ${cupYOffset + 60} 
             C ${cupXCenter - (cupWidthTop/2) - 65} ${cupYOffset + 100}, 
               ${cupXCenter - (cupWidthBottom/2) - 55} ${bottomY - 140}, 
               ${cupXCenter - (cupWidthBottom/2) + 5} ${bottomY - 90}`}
          fill="none"
          stroke="white"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Liquid Layer representing the beverage */}
        {volume > 0 && (
          <g>
            {/* Main Filled Liquid */}
            <path
              d={getLiquidPath()}
              fill="url(#liquidGrad)"
              className="transition-all duration-200 ease-out"
            />
            
            {/* Glowing liquid top wavehighlight line */}
            {volume > 3 && (
              <path
                d={`M ${cupXCenter - getWidthAtY(liquidY)/2 + 2} ${liquidY} Q ${cupXCenter} ${liquidY - 3} ${cupXCenter + getWidthAtY(liquidY)/2 - 2} ${liquidY}`}
                fill="none"
                stroke={drink.waveColor}
                strokeWidth="4"
                className="opacity-90 uppercase transition-all duration-200"
              />
            )}

            {/* Bubble animations for fizzy soft drinks or juices */}
            {volume > 15 && bubbles.map((bubble) => {
              // Calculate Y position limits to stay within liquid bounds
              const minBubbleY = liquidY + 12;
              const maxBubbleY = bottomY - 15;
              if (minBubbleY >= maxBubbleY) return null;

              return (
                <circle
                  key={bubble.id}
                  cx={cupXCenter - getWidthAtY(minBubbleY)/2 + (getWidthAtY(minBubbleY) * (bubble.x / 100))}
                  cy={liquidY + 10 + ((maxBubbleY - minBubbleY) * (( (Date.now() / 1200 * bubble.speed) + bubble.delay) % 1))}
                  r={2 + (bubble.id % 3)}
                  fill={drink.bubbleColor}
                  className="pointer-events-none transition-all duration-150"
                />
              );
            })}
          </g>
        )}

        {/* Cup Inner Highlight Reflections (White glass shines) */}
        <polygon
          points={`
            ${cupXCenter - cupWidthTop/2 + 6},${topY + 10}
            ${cupXCenter + cupWidthTop/2 - 6},${topY + 10}
            ${cupXCenter + cupWidthBottom/2 - 6},${bottomY - 6}
            ${cupXCenter - cupWidthBottom/2 + 6},${bottomY - 6}
          `}
          fill="url(#cupGlassGrad)"
          stroke="#cbd5e1"
          strokeWidth="3.5"
          className="pointer-events-none"
        />

        {/* MEASUREMENT TICK MARKS & LABELS */}
        {/* Rendered in front of physical liquid, so they are never hidden! Fully solves the dark cola issue */}
        <g id="measuring-ticks">
          {ticksList.map((tick) => {
            const width = getWidthAtY(tick.y);
            const leftX = cupXCenter - width / 2;
            const tickLength = tick.isMajor ? 18 : 8;

            // Highly legible contrast backgrounds & positions for accessibility
            const textX = leftX + tickLength + 12;
            const textY = tick.y + 4;

            return (
              <g key={tick.vol} className="transition-all duration-150">
                {/* Thick dark background line to guarantee high-contrast reading against any light liquid */}
                <line
                  x1={leftX + 2}
                  y1={tick.y}
                  x2={leftX + tickLength + 2}
                  y2={tick.y}
                  stroke="white"
                  strokeWidth={tick.isMajor ? (highContrastTicks ? 6 : 4) : (highContrastTicks ? 4 : 3)}
                  strokeLinecap="round"
                />
                
                {/* Dynamic colored tick on top */}
                <line
                  x1={leftX + 2}
                  y1={tick.y}
                  x2={leftX + tickLength + 2}
                  y2={tick.y}
                  stroke="#1e293b" // deep charcoal
                  strokeWidth={tick.isMajor ? (highContrastTicks ? 4 : 2.5) : (highContrastTicks ? 2.5 : 1.5)}
                  strokeLinecap="round"
                />

                {tick.isMajor && tick.label && (
                  <g>
                    {/* Shadow halo behind text for flawless absolute clarity on dark drinks like cola */}
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontWeight="bold"
                      fontSize={highContrastTicks ? "20" : "15"}
                      fontFamily="system-ui"
                      stroke="white"
                      strokeWidth="5.5"
                      strokeLinejoin="round"
                      className="select-none pointer-events-none"
                    >
                      {tick.label}
                    </text>
                    <text
                      x={textX}
                      y={textY}
                      fill="#1e293b"
                      fontWeight="bold"
                      fontSize={highContrastTicks ? "20" : "15"}
                      fontFamily="system-ui"
                      className="select-none pointer-events-none"
                    >
                      {tick.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* mL Label on Cup Top */}
        <text
          x={cupXCenter}
          y={topY + 32}
          textAnchor="middle"
          fill="#475569"
          fontWeight="bold"
          fontSize="15"
          fontFamily="system-ui"
          stroke="white"
          strokeWidth="3.5"
          paintOrder="stroke"
          className="tracking-wider"
        >
          mL (밀리리터)
        </text>

        {/* LEVEL-BASED AIDS & EDUCATIONAL STICKERS */}

        {/* 1. Level C: '🛑 멈춤 (STOP)' Teacher Sticker & Arrow Guidance */}
        {levelMode === 'C' && (
          <g className="animate-stop-blink">
            {/* Glowing target zone horizontal ribbon across cup to assist beginner students */}
            <line
              x1={cupXCenter - getWidthAtY(targetY)/2 + 2}
              y1={targetY}
              x2={cupXCenter + getWidthAtY(targetY)/2 - 2}
              y2={targetY}
              stroke="#ef4444"
              strokeWidth="5"
              strokeDasharray="4 3"
              className="shadow-md opacity-90"
            />
            
            {/* Blinking friendly pointer hand or arrow */}
            <path
              d={`M ${cupXCenter + getWidthAtY(targetY)/2 + 45} ${targetY} L ${cupXCenter + getWidthAtY(targetY)/2 + 15} ${targetY}`}
              stroke="#ef4444"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              markerEnd="url(#arrow)"
            />
            
            {/* 🛑 STOP Sticker Balloon */}
            <g transform={`translate(${cupXCenter + getWidthAtY(targetY)/2 + 65}, ${targetY})`}>
              <circle cx="0" cy="0" r="28" fill="#ef4444" stroke="white" strokeWidth="3" className="shadow-lg" />
              <polygon points="-8,-16 8,-16 16,-8 16,8 8,16 -8,16 -16,8 -16,-8" fill="white" />
              <polygon points="-6,-14 6,-14 14,-6 14,6 6,14 -6,14 -14,6 -14,-6" fill="#ef4444" />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="white"
                fontWeight="900"
                fontSize="12"
                fontFamily="system-ui"
              >
                멈춤!
              </text>
            </g>
          </g>
        )}

        {/* 2. Level B: Dotted Sticker Guidelines Target Ribbon */}
        {levelMode === 'B' && (
          <g>
            {/* Yellow checkerboard tape ribbon defining the success criteria zone */}
            <rect
              x={cupXCenter - getWidthAtY(targetY)/2 + 3}
              y={targetY - 6}
              width={getWidthAtY(targetY) - 6}
              height="12"
              fill="rgba(234, 179, 8, 0.25)"
              stroke="#eab308"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              rx="4"
              className="animate-pulse"
            />
            {/* Cute Yellow Success Star Sticker on Right */}
            <g transform={`translate(${cupXCenter + getWidthAtY(targetY)/2 + 25}, ${targetY})`} className="animate-float">
              <polygon
                points="0,-16 4,-4 16,-4 7,4 10,16 0,8 -10,16 -7,4 -16,-4 -4,-4"
                fill="#facc15"
                stroke="#ca8a04"
                strokeWidth="2"
                className="filter drop-shadow-md"
              />
              <text x="0" y="-2" textAnchor="middle" fontSize="6" fill="#ca8a04" fontWeight="bold">OK</text>
            </g>
          </g>
        )}

        {/* Live numerical volume tag at liquid height for Practice/Level C */}
        {(volume > 0 && (levelMode === 'C' || levelMode === 'practice')) && (
          <g transform={`translate(${cupXCenter - getWidthAtY(liquidY)/2 - 50}, ${liquidY})`}>
            {/* Rounded bubble panel */}
            <rect
              x="-24"
              y="-15"
              width="68"
              height="28"
              rx="12"
              fill="white"
              stroke={drink.waveColor}
              strokeWidth="2.5"
              className="shadow-sm"
            />
            <text
              x="10"
              y="4"
              textAnchor="middle"
              fill="#1e293b"
              fontWeight="bold"
              fontSize="14"
              fontFamily="system-ui"
            >
              {Math.round(volume)}ml
            </text>
          </g>
        )}
      </svg>

      {/* Spout dripping effect beneath cup (if emptying) */}
      {isEmptying && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="w-1.5 h-6 rounded-full opacity-75 animate-bounce mb-1" style={{ backgroundColor: drink.waveColor }} />
        </div>
      )}

      {/* Target Volume Marker Info Badge */}
      {levelMode !== 'practice' && (
        <div className="mt-2 px-4 py-1.5 bg-yellow-100 border-2 border-yellow-300 rounded-full flex items-center gap-2">
          <span className="text-yellow-700 text-sm font-bold">목표 용량:</span>
          <span className="text-slate-900 font-extrabold text-base px-2.5 py-0.5 bg-white rounded-full border border-yellow-200">
            {targetVolume} mL
          </span>
        </div>
      )}
    </div>
  );
}
