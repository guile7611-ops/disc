'use client';

import React from 'react';

interface PsyduckIconProps {
  className?: string;
  size?: number;
}

export function PsyduckIcon({ className = '', size = 180 }: PsyduckIconProps) {
  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* Brilho neon de fundo atrás do Psyduck */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-indigo-500/30 blur-2xl animate-pulse"
        style={{ transform: 'scale(1.2)' }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_10px_25px_rgba(245,158,11,0.3)] animate-[bounce_3s_infinite_ease-in-out]"
      >
        <defs>
          {/* Gradiente do Corpo do Psyduck */}
          <linearGradient id="psyduckYellow" x1="40" y1="20" x2="160" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Gradiente do Bico */}
          <linearGradient id="beakCream" x1="70" y1="100" x2="130" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>

          {/* Gradiente do Fone Gamer (Discord Indigo & Emerald) */}
          <linearGradient id="headphoneHeadband" x1="30" y1="20" x2="170" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5865F2" />
            <stop offset="50%" stopColor="#7983F5" />
            <stop offset="100%" stopColor="#5865F2" />
          </linearGradient>

          <linearGradient id="headphoneEar" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#23a55a" />
            <stop offset="100%" stopColor="#1d8a4b" />
          </linearGradient>
        </defs>

        {/* Fone de Ouvido - Arco (Headband) */}
        <path
          d="M 36 85 C 36 28, 164 28, 164 85"
          stroke="url(#headphoneHeadband)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Detalhes metálicos do Fone */}
        <path d="M 40 75 L 40 90" stroke="#949ba4" strokeWidth="4" strokeLinecap="round" />
        <path d="M 160 75 L 160 90" stroke="#949ba4" strokeWidth="4" strokeLinecap="round" />

        {/* Corpo / Cabeça Arredondada do Psyduck */}
        <ellipse cx="100" cy="105" rx="60" ry="58" fill="url(#psyduckYellow)" stroke="#B45309" strokeWidth="3" />

        {/* 3 Fios de Cabelo Clássicos do Psyduck no Topo */}
        <g stroke="#78350F" strokeWidth="3.5" strokeLinecap="round">
          <path d="M 96 47 Q 88 30 78 22" />
          <path d="M 100 46 Q 100 24 98 16" />
          <path d="M 104 47 Q 112 30 122 22" />
        </g>

        {/* Olhos de Psyduck (Confuso/Concentrado fofo) */}
        {/* Olho Esquerdo */}
        <circle cx="74" cy="90" r="14" fill="white" stroke="#78350F" strokeWidth="2.5" />
        <circle cx="74" cy="90" r="3.5" fill="#1E1B4B" />
        {/* Olho Direito */}
        <circle cx="126" cy="90" r="14" fill="white" stroke="#78350F" strokeWidth="2.5" />
        <circle cx="126" cy="90" r="3.5" fill="#1E1B4B" />

        {/* Sobrancelhas de confusão fofa */}
        <path d="M 64 72 Q 74 76 82 73" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M 136 72 Q 126 76 118 73" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Bico Característico do Psyduck */}
        <path
          d="M 68 108 C 68 96, 132 96, 132 108 C 132 135, 68 135, 68 108 Z"
          fill="url(#beakCream)"
          stroke="#D97706"
          strokeWidth="3"
        />
        {/* Narinas no Bico */}
        <circle cx="92" cy="107" r="1.8" fill="#B45309" />
        <circle cx="108" cy="107" r="1.8" fill="#B45309" />

        {/* Patinhas Segurando a Cabeça (Dor de cabeça / Ajustando o fone) */}
        {/* Pata Esquerda */}
        <path
          d="M 38 128 C 30 115, 36 95, 52 92 C 57 95, 58 105, 54 116 Z"
          fill="url(#psyduckYellow)"
          stroke="#B45309"
          strokeWidth="2.5"
        />
        {/* Pata Direita */}
        <path
          d="M 162 128 C 170 115, 164 95, 148 92 C 143 95, 142 105, 146 116 Z"
          fill="url(#psyduckYellow)"
          stroke="#B45309"
          strokeWidth="2.5"
        />

        {/* Almofadas dos Fones de Ouvido (Earcups Gamer) */}
        {/* Earcup Esquerdo */}
        <rect x="22" y="70" width="22" height="38" rx="11" fill="#18181B" stroke="#5865F2" strokeWidth="3" />
        <rect x="26" y="76" width="14" height="26" rx="7" fill="url(#headphoneEar)" />
        <circle cx="33" cy="89" r="3" fill="#23a55a" className="animate-ping" />

        {/* Earcup Direito */}
        <rect x="156" y="70" width="22" height="38" rx="11" fill="#18181B" stroke="#5865F2" strokeWidth="3" />
        <rect x="160" y="76" width="14" height="26" rx="7" fill="url(#headphoneEar)" />
        <circle cx="167" cy="89" r="3" fill="#23a55a" className="animate-ping" />

        {/* Microfone com Haste estendendo do Fone Gamer */}
        <path d="M 33 105 Q 36 135 64 126" stroke="#27272A" strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="62" y="121" width="10" height="9" rx="3" fill="#5865F2" />
        <circle cx="67" cy="125.5" r="1.5" fill="#23a55a" />

        {/* Ondas Sonoras / Estrelinhas de Confusão em Volta */}
        <g stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
          <path d="M 28 45 L 35 48 M 31 38 L 33 46" className="animate-bounce" />
          <path d="M 172 45 L 165 48 M 169 38 L 167 46" className="animate-bounce" />
        </g>
      </svg>
    </div>
  );
}
