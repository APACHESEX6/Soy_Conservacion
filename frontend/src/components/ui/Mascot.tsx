"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

const Frog = () => (
  <motion.svg viewBox="0 0 120 110" className="h-12 w-12 overflow-visible">
    <defs>
      <radialGradient id="frBodyG" cx="50%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#A3E635" />
        <stop offset="45%" stopColor="#65A30D" />
        <stop offset="100%" stopColor="#3F6212" />
      </radialGradient>
      <radialGradient id="frTopG" cx="50%" cy="25%" r="60%">
        <stop offset="0%" stopColor="#BEF264" />
        <stop offset="50%" stopColor="#84CC16" />
        <stop offset="100%" stopColor="#4D7C0F" />
      </radialGradient>
      <radialGradient id="frBellyG" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#F8F4EE" />
        <stop offset="60%" stopColor="#E8DDD0" />
        <stop offset="100%" stopColor="#D4C4B0" />
      </radialGradient>
      <radialGradient id="frLegG" cx="40%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#A3E635" />
        <stop offset="60%" stopColor="#65A30D" />
        <stop offset="100%" stopColor="#3F6212" />
      </radialGradient>
      <radialGradient id="frToeG" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="60%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#92400E" />
      </radialGradient>
      <radialGradient id="frIrisG" cx="38%" cy="32%" r="62%">
        <stop offset="0%" stopColor="#EAB308" />
        <stop offset="50%" stopColor="#A16207" />
        <stop offset="100%" stopColor="#713F12" />
      </radialGradient>
      <radialGradient id="frEyeWhiteG" cx="35%" cy="28%" r="65%">
        <stop offset="0%" stopColor="#FFFBF0" />
        <stop offset="100%" stopColor="#F5ECD7" />
      </radialGradient>
      <filter id="frShadow">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3F6212" floodOpacity="0.4" />
      </filter>
      <filter id="eyeGlow">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
      </filter>
    </defs>

    <motion.g
      filter="url(#frShadow)"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* ── Hind legs peeking behind body ── */}
      <path d="M18 82 C10 78 6 84 8 92" stroke="#65A30D" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M102 82 C110 78 114 84 112 92" stroke="#65A30D" strokeWidth="9" strokeLinecap="round" fill="none" />

      {/* ── Body — wide rounded belly ── */}
      <ellipse cx="60" cy="80" rx="36" ry="24" fill="url(#frBodyG)" />

      {/* Belly — cream/white large patch */}
      <ellipse cx="60" cy="83" rx="26" ry="18" fill="url(#frBellyG)" />
      {/* Belly texture hint */}
      <path d="M42 80 C50 76 70 76 78 80" stroke="#C4B49A" strokeWidth="0.6" fill="none" opacity="0.5" />
      <path d="M40 86 C50 82 70 82 80 86" stroke="#C4B49A" strokeWidth="0.6" fill="none" opacity="0.4" />
      <path d="M44 92 C52 89 68 89 76 92" stroke="#C4B49A" strokeWidth="0.6" fill="none" opacity="0.3" />

      {/* Belly/body border line */}
      <path d="M34 72 C42 68 78 68 86 72" stroke="#8B7355" strokeWidth="0.8" fill="none" opacity="0.35" />

      {/* ── Front arms resting forward ── */}
      {/* Left arm */}
      <path d="M30 84 C22 88 16 92 14 98" stroke="url(#frLegG)" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* Left forearm flat on ground */}
      <path d="M14 98 C12 100 18 102 28 101 C34 100 36 98 32 97" fill="#65A30D" stroke="#4D7C0F" strokeWidth="0.5" />
      {/* Left toes */}
      <ellipse cx="12" cy="101" rx="3.5" ry="2.5" fill="url(#frToeG)" transform="rotate(-30 12 101)" />
      <ellipse cx="18" cy="103" rx="3.5" ry="2.5" fill="url(#frToeG)" />
      <ellipse cx="24" cy="103" rx="3.5" ry="2.5" fill="url(#frToeG)" />
      <ellipse cx="30" cy="102" rx="3.5" ry="2.5" fill="url(#frToeG)" transform="rotate(15 30 102)" />
      {/* Toe pads left */}
      <circle cx="11" cy="100" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="18" cy="104" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="24" cy="104" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="31" cy="101" r="2" fill="#FCD34D" opacity="0.7" />

      {/* Right arm */}
      <path d="M90 84 C98 88 104 92 106 98" stroke="url(#frLegG)" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* Right forearm flat */}
      <path d="M106 98 C108 100 102 102 92 101 C86 100 84 98 88 97" fill="#65A30D" stroke="#4D7C0F" strokeWidth="0.5" />
      {/* Right toes */}
      <ellipse cx="108" cy="101" rx="3.5" ry="2.5" fill="url(#frToeG)" transform="rotate(30 108 101)" />
      <ellipse cx="102" cy="103" rx="3.5" ry="2.5" fill="url(#frToeG)" />
      <ellipse cx="96" cy="103" rx="3.5" ry="2.5" fill="url(#frToeG)" />
      <ellipse cx="90" cy="102" rx="3.5" ry="2.5" fill="url(#frToeG)" transform="rotate(-15 90 102)" />
      {/* Toe pads right */}
      <circle cx="109" cy="100" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="102" cy="104" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="96" cy="104" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="89" cy="101" r="2" fill="#FCD34D" opacity="0.7" />

      {/* ── Head ── */}
      <path d="M22 62 C20 46 32 30 60 28 C88 30 100 46 98 62 C96 74 80 82 60 82 C40 82 24 74 22 62 Z"
        fill="url(#frTopG)" />

      {/* Head sheen highlight */}
      <path d="M38 34 C48 28 72 28 82 34 C76 30 60 28 44 30 Z" fill="white" opacity="0.15" />

      {/* Skin texture bumps */}
      <circle cx="48" cy="50" r="1.2" fill="#84CC16" opacity="0.4" />
      <circle cx="55" cy="44" r="1" fill="#84CC16" opacity="0.35" />
      <circle cx="65" cy="44" r="1" fill="#84CC16" opacity="0.35" />
      <circle cx="72" cy="50" r="1.2" fill="#84CC16" opacity="0.4" />
      <circle cx="60" cy="48" r="0.9" fill="#84CC16" opacity="0.3" />
      <circle cx="44" cy="58" r="1" fill="#84CC16" opacity="0.3" />
      <circle cx="76" cy="58" r="1" fill="#84CC16" opacity="0.3" />

      {/* Tympanum */}
      <circle cx="24" cy="62" r="5" fill="#65A30D" stroke="#4D7C0F" strokeWidth="0.8" opacity="0.75" />
      <circle cx="24" cy="62" r="2.5" fill="#4D7C0F" opacity="0.5" />
      <circle cx="96" cy="62" r="5" fill="#65A30D" stroke="#4D7C0F" strokeWidth="0.8" opacity="0.75" />
      <circle cx="96" cy="62" r="2.5" fill="#4D7C0F" opacity="0.5" />

      {/* Mouth — wide subtle line */}
      <motion.path
        d="M32 72 C44 79 76 79 88 72"
        stroke="#4D7C0F" strokeWidth="2" fill="none" strokeLinecap="round"
        animate={{ d: ["M32 72 C44 79 76 79 88 72", "M31 72 C44 81 76 81 89 72", "M32 72 C44 79 76 79 88 72"] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <path d="M34 73 C46 78 74 78 86 73" stroke="#3F6212" strokeWidth="0.7" fill="none" opacity="0.4" />

      {/* Nostrils */}
      <ellipse cx="52" cy="65" rx="2.5" ry="1.6" fill="#4D7C0F" opacity="0.65" />
      <ellipse cx="68" cy="65" rx="2.5" ry="1.6" fill="#4D7C0F" opacity="0.65" />

      {/* ── Eyes — large, prominent, forward-facing ── */}
      {/* Eye socket mound */}
      <ellipse cx="36" cy="46" rx="16" ry="15" fill="#84CC16" />
      <ellipse cx="84" cy="46" rx="16" ry="15" fill="#84CC16" />
      {/* Mound shadow bottom */}
      <ellipse cx="36" cy="57" rx="13" ry="5" fill="#4D7C0F" opacity="0.2" />
      <ellipse cx="84" cy="57" rx="13" ry="5" fill="#4D7C0F" opacity="0.2" />

      {/* Eyeball */}
      <circle cx="36" cy="44" r="12" fill="url(#frEyeWhiteG)" filter="url(#eyeGlow)" />
      <circle cx="84" cy="44" r="12" fill="url(#frEyeWhiteG)" filter="url(#eyeGlow)" />

      {/* Iris — large golden */}
      <circle cx="36" cy="44" r="9" fill="url(#frIrisG)" />
      <circle cx="84" cy="44" r="9" fill="url(#frIrisG)" />
      {/* Iris fine lines */}
      <circle cx="36" cy="44" r="9" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
      <circle cx="84" cy="44" r="9" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
      <path d="M28 40 C32 36 40 36 44 40" stroke="#92400E" strokeWidth="0.4" fill="none" opacity="0.3" />
      <path d="M76 40 C80 36 88 36 92 40" stroke="#92400E" strokeWidth="0.4" fill="none" opacity="0.3" />

      {/* Pupil — large black teardrop */}
      <motion.ellipse cx="36" cy="45" rx="5" ry="7.5" fill="#0A0500"
        animate={{ ry: [7.5, 0.5, 7.5] }}
        transition={{ duration: 5.5, repeat: Infinity, times: [0, 0.05, 0.15] }}
      />
      <motion.ellipse cx="84" cy="45" rx="5" ry="7.5" fill="#0A0500"
        animate={{ ry: [7.5, 0.5, 7.5] }}
        transition={{ duration: 5.5, repeat: Infinity, times: [0, 0.05, 0.15] }}
      />

      {/* Eye shine — main */}
      <circle cx="40" cy="39" r="3.5" fill="white" opacity="0.88" />
      <circle cx="88" cy="39" r="3.5" fill="white" opacity="0.88" />
      {/* Eye shine — secondary */}
      <circle cx="31" cy="48" r="1.5" fill="white" opacity="0.35" />
      <circle cx="79" cy="48" r="1.5" fill="white" opacity="0.35" />
    </motion.g>
  </motion.svg>
);

const Monkey = () => (
  <motion.svg viewBox="0 0 100 120" className="h-12 w-12 overflow-visible">
    <defs>
      <radialGradient id="mkBodyG" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#D4C9A8" />
        <stop offset="55%" stopColor="#A89F82" />
        <stop offset="100%" stopColor="#6B6347" />
      </radialGradient>
      <radialGradient id="mkBellyG" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#F5EDD8" />
        <stop offset="60%" stopColor="#E8D9BC" />
        <stop offset="100%" stopColor="#C9B99A" />
      </radialGradient>
      <radialGradient id="mkHeadTopG" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#6B6B3A" />
        <stop offset="60%" stopColor="#4A4A28" />
        <stop offset="100%" stopColor="#2E2E18" />
      </radialGradient>
      <radialGradient id="mkFaceG" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#3D3530" />
        <stop offset="60%" stopColor="#2A2420" />
        <stop offset="100%" stopColor="#1A1510" />
      </radialGradient>
      <radialGradient id="mkCheekG" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#E8D9BC" />
        <stop offset="70%" stopColor="#C9B99A" />
        <stop offset="100%" stopColor="#A89F82" />
      </radialGradient>
      <radialGradient id="mkIrisG" cx="38%" cy="32%" r="62%">
        <stop offset="0%" stopColor="#C2853A" />
        <stop offset="60%" stopColor="#8B5E2A" />
        <stop offset="100%" stopColor="#5C3A18" />
      </radialGradient>
      <filter id="mkShadow">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3A3020" floodOpacity="0.4" />
      </filter>
    </defs>

    <motion.g
      filter="url(#mkShadow)"
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* ── Tail curving out to the left ── */}
      <motion.path
        d="M30 108 C10 112 2 106 4 96 C6 88 16 86 20 90"
        stroke="#8A8268" strokeWidth="5" strokeLinecap="round" fill="none"
        animate={{ d: ["M30 108 C10 112 2 106 4 96 C6 88 16 86 20 90", "M30 108 C8 114 0 107 3 96 C6 86 17 84 20 90", "M30 108 C10 112 2 106 4 96 C6 88 16 86 20 90"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ── Legs / lower body sitting ── */}
      {/* Left leg */}
      <path d="M28 90 C22 96 20 104 22 112" stroke="#8A8268" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* Right leg */}
      <path d="M72 90 C78 96 80 104 78 112" stroke="#8A8268" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* Feet */}
      <ellipse cx="22" cy="113" rx="8" ry="4" fill="#6B6347" transform="rotate(-10 22 113)" />
      <ellipse cx="78" cy="113" rx="8" ry="4" fill="#6B6347" transform="rotate(10 78 113)" />
      {/* Toes left */}
      <path d="M16 112 C14 115 14 117 16 116" stroke="#4A4030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M19 114 C17 117 17 119 19 118" stroke="#4A4030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M23 115 C22 118 22 120 24 119" stroke="#4A4030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M27 114 C26 117 27 119 29 118" stroke="#4A4030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Toes right */}
      <path d="M84 112 C86 115 86 117 84 116" stroke="#4A4030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M81 114 C83 117 83 119 81 118" stroke="#4A4030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M77 115 C78 118 78 120 76 119" stroke="#4A4030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M73 114 C74 117 73 119 71 118" stroke="#4A4030" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* ── Body ── */}
      <path d="M20 68 C18 80 20 96 28 108 C36 116 64 116 72 108 C80 96 82 80 80 68 C78 56 66 50 50 50 C34 50 22 56 20 68 Z"
        fill="url(#mkBodyG)" />

      {/* Belly — lighter front */}
      <path d="M32 66 C32 78 34 94 40 106 C44 112 56 112 60 106 C66 94 68 78 68 66 C66 58 58 54 50 54 C42 54 34 58 32 66 Z"
        fill="url(#mkBellyG)" opacity="0.85" />

      {/* Fur texture body */}
      <path d="M24 72 C30 68 40 66 50 66" stroke="#B8AF92" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M76 72 C70 68 60 66 50 66" stroke="#B8AF92" strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M22 82 C28 78 38 76 50 76" stroke="#B8AF92" strokeWidth="0.8" fill="none" opacity="0.35" />
      <path d="M78 82 C72 78 62 76 50 76" stroke="#B8AF92" strokeWidth="0.8" fill="none" opacity="0.35" />

      {/* ── Arms resting at sides ── */}
      {/* Left arm */}
      <path d="M22 68 C16 76 14 86 16 96" stroke="#8A8268" strokeWidth="9" strokeLinecap="round" fill="none" />
      <ellipse cx="15" cy="97" rx="6" ry="4" fill="#6B6347" />
      {/* Right arm */}
      <path d="M78 68 C84 76 86 86 84 96" stroke="#8A8268" strokeWidth="9" strokeLinecap="round" fill="none" />
      <ellipse cx="85" cy="97" rx="6" ry="4" fill="#6B6347" />

      {/* ── Neck ── */}
      <path d="M36 50 C36 44 42 40 50 40 C58 40 64 44 64 50 C62 54 56 56 50 56 C44 56 38 54 36 50 Z"
        fill="url(#mkBellyG)" />

      {/* ── Head ── */}
      {/* Head shape — slightly turned 3/4 */}
      <ellipse cx="50" cy="28" rx="26" ry="24" fill="url(#mkBellyG)" />

      {/* Top of head — olive/dark green-brown */}
      <path d="M26 24 C28 10 38 4 50 4 C62 4 72 10 74 24 C70 16 60 12 50 12 C40 12 30 16 26 24 Z"
        fill="url(#mkHeadTopG)" />

      {/* White brow band */}
      <path d="M28 24 C32 20 42 18 50 18 C58 18 68 20 72 24"
        stroke="#E8DFC8" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />

      {/* Cheek fur — cream/beige puffed */}
      <ellipse cx="28" cy="30" rx="10" ry="12" fill="url(#mkCheekG)" opacity="0.9" />
      <ellipse cx="72" cy="30" rx="10" ry="12" fill="url(#mkCheekG)" opacity="0.9" />

      {/* Fur texture on cheeks */}
      <path d="M20 26 C22 22 26 22 28 26" stroke="#C9B99A" strokeWidth="0.7" fill="none" opacity="0.5" />
      <path d="M20 30 C22 26 26 26 28 30" stroke="#C9B99A" strokeWidth="0.7" fill="none" opacity="0.4" />
      <path d="M72 26 C74 22 78 22 80 26" stroke="#C9B99A" strokeWidth="0.7" fill="none" opacity="0.5" />
      <path d="M72 30 C74 26 78 26 80 30" stroke="#C9B99A" strokeWidth="0.7" fill="none" opacity="0.4" />

      {/* ── Face — dark mask ── */}
      <path d="M34 22 C36 14 42 10 50 10 C58 10 64 14 66 22 C68 30 66 40 62 46 C58 50 42 50 38 46 C34 40 32 30 34 22 Z"
        fill="url(#mkFaceG)" opacity="0.88" />

      {/* ── Eyes ── */}
      {/* Eye socket */}
      <ellipse cx="42" cy="26" rx="8" ry="7" fill="#1A1510" />
      <ellipse cx="60" cy="26" rx="8" ry="7" fill="#1A1510" />
      {/* Eyeball */}
      <circle cx="42" cy="25" r="5.5" fill="#F5EDD8" />
      <circle cx="60" cy="25" r="5.5" fill="#F5EDD8" />
      {/* Iris */}
      <circle cx="42" cy="25" r="4" fill="url(#mkIrisG)" />
      <circle cx="60" cy="25" r="4" fill="url(#mkIrisG)" />
      {/* Pupil */}
      <motion.circle cx="43" cy="25" r="2.5" fill="#0A0500"
        animate={{ r: [2.5, 0.2, 2.5] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.05, 0.15] }}
      />
      <motion.circle cx="61" cy="25" r="2.5" fill="#0A0500"
        animate={{ r: [2.5, 0.2, 2.5] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.05, 0.15] }}
      />
      {/* Eye shine */}
      <circle cx="44" cy="23" r="1.5" fill="white" opacity="0.9" />
      <circle cx="62" cy="23" r="1.5" fill="white" opacity="0.9" />

      {/* ── Nose — flat dark ── */}
      <ellipse cx="50" cy="34" rx="5" ry="3.5" fill="#1A1510" />
      <ellipse cx="47" cy="34" rx="1.8" ry="1.5" fill="#0A0A0A" />
      <ellipse cx="53" cy="34" rx="1.8" ry="1.5" fill="#0A0A0A" />

      {/* ── Mouth — subtle closed expression ── */}
      <motion.path
        d="M42 42 C46 44 54 44 58 42"
        stroke="#2A2420" strokeWidth="1.8" fill="none" strokeLinecap="round"
        animate={{ d: ["M42 42 C46 44 54 44 58 42", "M42 42 C46 45 54 45 58 42", "M42 42 C46 44 54 44 58 42"] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      {/* Lip line */}
      <path d="M44 42 C48 43 52 43 56 42" stroke="#3D3530" strokeWidth="0.7" fill="none" opacity="0.5" />

      {/* Ears */}
      <ellipse cx="26" cy="26" rx="7" ry="8" fill="#8A8268" />
      <ellipse cx="26" cy="26" rx="4" ry="5" fill="#6B6347" opacity="0.7" />
      <ellipse cx="74" cy="26" rx="7" ry="8" fill="#8A8268" />
      <ellipse cx="74" cy="26" rx="4" ry="5" fill="#6B6347" opacity="0.7" />
    </motion.g>
  </motion.svg>
);

const Fish = () => (
  <motion.svg viewBox="0 0 110 90" className="h-12 w-12 overflow-visible">
    <defs>
      <radialGradient id="fishBodyG" cx="45%" cy="38%" r="62%">
        <stop offset="0%" stopColor="#FCA044" />
        <stop offset="40%" stopColor="#EA580C" />
        <stop offset="80%" stopColor="#C2410C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </radialGradient>
      <radialGradient id="fishBellyG" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="60%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#EA580C" />
      </radialGradient>
      <radialGradient id="fishHeadG" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FCA044" />
        <stop offset="55%" stopColor="#DC4E0A" />
        <stop offset="100%" stopColor="#9A3412" />
      </radialGradient>
      <linearGradient id="fishFinG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      <linearGradient id="fishTailG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#C2410C" />
        <stop offset="50%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#FCD34D" />
      </linearGradient>
      <filter id="fishShadow">
        <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#7C2D12" floodOpacity="0.45" />
      </filter>
    </defs>

    <motion.g
      filter="url(#fishShadow)"
      animate={{ x: [-1.5, 1.5, -1.5], y: [0, -1.5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* ── Tail — forked, elegant ── */}
      <motion.g
        style={{ transformOrigin: "68px 45px" }}
        animate={{ rotate: [-12, 12, -12] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Upper tail lobe */}
        <path d="M68 42 C78 34 92 24 100 20 C96 30 86 38 80 44 Z" fill="url(#fishTailG)" />
        {/* Lower tail lobe */}
        <path d="M68 48 C78 56 92 66 100 70 C96 60 86 52 80 46 Z" fill="url(#fishTailG)" />
        {/* Tail rays */}
        <path d="M72 42 L92 24" stroke="#FCD34D" strokeWidth="0.7" opacity="0.5" />
        <path d="M74 43 L96 28" stroke="#FCD34D" strokeWidth="0.7" opacity="0.4" />
        <path d="M74 47 L96 62" stroke="#FCD34D" strokeWidth="0.7" opacity="0.4" />
        <path d="M72 48 L92 66" stroke="#FCD34D" strokeWidth="0.7" opacity="0.5" />
        {/* Tail center notch */}
        <path d="M68 44 C72 44 76 45 80 45" stroke="#C2410C" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
      </motion.g>

      {/* ── Dorsal fin — tall with rays ── */}
      <path d="M28 22 C34 10 46 6 58 10 C66 14 70 20 68 24 C60 18 46 14 28 22 Z"
        fill="url(#fishFinG)" opacity="0.9" />
      <path d="M32 22 L34 10" stroke="#FCD34D" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
      <path d="M38 20 L40 8" stroke="#FCD34D" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
      <path d="M44 18 L46 6" stroke="#FCD34D" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
      <path d="M50 17 L52 7" stroke="#FCD34D" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
      <path d="M56 17 L58 9" stroke="#FCD34D" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
      <path d="M62 19 L64 13" stroke="#FCD34D" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />

      {/* ── Ventral fins (bottom pair) ── */}
      <path d="M32 62 C28 72 24 78 22 82 C28 78 36 72 38 64 Z"
        fill="url(#fishFinG)" opacity="0.85" />
      <path d="M26 72 L30 64" stroke="#FCD34D" strokeWidth="0.7" opacity="0.5" />
      <path d="M24 76 L28 68" stroke="#FCD34D" strokeWidth="0.7" opacity="0.5" />

      <path d="M46 64 C44 74 42 80 40 84 C46 78 52 72 52 66 Z"
        fill="url(#fishFinG)" opacity="0.8" />

      {/* ── Anal fin ── */}
      <path d="M38 64 C40 72 46 76 52 72 C48 70 42 66 40 62 Z"
        fill="url(#fishFinG)" opacity="0.75" />

      {/* ── Pectoral fin ── */}
      <path d="M22 46 C16 52 14 60 18 66 C24 60 28 52 26 46 Z"
        fill="url(#fishFinG)" opacity="0.8" />
      <path d="M20 50 L16 58" stroke="#FCD34D" strokeWidth="0.7" opacity="0.5" />
      <path d="M22 54 L18 62" stroke="#FCD34D" strokeWidth="0.7" opacity="0.5" />

      {/* ── Main body ── */}
      <path d="M10 45 C12 28 24 18 42 16 C58 14 72 22 76 36 C80 48 76 60 64 66 C50 72 28 70 16 62 C10 58 8 52 10 45 Z"
        fill="url(#fishBodyG)" />

      {/* ── Belly highlight ── */}
      <path d="M14 50 C16 38 26 30 42 28 C56 26 68 34 70 44 C68 54 58 62 44 64 C30 66 16 60 14 50 Z"
        fill="url(#fishBellyG)" opacity="0.45" />

      {/* ── Scales — arc grid ── */}
      {/* Row 1 */}
      <path d="M22 36 Q27 31 32 36" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.55" />
      <path d="M32 36 Q37 31 42 36" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.55" />
      <path d="M42 36 Q47 31 52 36" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.55" />
      <path d="M52 36 Q57 31 62 36" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.55" />
      <path d="M62 36 Q67 31 72 36" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Row 2 */}
      <path d="M18 44 Q23 39 28 44" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M28 44 Q33 39 38 44" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M38 44 Q43 39 48 44" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M48 44 Q53 39 58 44" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M58 44 Q63 39 68 44" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M68 44 Q72 40 76 44" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.45" />
      {/* Row 3 */}
      <path d="M18 52 Q23 47 28 52" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.45" />
      <path d="M28 52 Q33 47 38 52" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.45" />
      <path d="M38 52 Q43 47 48 52" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.45" />
      <path d="M48 52 Q53 47 58 52" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.45" />
      <path d="M58 52 Q63 47 68 52" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.45" />
      {/* Row 4 */}
      <path d="M22 60 Q27 55 32 60" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M32 60 Q37 55 42 60" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M42 60 Q47 55 52 60" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M52 60 Q57 55 62 60" stroke="#C2410C" strokeWidth="1" fill="none" opacity="0.4" />

      {/* ── Lateral line ── */}
      <path d="M22 46 C36 44 52 44 68 46" stroke="#FCA044" strokeWidth="0.8" fill="none" opacity="0.4" />
      {/* Lateral line dots */}
      <circle cx="28" cy="45" r="0.8" fill="#9A3412" opacity="0.5" />
      <circle cx="36" cy="44" r="0.8" fill="#9A3412" opacity="0.5" />
      <circle cx="44" cy="44" r="0.8" fill="#9A3412" opacity="0.5" />
      <circle cx="52" cy="44" r="0.8" fill="#9A3412" opacity="0.5" />
      <circle cx="60" cy="45" r="0.8" fill="#9A3412" opacity="0.5" />

      {/* ── Head ── */}
      <path d="M10 45 C10 34 16 24 24 20 C30 18 36 20 38 26 C34 28 28 34 26 42 C24 50 26 58 30 62 C24 64 16 60 12 54 C10 52 10 48 10 45 Z"
        fill="url(#fishHeadG)" />

      {/* ── Gill plate ── */}
      <path d="M26 26 C22 34 22 54 26 62" stroke="#9A3412" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7" />
      <path d="M28 28 C24 36 24 52 28 60" stroke="#FCA044" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.35" />

      {/* ── Eye ── */}
      <circle cx="18" cy="40" r="7" fill="#1A0A00" />
      <circle cx="18" cy="40" r="5.5" fill="#0A0500" />
      <circle cx="20" cy="38" r="2.2" fill="white" opacity="0.85" />
      <circle cx="16" cy="42" r="0.9" fill="white" opacity="0.3" />
      {/* Eye ring */}
      <circle cx="18" cy="40" r="7" fill="none" stroke="#EA580C" strokeWidth="1" opacity="0.6" />

      {/* ── Mouth ── */}
      <path d="M8 46 C6 44 6 48 8 50" stroke="#9A3412" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M8 46 C10 44 10 48 8 50" stroke="#C2410C" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
    </motion.g>
  </motion.svg>
);

const Toucan = () => (
  <motion.svg viewBox="0 0 100 100" className="h-12 w-12 overflow-visible">
    <defs>
      <radialGradient id="tcBodyG" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stopColor="#374151" />
        <stop offset="100%" stopColor="#0F172A" />
      </radialGradient>
      <radialGradient id="tcChestG" cx="50%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="80%" stopColor="#FEF9C3" />
        <stop offset="100%" stopColor="#FEF08A" />
      </radialGradient>
      <linearGradient id="tcBeakTopG" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="40%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
      <linearGradient id="tcBeakBotG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#A3E635" />
        <stop offset="60%" stopColor="#65A30D" />
        <stop offset="100%" stopColor="#3F6212" />
      </linearGradient>
      <filter id="tcShadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.45" />
      </filter>
    </defs>

    <motion.g
      filter="url(#tcShadow)"
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Branch */}
      <rect x="8" y="88" width="84" height="6" rx="3" fill="#713F12" />
      <rect x="8" y="88" width="84" height="2" rx="1" fill="#92400E" opacity="0.5" />

      {/* Tail feathers */}
      <path d="M22 86 C16 90 12 96 10 102" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M27 87 C22 92 19 98 18 104" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M32 87 C28 93 26 99 25 105" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Body */}
      <ellipse cx="40" cy="73" rx="23" ry="19" fill="url(#tcBodyG)" />

      {/* Chest white/yellow patch */}
      <path d="M26 62 C28 54 36 50 44 50 C52 50 58 54 58 62 C58 72 52 78 44 78 C36 78 26 72 26 62 Z" fill="url(#tcChestG)" />

      {/* Red band at bottom of chest */}
      <path d="M27 72 C32 78 56 78 57 72 C54 76 44 78 34 76 Z" fill="#EF4444" />
      {/* Orange transition above red */}
      <path d="M27 70 C32 74 56 74 57 70 C54 72 44 73 34 72 Z" fill="#F97316" opacity="0.6" />

      {/* Wing texture */}
      <path d="M20 68 C18 74 18 80 20 86" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
      <motion.path
        d="M24 66 C20 74 20 82 24 88"
        stroke="#374151" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5"
        animate={{ d: ["M24 66 C20 74 20 82 24 88", "M24 66 C19 73 19 81 23 88", "M24 66 C20 74 20 82 24 88"] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      {/* Feet */}
      <path d="M34 88 C32 92 28 94 26 95" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M34 88 C33 93 31 96 30 97" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M34 88 C35 93 35 96 34 97" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M34 88 C36 92 38 94 39 95" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M46 88 C44 92 40 94 38 95" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M46 88 C45 93 43 96 42 97" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M46 88 C47 93 47 96 46 97" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M46 88 C48 92 50 94 51 95" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <path d="M34 54 C36 46 44 42 52 44 C60 46 64 52 62 58 C58 52 50 48 44 50 C38 52 36 56 34 54 Z" fill="url(#tcBodyG)" />

      {/* Head */}
      <ellipse cx="54" cy="38" rx="20" ry="18" fill="url(#tcBodyG)" />

      {/* Eye ring — bright blue/teal */}
      <circle cx="62" cy="33" r="9.5" fill="#0EA5E9" />
      <circle cx="62" cy="33" r="7" fill="#0F172A" />
      {/* Iris */}
      <circle cx="62" cy="33" r="5" fill="#1E3A5F" />
      {/* Pupil */}
      <motion.circle
        cx="62" cy="33" r="3.5" fill="#050A14"
        animate={{ r: [3.5, 0.3, 3.5] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.06, 0.16] }}
      />
      <circle cx="64" cy="31" r="1.8" fill="white" opacity="0.9" />
      <circle cx="60" cy="35" r="0.8" fill="white" opacity="0.35" />

      {/* Upper beak — large and curved downward */}
      <path
        d="M60 40 C68 36 80 36 90 42 C94 46 92 52 88 56 C80 60 66 58 60 52 Z"
        fill="url(#tcBeakTopG)"
        stroke="#A16207"
        strokeWidth="0.8"
      />
      {/* Beak culmen ridge */}
      <path d="M62 40 C72 37 84 38 90 43" stroke="#A16207" strokeWidth="1" fill="none" opacity="0.6" />
      {/* Beak serration hint */}
      <path d="M72 56 C76 58 80 58 84 56" stroke="#A16207" strokeWidth="0.6" fill="none" opacity="0.4" />

      {/* Lower beak — green (characteristic of toucans) */}
      <path
        d="M60 52 C68 56 82 56 88 52 C90 54 90 57 87 59 C80 64 66 62 60 56 Z"
        fill="url(#tcBeakBotG)"
        stroke="#3F6212"
        strokeWidth="0.7"
      />

      {/* Beak tip red/orange spot */}
      <ellipse cx="90" cy="48" rx="4" ry="5" fill="#EF4444" opacity="0.85" />
      <ellipse cx="90" cy="47" rx="2" ry="2" fill="#FCA5A5" opacity="0.5" />
    </motion.g>
  </motion.svg>
);

const Butterfly = () => (
  <motion.svg viewBox="0 0 100 100" className="h-12 w-12 overflow-visible">
    <defs>
      <radialGradient id="wTLG" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="60%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#9A3412" />
      </radialGradient>
      <radialGradient id="wTRG" cx="70%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="60%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#9A3412" />
      </radialGradient>
      <radialGradient id="wBLG" cx="30%" cy="60%" r="70%">
        <stop offset="0%" stopColor="#FDBA74" />
        <stop offset="70%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </radialGradient>
      <radialGradient id="wBRG" cx="70%" cy="60%" r="70%">
        <stop offset="0%" stopColor="#FDBA74" />
        <stop offset="70%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </radialGradient>
      <filter id="bfShadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#7C2D12" floodOpacity="0.3" />
      </filter>
    </defs>

    <motion.g
      filter="url(#bfShadow)"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Wings flap via scaleX on each side */}
      {/* Left upper wing */}
      <motion.path
        d="M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55 Z"
        fill="url(#wTLG)"
        stroke="#431407"
        strokeWidth="1"
        animate={{ d: ["M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55 Z", "M49 46 C46 36 30 24 20 30 C14 38 26 56 49 55 Z", "M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55 Z"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Left upper wing black border */}
      <motion.path
        d="M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55"
        fill="none" stroke="#1C0500" strokeWidth="3" opacity="0.65"
        animate={{ d: ["M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55", "M49 46 C46 36 30 24 20 30 C14 38 26 56 49 55", "M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* White spots upper left */}
      <motion.g
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="12" cy="26" r="2.2" fill="white" opacity="0.9" />
        <circle cx="20" cy="20" r="1.6" fill="white" opacity="0.9" />
        <circle cx="7" cy="36" r="1.6" fill="white" opacity="0.9" />
        <circle cx="8" cy="46" r="1.4" fill="white" opacity="0.8" />
      </motion.g>

      {/* Left lower wing */}
      <motion.path
        d="M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70 Z"
        fill="url(#wBLG)"
        stroke="#431407"
        strokeWidth="1"
        animate={{ d: ["M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70 Z", "M49 56 C38 60 20 70 22 82 C26 92 42 92 49 70 Z", "M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70 Z"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70"
        fill="none" stroke="#1C0500" strokeWidth="3" opacity="0.65"
        animate={{ d: ["M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70", "M49 56 C38 60 20 70 22 82 C26 92 42 92 49 70", "M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="16" cy="84" r="2" fill="white" opacity="0.9" />
        <circle cx="26" cy="90" r="1.6" fill="white" opacity="0.9" />
        <circle cx="10" cy="74" r="1.4" fill="white" opacity="0.8" />
      </motion.g>

      {/* Right upper wing */}
      <motion.path
        d="M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55 Z"
        fill="url(#wTRG)"
        stroke="#431407"
        strokeWidth="1"
        animate={{ d: ["M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55 Z", "M51 46 C54 36 70 24 80 30 C86 38 74 56 51 55 Z", "M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55 Z"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55"
        fill="none" stroke="#1C0500" strokeWidth="3" opacity="0.65"
        animate={{ d: ["M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55", "M51 46 C54 36 70 24 80 30 C86 38 74 56 51 55", "M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g
        animate={{ x: [0, -6, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="88" cy="26" r="2.2" fill="white" opacity="0.9" />
        <circle cx="80" cy="20" r="1.6" fill="white" opacity="0.9" />
        <circle cx="93" cy="36" r="1.6" fill="white" opacity="0.9" />
        <circle cx="92" cy="46" r="1.4" fill="white" opacity="0.8" />
      </motion.g>

      {/* Right lower wing */}
      <motion.path
        d="M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70 Z"
        fill="url(#wBRG)"
        stroke="#431407"
        strokeWidth="1"
        animate={{ d: ["M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70 Z", "M51 56 C62 60 80 70 78 82 C74 92 58 92 51 70 Z", "M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70 Z"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70"
        fill="none" stroke="#1C0500" strokeWidth="3" opacity="0.65"
        animate={{ d: ["M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70", "M51 56 C62 60 80 70 78 82 C74 92 58 92 51 70", "M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70"] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g
        animate={{ x: [0, -6, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="84" cy="84" r="2" fill="white" opacity="0.9" />
        <circle cx="74" cy="90" r="1.6" fill="white" opacity="0.9" />
        <circle cx="90" cy="74" r="1.4" fill="white" opacity="0.8" />
      </motion.g>

      {/* Body — segmented abdomen */}
      <ellipse cx="50" cy="62" rx="3" ry="16" fill="#1C0500" />
      <path d="M47 54 C47 58 53 58 53 54" stroke="#3D0E00" strokeWidth="0.6" fill="none" opacity="0.5" />
      <path d="M47 60 C47 64 53 64 53 60" stroke="#3D0E00" strokeWidth="0.6" fill="none" opacity="0.5" />
      <path d="M47 66 C47 70 53 70 53 66" stroke="#3D0E00" strokeWidth="0.6" fill="none" opacity="0.5" />

      {/* Thorax */}
      <ellipse cx="50" cy="50" rx="3.5" ry="5" fill="#2D0A00" />

      {/* Head */}
      <circle cx="50" cy="43" r="4" fill="#1C0500" />
      {/* Eyes */}
      <circle cx="47" cy="42" r="1.8" fill="#4ADE80" opacity="0.9" />
      <circle cx="53" cy="42" r="1.8" fill="#4ADE80" opacity="0.9" />
      <circle cx="47.5" cy="41.5" r="0.7" fill="white" opacity="0.8" />
      <circle cx="53.5" cy="41.5" r="0.7" fill="white" opacity="0.8" />

      {/* Antennae */}
      <motion.path
        d="M49 40 C46 34 40 28 37 24"
        stroke="#1C0500" strokeWidth="1.2" strokeLinecap="round" fill="none"
        animate={{ d: ["M49 40 C46 34 40 28 37 24", "M49 40 C47 34 42 29 39 25", "M49 40 C46 34 40 28 37 24"] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M51 40 C54 34 60 28 63 24"
        stroke="#1C0500" strokeWidth="1.2" strokeLinecap="round" fill="none"
        animate={{ d: ["M51 40 C54 34 60 28 63 24", "M51 40 C53 34 58 29 61 25", "M51 40 C54 34 60 28 63 24"] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Antenna clubs */}
      <motion.circle cx="37" cy="24" r="2.5" fill="#1C0500"
        animate={{ cx: [37, 39, 37], cy: [24, 25, 24] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle cx="63" cy="24" r="2.5" fill="#1C0500"
        animate={{ cx: [63, 61, 63], cy: [24, 25, 24] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.g>
  </motion.svg>
);

export function Mascot() {
  const [index, setIndex] = useState(0);
  const mascots = [<Frog key="f" />, <Monkey key="m" />, <Fish key="fi" />, <Toucan key="t" />, <Butterfly key="b" />];

  useEffect(() => {
    const timer = setInterval(() => setIndex((p) => (p + 1) % mascots.length), 10000);
    return () => clearInterval(timer);
  }, [index, mascots.length]);

  return (
    <div className="flex h-14 w-14 items-center justify-center">
      <div className="relative flex items-center justify-center w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-sky-500/10 rounded-full blur-2xl" />
        <motion.div
          onClick={() => setIndex((p) => (p + 1) % mascots.length)}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
          className="flex items-center justify-center cursor-pointer"
          style={{ willChange: "transform" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center"
            >
              {mascots[index]}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
