import React, { useState, useRef, useEffect } from 'react';
import { Character } from '../types/game';
import { sound } from '../utils/audio';
import { Rotate3d, Play, Pause, Sparkles, Shield, Zap } from 'lucide-react';

interface SkinRotatorProps {
  character: Character;
  skinName?: string;
  skinId?: string;
  size?: number; // default 260
}

export const SkinRotator: React.FC<SkinRotatorProps> = ({
  character,
  skinName = 'Default Cyber Chassis',
  skinId = 'default',
  size = 260,
}) => {
  const [rotation, setRotation] = useState(0); // in degrees (0 to 360)
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const startRotation = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-rotation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isAutoRotating && !isDragging) {
        setRotation(prev => (prev + dt * 45) % 360);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating, isDragging]);

  // Render 3D Turntable onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const rad = (rotation * Math.PI) / 180;

    // 1. Hologram Platform Rings (perspective tilted ellipse)
    ctx.save();
    ctx.translate(centerX, centerY + 50);
    ctx.scale(1, 0.38);

    // Outer rotating glowing disc
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI * 2);
    ctx.strokeStyle = character.color;
    ctx.lineWidth = 4;
    ctx.shadowColor = character.color;
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Inner neon grid lines on base
    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Radial notches that rotate with the turntable
    const notchCount = 12;
    for (let i = 0; i < notchCount; i++) {
      const notchAngle = rad + (i * Math.PI * 2) / notchCount;
      const nx1 = Math.cos(notchAngle) * 75;
      const ny1 = Math.sin(notchAngle) * 75;
      const nx2 = Math.cos(notchAngle) * 95;
      const ny2 = Math.sin(notchAngle) * 95;
      ctx.beginPath();
      ctx.moveTo(nx1, ny1);
      ctx.lineTo(nx2, ny2);
      ctx.strokeStyle = character.secondaryColor || '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();

    // 2. Hologram Beam Pillars
    ctx.save();
    const beamGrad = ctx.createLinearGradient(0, centerY + 50, 0, centerY - 60);
    beamGrad.addColorStop(0, `${character.color}40`);
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(centerX - 85, centerY + 50);
    ctx.lineTo(centerX + 85, centerY + 50);
    ctx.lineTo(centerX + 60, centerY - 50);
    ctx.lineTo(centerX - 60, centerY - 50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Floating 360° Hero Chassis & Weapon with pseudo-3D perspective
    ctx.save();
    ctx.translate(centerX, centerY - 10);

    // Floating bobbing effect
    const bob = Math.sin(Date.now() / 350) * 5;
    ctx.translate(0, bob);

    // Simulated 3D tilt & rotation
    const cosAngle = Math.cos(rad);
    const sinAngle = Math.sin(rad);

    // Dynamic shadow beneath chassis
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 48 - bob * 0.5, 45, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    // Weapon Turret rendering in 3D depth (drawn behind or in front depending on sinAngle)
    const weaponDistance = 34;
    const wx = cosAngle * weaponDistance;
    const wy = sinAngle * 12;

    // Outer Energy Armor Shield
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fillStyle = skinId.includes('gold') ? '#b45309' : character.color + '33';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = skinId.includes('gold') ? '#facc15' : character.color;
    ctx.shadowColor = character.color;
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Hero Core Armor Pod
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = character.secondaryColor || '#ffffff';
    ctx.stroke();

    // Rotating Visor Glow / Cockpit Face
    const eyeOffsetX = cosAngle * 14;
    const eyeOffsetY = sinAngle * 4;
    ctx.beginPath();
    ctx.ellipse(eyeOffsetX, eyeOffsetY - 4, 10, 4, rad, 0, Math.PI * 2);
    ctx.fillStyle = skinId.includes('gold') ? '#fef08a' : '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.fill();

    // Dual Weapon Pods rotating with turntable
    ctx.save();
    ctx.translate(wx, wy);
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = skinId.includes('gold') ? '#f59e0b' : character.weapon.projectileColor;
    ctx.shadowColor = character.weapon.projectileColor;
    ctx.shadowBlur = 12;
    ctx.fill();

    // Barrel direction indicator
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cosAngle * 18, sinAngle * 6);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();

    // Center Avatar Icon
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character.avatarUrl, 0, 2);

    ctx.restore();
  }, [rotation, character, skinId, size]);

  // Drag to rotate handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    startRotation.current = rotation;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const newRot = (startRotation.current + deltaX * 1.2 + 3600) % 360;
    setRotation(newRot);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile swipe rotation
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    startRotation.current = rotation;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartX.current;
    const newRot = (startRotation.current + deltaX * 1.2 + 3600) % 360;
    setRotation(newRot);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* 360 Canvas Container with swipe rotation */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
        style={{ width: size, height: size }}
        title="Click and drag horizontally to rotate skin 360°"
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
        />

        {/* 360 Hologram Badge Pill */}
        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-cyan-500/30 flex items-center gap-1.5 text-[10px] font-bold text-cyan-300 shadow pointer-events-none">
          <Rotate3d size={12} className={isAutoRotating ? 'animate-spin' : ''} />
          <span>360° ROTATOR ({Math.round(rotation)}°)</span>
        </div>

        {/* Drag Hint overlay on hover */}
        <div className="absolute bottom-2 bg-slate-950/70 backdrop-blur-md px-3 py-0.5 rounded-full border border-slate-800 text-[10px] text-slate-400 pointer-events-none">
          Drag horizontally to inspect skin
        </div>
      </div>

      {/* Control Bar: Auto-Rotate Toggle & Angle Reset */}
      <div className="flex items-center justify-between w-full max-w-[260px] mt-2 px-1">
        <div className="text-left">
          <div className="text-xs font-bold text-white truncate max-w-[170px]">{skinName}</div>
          <div className="text-[10px] text-slate-400">{character.name} ({character.role})</div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsAutoRotating(!isAutoRotating);
          }}
          className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 text-[11px] font-bold ${
            isAutoRotating
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title={isAutoRotating ? 'Pause Auto-Spin' : 'Resume Auto-Spin'}
        >
          {isAutoRotating ? <Pause size={13} /> : <Play size={13} />}
          <span>{isAutoRotating ? 'Spin' : 'Paused'}</span>
        </button>
      </div>
    </div>
  );
};
