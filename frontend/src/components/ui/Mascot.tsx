"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const Frog = () => (
  <motion.svg viewBox="0 0 120 110" className="h-12 w-12 overflow-visible scale-[1.05]">
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
      {/*        Hind legs peeking behind body        */}
      <path
        d="M18 82 C10 78 6 84 8 92"
        stroke="#65A30D"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M102 82 C110 78 114 84 112 92"
        stroke="#65A30D"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />

      {/*        Body "  wide rounded belly        */}
      <motion.g
        animate={{ scaleY: [1, 1.03, 1], scaleX: [1, 1.01, 1] }}
        style={{ originX: "60px", originY: "104px" }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx="60" cy="80" rx="36" ry="24" fill="url(#frBodyG)" />
        {/* Belly "  cream/white large patch */}
        <ellipse cx="60" cy="83" rx="26" ry="18" fill="url(#frBellyG)" />
      </motion.g>

      {/* Belly texture hint */}
      <path
        d="M42 80 C50 76 70 76 78 80"
        stroke="#C4B49A"
        strokeWidth="0.6"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M40 86 C50 82 70 82 80 86"
        stroke="#C4B49A"
        strokeWidth="0.6"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M44 92 C52 89 68 89 76 92"
        stroke="#C4B49A"
        strokeWidth="0.6"
        fill="none"
        opacity="0.3"
      />

      {/* Belly/body border line */}
      <path
        d="M34 72 C42 68 78 68 86 72"
        stroke="#8B7355"
        strokeWidth="0.8"
        fill="none"
        opacity="0.35"
      />

      {/*        Front arms resting forward        */}
      <path
        d="M30 84 C22 88 16 92 14 98"
        stroke="url(#frLegG)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 98 C12 100 18 102 28 101 C34 100 36 98 32 97"
        fill="#65A30D"
        stroke="#4D7C0F"
        strokeWidth="0.5"
      />
      <ellipse cx="12" cy="101" rx="3.5" ry="2.5" fill="url(#frToeG)" transform="rotate(-30 12 101)" />
      <ellipse cx="18" cy="103" rx="3.5" ry="2.5" fill="url(#frToeG)" />
      <ellipse cx="24" cy="103" rx="3.5" ry="2.5" fill="url(#frToeG)" />
      <ellipse cx="30" cy="102" rx="3.5" ry="2.5" fill="url(#frToeG)" transform="rotate(15 30 102)" />
      <circle cx="11" cy="100" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="18" cy="104" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="24" cy="104" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="31" cy="101" r="2" fill="#FCD34D" opacity="0.7" />

      <path
        d="M90 84 C98 88 104 92 106 98"
        stroke="url(#frLegG)"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M106 98 C108 100 102 102 92 101 C86 100 84 98 88 97"
        fill="#65A30D"
        stroke="#4D7C0F"
        strokeWidth="0.5"
      />
      <ellipse cx="108" cy="101" rx="3.5" ry="2.5" fill="url(#frToeG)" transform="rotate(30 108 101)" />
      <ellipse cx="102" cy="103" rx="3.5" ry="2.5" fill="url(#frToeG)" />
      <ellipse cx="96" cy="103" rx="3.5" ry="2.5" fill="url(#frToeG)" />
      <ellipse cx="90" cy="102" rx="3.5" ry="2.5" fill="url(#frToeG)" transform="rotate(-15 90 102)" />
      <circle cx="109" cy="100" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="102" cy="104" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="96" cy="104" r="2" fill="#FCD34D" opacity="0.7" />
      <circle cx="89" cy="101" r="2" fill="#FCD34D" opacity="0.7" />

      {/*        Head        */}
      <path
        d="M22 62 C20 46 32 30 60 28 C88 30 100 46 98 62 C96 74 80 82 60 82 C40 82 24 74 22 62 Z"
        fill="url(#frTopG)"
      />
      <path d="M38 34 C48 28 72 28 82 34 C76 30 60 28 44 30 Z" fill="white" opacity="0.15" />
      <circle cx="48" cy="50" r="1.2" fill="#84CC16" opacity="0.4" />
      <circle cx="55" cy="44" r="1" fill="#84CC16" opacity="0.35" />
      <circle cx="65" cy="44" r="1" fill="#84CC16" opacity="0.35" />
      <circle cx="72" cy="50" r="1.2" fill="#84CC16" opacity="0.4" />
      <circle cx="60" cy="48" r="0.9" fill="#84CC16" opacity="0.3" />
      <circle cx="44" cy="58" r="1" fill="#84CC16" opacity="0.3" />
      <circle cx="76" cy="58" r="1" fill="#84CC16" opacity="0.3" />

      <circle cx="24" cy="62" r="5" fill="#65A30D" stroke="#4D7C0F" strokeWidth="0.8" opacity="0.75" />
      <circle cx="24" cy="62" r="2.5" fill="#4D7C0F" opacity="0.5" />
      <circle cx="96" cy="62" r="5" fill="#65A30D" stroke="#4D7C0F" strokeWidth="0.8" opacity="0.75" />

      {/*        The Fly        */}
      <motion.g
        animate={{
          x: [-20, 10, 30, 15, 15, 15, 15, -20],
          y: [20, 30, 40, 65, 60, 65, 65, 20],
          opacity: [0, 1, 1, 1, 1, 1, 0, 0]
        }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.4, 0.5, 0.6, 0.75, 0.8, 1], ease: "easeInOut" }}
      >
        <circle cx="0" cy="0" r="6" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="-2" cy="2" r="3" fill="#10B981" />
        <circle cx="3" cy="-1" r="1.5" fill="white" />
        <circle cx="3.5" cy="-1" r="0.5" fill="black" />
        <circle cx="-3" cy="-1" r="1.5" fill="white" />
        <circle cx="-2.5" cy="-1" r="0.5" fill="black" />
        <motion.ellipse
          cx="4" cy="-4" rx="8" ry="3.5" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1" opacity="0.85"
          animate={{ rotate: [-35, 35, -35] }} transition={{ duration: 0.08, repeat: Infinity }}
          style={{ originX: "0px", originY: "0px" }}
        />
        <motion.ellipse
          cx="-4" cy="-4" rx="8" ry="3.5" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1" opacity="0.85"
          animate={{ rotate: [35, -35, 35] }} transition={{ duration: 0.08, repeat: Infinity }}
          style={{ originX: "0px", originY: "0px" }}
        />
      </motion.g>

      {/*        Mouth Interior (Depth)        */}
      <motion.path
        fill="#270303"
        animate={{
          d: [
            "M32 72 C44 79 76 79 88 72 C76 79 44 79 32 72",
            "M31 72 C44 81 76 81 89 72 C76 81 44 81 31 72",
            "M32 72 C44 79 76 79 88 72 C76 79 44 79 32 72",
            "M32 72 C44 75 76 75 88 72 C76 98 44 98 32 72",
            "M32 72 C44 92 76 92 88 72 C76 92 44 92 32 72",
            "M32 72 C44 79 76 79 88 72 C76 79 44 79 32 72",
            "M32 72 C44 79 76 79 88 72 C76 79 44 79 32 72",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.75, 0.8, 0.85, 0.9, 1] }}
      />

      {/*        Frog Tongue        */}
      <motion.line
        x1="60" y1="85"
        stroke="#F472B6"
        strokeWidth="5"
        strokeLinecap="round"
        animate={{ x2: [60, 60, 15, 60, 60], y2: [85, 85, 65, 85, 85], opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.75, 0.8, 0.85, 1] }}
      />

      {/*        Upper Lip Line        */}
      <motion.path
        d="M32 72 C44 79 76 79 88 72"
        stroke="#4D7C0F"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        animate={{
          d: [
            "M32 72 C44 79 76 79 88 72",
            "M31 72 C44 81 76 81 89 72",
            "M32 72 C44 79 76 79 88 72",
            "M32 72 C44 75 76 75 88 72",
            "M32 72 C44 92 76 92 88 72",
            "M32 72 C44 79 76 79 88 72",
            "M32 72 C44 79 76 79 88 72",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.2, 0.75, 0.8, 0.85, 0.9, 1] }}
      />
      <path
        d="M34 73 C46 78 74 78 86 73"
        stroke="#3F6212"
        strokeWidth="0.7"
        fill="none"
        opacity="0.4"
      />

      <ellipse cx="52" cy="65" rx="2.5" ry="1.6" fill="#4D7C0F" opacity="0.65" />
      <ellipse cx="68" cy="65" rx="2.5" ry="1.6" fill="#4D7C0F" opacity="0.65" />

      <ellipse cx="36" cy="46" rx="16" ry="15" fill="#84CC16" />
      <ellipse cx="84" cy="46" rx="16" ry="15" fill="#84CC16" />
      <ellipse cx="36" cy="57" rx="13" ry="5" fill="#4D7C0F" opacity="0.2" />
      <ellipse cx="84" cy="57" rx="13" ry="5" fill="#4D7C0F" opacity="0.2" />

      <circle cx="36" cy="44" r="12" fill="url(#frEyeWhiteG)" filter="url(#eyeGlow)" />
      <circle cx="84" cy="44" r="12" fill="url(#frEyeWhiteG)" filter="url(#eyeGlow)" />

      <circle cx="36" cy="44" r="9" fill="url(#frIrisG)" />
      <circle cx="84" cy="44" r="9" fill="url(#frIrisG)" />
      <circle cx="36" cy="44" r="9" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
      <circle cx="84" cy="44" r="9" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
      <path d="M28 40 C32 36 40 36 44 40" stroke="#92400E" strokeWidth="0.4" fill="none" opacity="0.3" />
      <path d="M76 40 C80 36 88 36 92 40" stroke="#92400E" strokeWidth="0.4" fill="none" opacity="0.3" />

      <motion.ellipse
        cx="36" cy="45" rx="5" ry="7.5" fill="#0A0500"
        animate={{ ry: [7.5, 7.5, 0.5, 7.5, 7.5] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.55, 0.6, 0.7, 1], ease: "easeInOut" }}
      />
      <motion.ellipse
        cx="84" cy="45" rx="5" ry="7.5" fill="#0A0500"
        animate={{ ry: [7.5, 7.5, 0.5, 7.5, 7.5] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.55, 0.6, 0.7, 1], ease: "easeInOut" }}
      />

      <circle cx="40" cy="39" r="3.5" fill="white" opacity="0.88" />
      <circle cx="88" cy="39" r="3.5" fill="white" opacity="0.88" />
      <circle cx="31" cy="48" r="1.5" fill="white" opacity="0.35" />
      <circle cx="79" cy="48" r="1.5" fill="white" opacity="0.35" />
    </motion.g>
  </motion.svg>
);

const Dory = () => (
  <motion.svg viewBox="0 0 120 100" className="h-12 w-12 overflow-visible scale-[1.15]">
    <defs>
      <radialGradient id="doryBodyG" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="40%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </radialGradient>
      <radialGradient id="doryIrisG" cx="45%" cy="45%" r="50%">
        <stop offset="0%" stopColor="#92400E" />
        <stop offset="60%" stopColor="#78350F" />
        <stop offset="100%" stopColor="#451A03" />
      </radialGradient>
      <linearGradient id="doryGlossG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.15" />
        <stop offset="40%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="doryPatternG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#020617" />
      </radialGradient>
      <linearGradient id="doryFinG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#EAB308" />
      </linearGradient>
      <filter id="doryShadow">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#020617" floodOpacity="0.5" />
      </filter>
    </defs>

    <motion.g
      filter="url(#doryShadow)"
      initial={{ y: 8 }}
      animate={{ y: [8, 6.5, 8], rotate: [-0.5, 0.5, -0.5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/*        Tail Fin (Masterpiece Fluidity)        */}
      <motion.g
        style={{ originX: "92px", originY: "50px" }}
        animate={{
          rotate: [-1.2, 1.2, -1.2],
          scaleX: [1, 1.05, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.path
          animate={{
            d: [
              "M92 50 C105 35 115 30 120 38 L120 62 C115 70 105 65 92 50 Z",
              "M92 50 C108 30 118 25 124 35 L124 65 C118 75 108 70 92 50 Z",
              "M92 50 C105 35 115 30 120 38 L120 62 C115 70 105 65 92 50 Z"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          fill="url(#doryFinG)"
        />
        <motion.path
          animate={{
            d: [
              "M92 50 C105 35 115 30 120 38 L112 42 C108 38 102 45 92 50 C102 55 108 62 112 58 L120 62 C115 70 105 65 92 50 Z",
              "M92 50 C108 30 118 25 124 35 L116 40 C112 35 105 45 92 50 C105 55 112 65 116 60 L124 65 C118 75 108 70 92 50 Z",
              "M92 50 C105 35 115 30 120 38 L112 42 C108 38 102 45 92 50 C102 55 108 62 112 58 L120 62 C115 70 105 65 92 50 Z"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          fill="#020617"
          opacity="0.9"
        />
        <g stroke="#854D0E" strokeWidth="0.3" opacity="0.2" fill="none">
          <path d="M96 50 L115 42" /><path d="M96 50 L118 50" /><path d="M96 50 L115 58" />
        </g>
      </motion.g>

      {/*        Dorsal Fin (Cinematic Masterpiece Crest)        */}
      <motion.g
        animate={{
          scaleY: [1, 1.04, 1],
          rotate: [-0.5, 0.5, -0.5]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "60px", originY: "35px" }}
      >
        {/* Sub-fin shadow for 3D depth against body */}
        <path
          d="M30 28 C45 12 75 10 102 30 L96 36 C75 22 45 22 30 36 Z"
          fill="black"
          opacity="0.12"
          transform="translate(1, 2)"
        />

        {/* Deep Black Base */}
        <path
          d="M30 28 C45 12 75 10 102 30 L96 36 C75 22 45 22 30 36 Z"
          fill="#020617"
        />

        {/* High-End Iridescent Ray Texture */}
        <g stroke="#60A5FA" strokeWidth="0.25" opacity="0.2">
          <path d="M40 30 L42 21" /><path d="M50 28 L52 17" /><path d="M60 27 L62 15" />
          <path d="M70 27 L72 15" /><path d="M80 28 L82 17" /><path d="M90 30 L92 21" />
        </g>

        {/* Micro-shimmer dots for organic texture */}
        <g fill="white" opacity="0.08">
          <circle cx="45" cy="25" r="0.3" /><circle cx="65" cy="22" r="0.2" /><circle cx="85" cy="25" r="0.3" />
        </g>

        {/* Dynamic Spiky Silhouette with Organic Path Morphing */}
        <motion.path
          animate={{
            d: [
              "M34 23 Q35 16 38 21 Q40 12 45 19 Q48 10 53 17 Q58 10 64 16 Q70 10 76 15 Q82 12 88 19 Q94 17 101 29",
              "M34 23 Q36 14 39 21 Q42 10 47 19 Q50 8 55 17 Q60 8 66 16 Q72 8 78 15 Q84 10 90 19 Q96 15 101 29",
              "M34 23 Q35 16 38 21 Q40 12 45 19 Q48 10 53 17 Q58 10 64 16 Q70 10 76 15 Q82 12 88 19 Q94 17 101 29"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          fill="none"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Cinematic Pulsing Highlight */}
        <motion.path
          animate={{
            d: [
              "M34 23 Q35 16 38 21 Q40 12 45 19 Q48 10 53 17 Q58 10 64 16 Q70 10 76 15 Q82 12 88 19 Q94 17 101 29",
              "M34 23 Q36 14 39 21 Q42 10 47 19 Q50 8 55 17 Q60 8 66 16 Q72 8 78 15 Q84 10 90 19 Q96 15 101 29",
              "M34 23 Q35 16 38 21 Q40 12 45 19 Q48 10 53 17 Q58 10 64 16 Q70 10 76 15 Q82 12 88 19 Q94 17 101 29"
            ],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          fill="none"
          stroke="#60A5FA"
          strokeWidth="0.7"
          strokeLinecap="round"
        />
      </motion.g>

      {/*        Anal Fin (Sleek & Fluid)        */}
      <motion.g
        animate={{ scaleY: [1, 1.05, 1] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "70px", originY: "75px" }}
      >
        <path d="M45 75 C60 92 85 92 98 72 L90 70 C80 82 55 82 45 72 Z" fill="url(#doryPatternG)" />
        <path d="M45 75 C60 92 85 92 98 72" stroke="#020617" strokeWidth="1.5" fill="none" opacity="0.8" />
        <g stroke="#60A5FA" strokeWidth="0.4" opacity="0.4">
          <path d="M58 82 L60 88" /><path d="M68 84 L70 90" /><path d="M78 84 L80 90" />
        </g>
      </motion.g>

      {/*        Body (Premium Disc with Cinematic Lighting)        */}
      <g>
        <path
          d="M12 50 C12 22 42 15 68 15 C95 15 102 35 102 50 C102 65 95 85 68 85 C42 85 12 78 12 50 Z"
          fill="url(#doryBodyG)"
        />
        {/* Ambient Occlusion / Soft Shadow near tail */}
        <path d="M85 30 Q98 50 85 70" fill="none" stroke="#172554" strokeWidth="8" opacity="0.15" />
        {/* Soft Volumetric Belly Light */}
        <path
          d="M25 65 C35 78 60 82 80 75 C95 68 98 58 95 48 C80 52 50 55 25 65 Z"
          fill="#BFDBFE"
          opacity="0.2"
        />
        {/* High-Gloss Rim Reflection */}
        <path
          d="M18 40 C18 28 45 18 65 18 C85 18 95 28 95 40"
          fill="none"
          stroke="white"
          strokeWidth="0.8"
          opacity="0.12"
          strokeLinecap="round"
        />
      </g>

      {/*        Iconic Pattern (Enhanced Depth)        */}
      <g>
        {/* Pattern Drop Shadow */}
        <path
          d="M32 28 C50 16 85 16 95 35 C98 55 88 78 65 74 C45 70 38 55 38 55 C38 55 28 50 32 28"
          fill="black"
          opacity="0.15"
          transform="translate(1, 1)"
        />
        <path
          d="M32 28 C50 16 85 16 95 35 C98 55 88 78 65 74 C45 70 38 55 38 55 C38 55 28 50 32 28"
          fill="url(#doryPatternG)"
        />
        {/* Inner Blue Patch */}
        <path
          d="M48 35 C65 28 85 30 88 45 C85 60 65 65 52 60 C42 55 45 40 48 35"
          fill="url(#doryBodyG)"
        />
        {/* Pattern Highlight Edge */}
        <path
          d="M32 28 C50 16 85 16 95 35"
          fill="none"
          stroke="#60A5FA"
          strokeWidth="0.4"
          opacity="0.3"
        />
      </g>

      {/*        Final Touches & Snout        */}
      <g fill="#1E3A8A" opacity="0.4">
        <circle cx="85" cy="42" r="0.6" /><circle cx="88" cy="45" r="0.5" />
        <circle cx="91" cy="41" r="0.6" /><circle cx="94" cy="47" r="0.4" />
      </g>

      {/*        Eye (Cinematic Quality Detail)        */}
      <g>
        {/* Socket depth */}
        <circle cx="28" cy="42" r="9" fill="#0F172A" opacity="0.3" />
        <circle cx="28" cy="42" r="8.5" fill="white" />

        {/* Iris with Texture */}
        <mask id="irisMask"><circle cx="28" cy="42" r="6.5" fill="white" /></mask>
        <g mask="url(#irisMask)">
          <circle cx="28" cy="42" r="6.5" fill="url(#doryIrisG)" />
          {/* Iris "Rays" for texture */}
          <g stroke="white" strokeWidth="0.2" opacity="0.15">
            {[...Array(12)].map((_, i) => (
              <line key={i} x1="28" y1="42" x2={28 + 6 * Math.cos(i * 30 * Math.PI / 180)} y2={42 + 6 * Math.sin(i * 30 * Math.PI / 180)} />
            ))}
          </g>
          {/* Iris shadow/ring */}
          <circle cx="28" cy="42" r="6.5" fill="none" stroke="#451A03" strokeWidth="0.8" opacity="0.4" />
        </g>

        {/* Pupil */}
        <circle cx="28.5" cy="42.5" r="4" fill="#020617" />

        {/* Highlights (Cinematic Speculars) */}
        <circle cx="30.2" cy="40.2" r="1.8" fill="white" opacity="0.95" /> {/* Primary */}
        <circle cx="27" cy="44" r="1" fill="white" opacity="0.4" /> {/* Secondary reflection */}
        <ellipse cx="32" cy="42" rx="1" ry="2" fill="white" opacity="0.15" transform="rotate(-15 32 42)" /> {/* Rim shine */}

        {/* Eyelid / Socket definition */}
        <path d="M19 38 C22 32 34 32 37 40" stroke="#1E3A8A" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />
        <path d="M18 42 Q20 35 30 35 Q38 35 40 42" stroke="black" strokeWidth="3" fill="none" opacity="0.05" />
      </g>

      {/*        Pectoral Fin (Ultra-Smooth & Clean)        */}
      <g>
        {/* Minimal connection hint */}
        <path
          d="M48 52 Q47 58 48 64"
          stroke="#1E3A8A"
          strokeWidth="0.8"
          fill="none"
          opacity="0.15"
          strokeLinecap="round"
        />
        <motion.path
          d="M48 52 C47 58 49 70 52 74 C54 68 54 58 52 52 Z"
          fill="url(#doryFinG)"
          stroke="#854D0E"
          strokeWidth="0.3"
          strokeOpacity="0.6"
          style={{ originX: "48px", originY: "52px" }}
          animate={{
            d: [
              "M48 52 C47 58 49 70 52 74 C54 68 54 58 52 52 Z",
              "M48 52 C44 64 46 80 55 83 C59 75 59 62 52 52 Z",
              "M48 52 C47 58 49 70 52 74 C54 68 54 58 52 52 Z"
            ],
            rotate: [0, 15, 0]
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1]
          }}
        />
        {/* Subtle, clean ray details */}
        <motion.g
          opacity="0.12"
          style={{ originX: "48px", originY: "52px" }}
          animate={{ rotate: [0, 15, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
        >
          <path d="M49 55 L47 68" stroke="#854D0E" strokeWidth="0.25" fill="none" />
          <path d="M51 58 L49 72" stroke="#854D0E" strokeWidth="0.25" fill="none" />
        </motion.g>
      </g>

      {/*        Final Polishing & Bubbles        */}
      <path d="M12 50 Q10 50 11 53" stroke="#020617" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M38 48 Q60 46 95 48" stroke="white" strokeWidth="0.6" fill="none" opacity="0.08" />
    </motion.g>

    {/* Premium Bubbles */}
    {[0, 1.2, 2.4].map((d, i) => (
      <motion.g key={i}>
        <motion.circle
          cx={12 + i * 12} cy="55" r={1.2 + i * 0.4}
          fill="white" opacity="0.25"
          animate={{ y: [0, -50], opacity: [0, 0.4, 0], scale: [0.8, 1.1, 0.9] }}
          transition={{ duration: 4, repeat: Infinity, delay: d }}
        />
        <motion.circle
          cx={13 + i * 12} cy="54" r={0.3} fill="white" opacity="0.6"
          animate={{ y: [0, -50], opacity: [0, 0.6, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: d }}
        />
      </motion.g>
    ))}
  </motion.svg>
);


const Toucan = () => (
  <motion.svg viewBox="0 0 115 110" className="h-12 w-12 overflow-visible scale-[1.15]">
    <defs>
      <radialGradient id="tcBodyG" cx="45%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="60%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </radialGradient>
      <radialGradient id="tcChestG" cx="50%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </radialGradient>
      <radialGradient id="tcFaceG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="70%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#C2410C" />
      </radialGradient>
      <linearGradient id="tcBeakG" x1="0%" y1="0%" x2="100%" y2="30%">
        <stop offset="0%" stopColor="#FACC15" />
        <stop offset="40%" stopColor="#F97316" />
        <stop offset="90%" stopColor="#EA580C" />
      </linearGradient>
      <filter id="tcShadow">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.4" />
      </filter>
    </defs>
    <motion.g
      filter="url(#tcShadow)"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <path d="M5 92 C30 88 70 94 100 90" stroke="#713F12" strokeWidth="6" strokeLinecap="round" fill="none" />
      <motion.g
        animate={{ rotate: [0, -3, 0] }}
        style={{ originX: "30px", originY: "82px" }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M25 82 L15 105 L22 105 L30 82 Z" fill="#0F172A" />
        <path d="M30 82 L22 108 L28 108 L35 82 Z" fill="#1E293B" opacity="0.8" />
        <path d="M32 82 L28 95 L36 95 L40 82 Z" fill="#DC2626" opacity="0.9" />
      </motion.g>
      <ellipse cx="40" cy="72" rx="22" ry="18" fill="url(#tcBodyG)" />
      <motion.path
        d="M25 65 C20 75 22 90 35 95 C28 85 25 75 25 65"
        fill="#1E293B"
        animate={{ rotate: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "25px", originY: "65px" }}
      />
      <path d="M28 72 C26 78 28 84 32 88" stroke="#334155" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M32 48 C32 38 42 35 50 38 C60 42 66 58 58 72 C54 85 45 88 38 82 C32 75 28 60 32 48 Z" fill="url(#tcChestG)" />
      <motion.g
        animate={{ rotate: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "50px", originY: "60px" }}
      >
        <circle cx="54" cy="42" r="16" fill="url(#tcBodyG)" />
        <path d="M48 32 C48 22 62 25 68 35 C70 45 60 52 52 50 C46 48 45 40 48 32 Z" fill="url(#tcFaceG)" />
        <circle cx="58" cy="38" r="4.5" fill="#0EA5E9" />
        <circle cx="58" cy="38" r="2.5" fill="#020617" />
        <motion.circle cx="58" cy="38" r="1.5" fill="#000"
          animate={{ r: [1.5, 0.5, 1.5] }}
          transition={{ duration: 6, repeat: Infinity, times: [0, 0.05, 0.15] }}
        />
        <circle cx="58.5" cy="37.5" r="0.6" fill="white" opacity="0.9" />
        <g transform="translate(6, -2)">
          <path d="M60 35 C78 24 106 27 116 45 C118 55 112 62 104 62 C86 62 70 60 60 52 Z" fill="url(#tcBeakG)" />
          <path d="M62 35 C84 27 102 34 110 45" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M60 52 C72 60 96 63 104 62 C106 65 102 70 92 72 C78 74 68 66 60 60 Z" fill="url(#tcBeakG)" />
          <path d="M100 40 C110 40 118 45 118 53 C116 60 108 62 104 62 C100 62 100 46 100 40 Z" fill="#0F172A" />
          <path d="M60 52 C78 59 96 62 106 62" stroke="#020617" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M60 35 C62 42 62 48 60 60" stroke="#020617" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </g>
      </motion.g>
      <g stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M36 88 L32 94" /><path d="M38 88 L38 96" /><path d="M40 88 L44 94" />
        <path d="M50 88 L46 94" /><path d="M52 88 L52 96" /><path d="M54 88 L58 94" />
      </g>
    </motion.g>
  </motion.svg>
);

const Butterfly = () => (
  <motion.svg viewBox="0 0 100 100" className="h-12 w-12 overflow-visible scale-[1.05]">
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
      initial={{ y: 5 }}
      animate={{ y: [5, 2, 5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.path
        d="M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55 Z"
        fill="url(#wTLG)"
        stroke="#431407"
        strokeWidth="1"
        animate={{
          d: [
            "M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55 Z",
            "M49 46 C46 36 30 24 20 30 C14 38 26 56 49 55 Z",
            "M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55 Z",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55"
        fill="none" stroke="#1C0500" strokeWidth="3" opacity="0.65"
        animate={{
          d: [
            "M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55",
            "M49 46 C46 36 30 24 20 30 C14 38 26 56 49 55",
            "M49 46 C42 32 18 16 7 28 C0 38 14 60 49 55",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g animate={{ x: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="12" cy="26" r="2.2" fill="white" opacity="0.9" />
        <circle cx="20" cy="20" r="1.6" fill="white" opacity="0.9" />
        <circle cx="7" cy="36" r="1.6" fill="white" opacity="0.9" />
        <circle cx="8" cy="46" r="1.4" fill="white" opacity="0.8" />
      </motion.g>
      <motion.path
        d="M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70 Z"
        fill="url(#wBLG)" stroke="#431407" strokeWidth="1"
        animate={{
          d: [
            "M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70 Z",
            "M49 56 C38 60 20 70 22 82 C26 92 42 92 49 70 Z",
            "M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70 Z",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70"
        fill="none" stroke="#1C0500" strokeWidth="3" opacity="0.65"
        animate={{
          d: [
            "M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70",
            "M49 56 C38 60 20 70 22 82 C26 92 42 92 49 70",
            "M49 56 C32 60 8 72 12 86 C16 96 40 94 49 70",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g animate={{ x: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="16" cy="84" r="2" fill="white" opacity="0.9" />
        <circle cx="26" cy="90" r="1.6" fill="white" opacity="0.9" />
        <circle cx="10" cy="74" r="1.4" fill="white" opacity="0.8" />
      </motion.g>
      <motion.path
        d="M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55 Z"
        fill="url(#wTRG)" stroke="#431407" strokeWidth="1"
        animate={{
          d: [
            "M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55 Z",
            "M51 46 C54 36 70 24 80 30 C86 38 74 56 51 55 Z",
            "M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55 Z",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55"
        fill="none" stroke="#1C0500" strokeWidth="3" opacity="0.65"
        animate={{
          d: [
            "M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55",
            "M51 46 C54 36 70 24 80 30 C86 38 74 56 51 55",
            "M51 46 C58 32 82 16 93 28 C100 38 86 60 51 55",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g animate={{ x: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="88" cy="26" r="2.2" fill="white" opacity="0.9" />
        <circle cx="80" cy="20" r="1.6" fill="white" opacity="0.9" />
        <circle cx="93" cy="36" r="1.6" fill="white" opacity="0.9" />
        <circle cx="92" cy="46" r="1.4" fill="white" opacity="0.8" />
      </motion.g>
      <motion.path
        d="M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70 Z"
        fill="url(#wBRG)" stroke="#431407" strokeWidth="1"
        animate={{
          d: [
            "M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70 Z",
            "M51 56 C62 60 80 70 78 82 C74 92 58 92 51 70 Z",
            "M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70 Z",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70"
        fill="none" stroke="#1C0500" strokeWidth="3" opacity="0.65"
        animate={{
          d: [
            "M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70",
            "M51 56 C62 60 80 70 78 82 C74 92 58 92 51 70",
            "M51 56 C68 60 92 72 88 86 C84 96 60 94 51 70",
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.g animate={{ x: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
        <circle cx="84" cy="84" r="2" fill="white" opacity="0.9" />
        <circle cx="74" cy="90" r="1.6" fill="white" opacity="0.9" />
        <circle cx="90" cy="74" r="1.4" fill="white" opacity="0.8" />
      </motion.g>
      <ellipse cx="50" cy="62" rx="3" ry="16" fill="#1C0500" />
      <circle cx="50" cy="43" r="4" fill="#1C0500" />
    </motion.g>
  </motion.svg>
);

const Hummingbird = () => (
  <motion.svg viewBox="0 0 120 115" className="h-12 w-12 overflow-visible scale-[1.05]">
    <defs>
      <radialGradient id="hbBodyG" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="35%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#064E3B" />
      </radialGradient>
      <radialGradient id="hbThroatG" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="40%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </radialGradient>
      <radialGradient id="hbBellyG" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="60%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#64748B" />
      </radialGradient>
      <linearGradient id="hbTailG" x1="0%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#065F46" />
        <stop offset="50%" stopColor="#022C22" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="hbWingG" x1="0%" y1="0%" x2="20%" y2="100%">
        <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.85" />
        <stop offset="60%" stopColor="#94A3B8" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#1E293B" stopOpacity="0.05" />
      </linearGradient>
      <filter id="hbGlow">
        <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#10B981" floodOpacity="0.25" />
      </filter>
    </defs>
    <motion.g
      filter="url(#hbGlow)"
      animate={{ y: [-2, 2, -2] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.path
        d="M62 48 C52 22 36 8 26 12 C32 26 44 40 58 52 Z"
        fill="url(#hbWingG)" stroke="#475569" strokeWidth="0.6" opacity="0.9"
        animate={{
          d: [
            "M62 48 C52 22 36 8 26 12 C32 26 44 40 58 52 Z",
            "M62 48 C56 30 46 20 38 22 C42 32 50 42 58 52 Z",
            "M62 48 C52 22 36 8 26 12 C32 26 44 40 58 52 Z",
          ],
        }}
        transition={{ duration: 0.08, repeat: Infinity, ease: "linear" }}
      />
      <motion.path
        d="M43 66 C32 76 18 90 14 96 C20 98 28 95 36 86 C42 78 46 70 48 66 Z"
        fill="url(#hbTailG)"
        animate={{
          d: [
            "M43 66 C32 76 18 90 14 96 C20 98 28 95 36 86 C42 78 46 70 48 66 Z",
            "M43 66 C33 77 20 92 17 98 C22 100 30 96 37 87 C43 79 46 71 48 66 Z",
            "M43 66 C32 76 18 90 14 96 C20 98 28 95 36 86 C42 78 46 70 48 66 Z",
          ],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <path d="M43 66 C46 76 60 72 68 58 C74 46 70 38 63 40 C56 42 40 58 43 66 Z" fill="url(#hbBodyG)" />
      <path d="M44 65 C47 76 60 70 67 58 C63 60 52 64 44 65 Z" fill="url(#hbBellyG)" opacity="0.8" />
      <path d="M63 40 C55 42 46 54 48 63" stroke="#6EE7B7" strokeWidth="1.6" fill="none" opacity="0.35" strokeLinecap="round" />
      <ellipse cx="68" cy="40" rx="9" ry="7.5" fill="url(#hbBodyG)" transform="rotate(-15 68 40)" />
      <circle cx="70" cy="37" r="2" fill="#020617" />
      <circle cx="70.6" cy="36.4" r="0.6" fill="white" opacity="0.9" />
      <line x1="76" y1="38.5" x2="116" y2="43.5" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="76" y1="39.8" x2="113" y2="44.5" stroke="#334155" strokeWidth="0.8" strokeLinecap="round" />
      <motion.path
        d="M60 50 C50 24 34 10 24 14 C30 28 42 42 56 54 Z"
        fill="url(#hbWingG)" stroke="#475569" strokeWidth="0.6" opacity="0.9"
        animate={{
          d: [
            "M60 50 C50 24 34 10 24 14 C30 28 42 42 56 54 Z",
            "M60 50 C54 32 44 22 36 24 C40 34 48 44 56 54 Z",
            "M60 50 C50 24 34 10 24 14 C30 28 42 42 56 54 Z",
          ],
        }}
        transition={{ duration: 0.08, repeat: Infinity, ease: "linear" }}
      />
    </motion.g>
  </motion.svg>
);

const Cactus = () => (
  <motion.svg viewBox="0 0 100 125" className="h-12 w-12 overflow-visible scale-[1.3]">
    <defs>
      <linearGradient id="cacBodyG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#166534" />
        <stop offset="50%" stopColor="#15803D" />
        <stop offset="100%" stopColor="#166534" />
      </linearGradient>
      <linearGradient id="sandG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#D2B48C" />
        <stop offset="45%" stopColor="#A68A64" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <radialGradient id="sandGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="mesaG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </linearGradient>
      <linearGradient id="shrubG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>
      <filter id="cacShadow">
        <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#064E3B" floodOpacity="0.3" />
      </filter>
      <clipPath id="cactusClip">
        <rect x="-100" y="-80" width="300" height="250" />
      </clipPath>
    </defs>

    <motion.g
      filter="url(#cacShadow)"
      animate={{
        rotate: [-1.5, 1.5, -1.5],
      }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{ originX: "50px", originY: "115px" }}
    >

      {/* Main Body - Robust Trunk */}
      <rect x="38" y="15" width="24" height="85" rx="12" fill="url(#cacBodyG)" />

      {/* Ribs and Highlights on Main Body */}
      <g stroke="#064E3B" strokeWidth="0.8" opacity="0.4" fill="none">
        <path d="M44 22 V95" />
        <path d="M50 18 V98" />
        <path d="M56 22 V95" />
      </g>
      <g stroke="white" strokeWidth="0.4" opacity="0.1" fill="none">
        <path d="M43 25 V90" />
        <path d="M51 20 V95" />
        <path d="M57 25 V90" />
      </g>

      {/* Surface Details (Pores/Texture) */}
      <g fill="#064E3B" opacity="0.2">
        <circle cx="47" cy="40" r="0.4" /><circle cx="53" cy="55" r="0.3" />
        <circle cx="45" cy="70" r="0.4" /><circle cx="55" cy="85" r="0.3" />
        <circle cx="50" cy="30" r="0.4" />
      </g>

      {/* Left Arm - Soft Sway */}
      <motion.g
        animate={{ rotate: [-2.5, 2.5, -2.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ originX: "38px", originY: "80px" }}
      >
        <path
          d="M38 80 Q22 80 22 62 V45"
          fill="none"
          stroke="url(#cacBodyG)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Detail on Left Arm */}
        <g stroke="#064E3B" strokeWidth="0.6" opacity="0.3" fill="none">
          <path d="M22 50 V65" />
          <path d="M28 52 V68" />
        </g>
        {/* Thorns on Left Arm */}
        <g fill="#064E3B" opacity="0.8">
          {[48, 55, 62, 69, 76].map(y => (
            <g key={y}>
              <path d={`M15.5 ${y} L12 ${y - 1} L15.5 ${y - 2} Z`} />
              <path d={`M28.5 ${y - 3} L31 ${y - 4} L28.5 ${y - 5} Z`} opacity="0.4" />
            </g>
          ))}
          <path d="M22 45 L22 40 L25 42 Z" />
        </g>
      </motion.g>

      {/* Right Arm - Soft Sway */}
      <motion.g
        animate={{ rotate: [2.5, -2.5, 2.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{ originX: "62px", originY: "70px" }}
      >
        <path
          d="M62 70 Q78 70 78 52 V35"
          fill="none"
          stroke="url(#cacBodyG)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Detail on Right Arm */}
        <g stroke="#064E3B" strokeWidth="0.6" opacity="0.3" fill="none">
          <path d="M78 40 V55" />
          <path d="M72 42 V58" />
        </g>
        {/* Thorns on Right Arm */}
        <g fill="#064E3B" opacity="0.8">
          {[36, 43, 50, 57, 64].map(y => (
            <path key={y} d={`M84.5 ${y} L88 ${y - 1} L84.5 ${y - 2} Z`} />
          ))}
          <path d="M78 35 L78 30 L75 32 Z" />
        </g>
      </motion.g>

      {/* Dynamic Sand Base - Minimalist Professional Design */}
      <motion.g transform="translate(50, 94)">
        <g>
          {/* Soft lateral drifts for a better finish on the sides */}
          <path d="M-52 18 Q-42 14 -32 16" fill="none" stroke="#8B7355" strokeWidth="2.5" opacity="0.1" strokeLinecap="round" />
          <path d="M32 16 Q42 14 52 18" fill="none" stroke="#8B7355" strokeWidth="2.5" opacity="0.1" strokeLinecap="round" />

          {/* Deeper base layer for volume */}
          <path 
            d="M-42 18 Q-12 2 12 6 T42 18 C45 28 -45 28 -42 18 Z" 
            fill="#8B7355" 
            opacity="0.25" 
          />
          
          {/* Main Sand Hill - More compact & professional */}
          <path 
            d="M-40 18 Q-18 4 5 6 T38 15 C40 25 -42 25 -40 18 Z" 
            fill="url(#sandG)" 
          />
          
          {/* Subtle light detail on the crest */}
          <path 
            d="M-35 18 Q-18 5 5 7 T32 15" 
            fill="none" 
            stroke="white" 
            strokeWidth="0.6" 
            opacity="0.08" 
            strokeLinecap="round" 
          />
        </g>
        
        {/* Realistic Sand Ripples - Depth-aware & Layered */}
        {Array.from({ length: 8 }).map((_, i) => {
          const x = -32 + i * 9;
          // Calculate y based on hill curvature to make ripples follow the shape
          const yBase = 12 - (Math.pow(x, 2) / 200); 
          const w = 9 + (i % 3) * 3;
          const sw = 1.6 - (Math.abs(x) / 40); // Perspective: thinner on the sides
          
          return (
            <g key={i}>
              {/* Ripple Shadow */}
              <motion.path
                d={`M${x - w/2} ${yBase} Q${x} ${yBase - 3} ${x + w/2} ${yBase}`}
                fill="none"
                stroke="#451A03"
                strokeWidth={sw}
                strokeLinecap="round"
                opacity="0.3"
                animate={{
                  d: [
                    `M${x - w/2} ${yBase} Q${x} ${yBase - 3} ${x + w/2} ${yBase}`,
                    `M${x - w/2} ${yBase - 0.5} Q${x} ${yBase - 3.5} ${x + w/2} ${yBase - 0.5}`,
                    `M${x - w/2} ${yBase} Q${x} ${yBase - 3} ${x + w/2} ${yBase}`
                  ]
                }}
                transition={{
                  duration: 6 + (i % 4),
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {/* Subtle Highlight on the ridge */}
              <motion.path
                d={`M${x - w/2} ${yBase - 0.4} Q${x} ${yBase - 3.4} ${x + w/2} ${yBase - 0.4}`}
                fill="none"
                stroke="white"
                strokeWidth={sw * 0.5}
                strokeLinecap="round"
                opacity="0.12"
              />
            </g>
          );
        })}
      </motion.g>

      {/* Realistic Dust Devil / Tornado Animation - Full Shape Visibility */}
      <motion.g
        clipPath="url(#cactusClip)"
        initial={{ x: -80, opacity: 0 }}
        animate={{ 
          x: [-80, 150],
          opacity: [0, 0.8, 0.8, 0] 
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          repeatDelay: 1,
          ease: "linear",
          times: [0, 0.1, 0.9, 1]
        }}
      >
        <g transform="translate(0, 105)">
          {/* Realistic Funnel Structure - Stacked & Tapered Spirals */}
          {Array.from({ length: 15 }).map((_, i) => {
            const y = -i * 8;
            const radiusX = 4 + i * 3.5;
            const radiusY = 1.5 + i * 1;
            const offset = Math.sin(i * 0.8) * 4;
            return (
              <motion.ellipse
                key={i}
                cx={offset} cy={y} rx={radiusX} ry={radiusY}
                fill="none"
                stroke="#451A03"
                strokeWidth={2.5 - i * 0.12}
                opacity={0.8 - i * 0.04}
                animate={{ 
                  x: [offset - 4, offset + 4, offset - 4],
                  scaleX: [0.85, 1.15, 0.85],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{ 
                  duration: 0.4 + (i % 3) * 0.1, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            );
          })}
          
          {/* Swirling Core Debris */}
          {[...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              r="1.2"
              fill="#78350F"
              animate={{
                x: [-20, 20, -20],
                y: [-120, 0, -120],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 1 + i * 0.2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </g>
      </motion.g>

      {/* Thorns on Main Body edges - Enhanced density and variation */}
      <g fill="#064E3B" opacity="0.8">
        {[25, 33, 41, 49, 57, 65, 73, 81, 89].map(y => (
          <g key={y}>
            <path d={`M38 ${y} L32 ${y - 1.5} L38 ${y - 3} Z`} />
            <path d={`M62 ${y} L68 ${y - 1.5} L62 ${y - 3} Z`} />
          </g>
        ))}
      </g>
    </motion.g>
  </motion.svg>
);


const Sunflower = () => (
  <motion.svg viewBox="0 0 100 115" className="h-14 w-14 overflow-visible scale-[1.3]">
    <defs>
      <radialGradient id="sunCenterG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#713F12" />
        <stop offset="60%" stopColor="#451A03" />
        <stop offset="100%" stopColor="#1C1917" />
      </radialGradient>
      <linearGradient id="sunPetalG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="sunPotG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#C2410C" />
        <stop offset="50%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
      <filter id="sunShadow">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#451A03" floodOpacity="0.2" />
      </filter>
    </defs>

    <motion.g
      filter="url(#sunShadow)"
      animate={{ rotate: [-1.5, 1.5, -1.5] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ originX: "50px", originY: "110px" }}
    >
      {/* Terracotta Pot */}
      <motion.g
        transform="translate(0, 10)"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <path d="M34 90 L38 108 C38 111 62 111 62 108 L66 90 Z" fill="url(#sunPotG)" />
        <rect x="30" y="83" width="40" height="10" rx="2" fill="#F97316" stroke="#C2410C" strokeWidth="0.5" />
      </motion.g>

      {/* Stem and Leaves - Appear First */}
      <motion.g
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ originX: "50px", originY: "93px" }}
      >
        <path d="M50 93 Q50 65 50 35" fill="none" stroke="#14532D" strokeWidth="3" strokeLinecap="round" />

        {/* Leaf 1 (Left) */}
        <motion.path
          d="M50 80 Q30 75 25 65 Q35 60 50 80 Z"
          fill="#15803D"
          animate={{ rotate: [-3, 3, -3] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1 // Wait for stem to grow
          }}
          style={{ originX: "50px", originY: "80px" }}
        />

        {/* Leaf 2 (Right) */}
        <motion.path
          d="M50 72 Q70 67 75 57 Q65 52 50 72 Z"
          fill="#15803D"
          animate={{ rotate: [3, -3, 3] }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2 // Wait for stem to grow
          }}
          style={{ originX: "50px", originY: "72px" }}
        />
      </motion.g>

      {/* Flower Head Group */}
      <motion.g
        animate={{
          rotateX: [15, -15, 15],
          rotateY: [-10, 10, -10]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "50px", originY: "35px" }}
      >
        {/* Yellow Petals - Appear 2s Later */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2, duration: 0.8, ease: "backOut" }}
          style={{ originX: "50px", originY: "35px" }}
        >
          {/* Petals Layer 2 (Back) */}
          {[...Array(12)].map((_, i) => (
            <motion.path
              key={`p2-${i}`}
              d="M50 35 L44 10 Q50 0 56 10 Z"
              fill="url(#sunPetalG)"
              transform={`rotate(${i * 30 + 15} 50 35)`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 2 + i * 0.1 }}
            />
          ))}
          {/* Petals Layer 1 (Front) */}
          {[...Array(12)].map((_, i) => (
            <path
              key={`p1-${i}`}
              d="M50 35 L44 12 Q50 2 56 12 Z"
              fill="url(#sunPetalG)"
              transform={`rotate(${i * 30} 50 35)`}
              stroke="#EAB308"
              strokeWidth="0.2"
            />
          ))}
        </motion.g>

        {/* Central Disk (Seed) - Appears with Stem */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          style={{ originX: "50px", originY: "35px" }}
        >
          <circle cx="50" cy="35" r="14" fill="url(#sunCenterG)" stroke="#451A03" strokeWidth="0.5" />
          {/* Seed Texture Pattern */}
          <g opacity="0.3" fill="none" stroke="white" strokeWidth="0.2">
            {[8, 5, 2].map((radius, i) => (
              <circle key={i} cx="50" cy="35" r={radius} strokeDasharray={`${radius * 0.5} ${radius * 0.5}`} />
            ))}
          </g>
          <g opacity="0.4" fill="#1C1917">
            {[...Array(20)].map((_, i) => (
              <circle
                key={i}
                cx={50 + Math.cos(i * 1.5) * (4 + i * 0.4)}
                cy={35 + Math.sin(i * 1.5) * (4 + i * 0.4)}
                r="0.4"
              />
            ))}
          </g>
          <ellipse cx="46" cy="31" rx="3" ry="1.5" fill="white" opacity="0.08" transform="rotate(-30 46 31)" />
        </motion.g>
      </motion.g>
    </motion.g>
  </motion.svg>
);

const Clover = () => (
  <motion.svg viewBox="0 0 100 125" className="h-12 w-12 overflow-visible scale-[1.3]">
    <defs>
      <linearGradient id="cloverLeafG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#16A34A" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
      <radialGradient id="cloverGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="cloverStemG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#115E59" />
        <stop offset="100%" stopColor="#064E3B" />
      </linearGradient>
      <linearGradient id="cloverCreaseG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="black" stopOpacity="0.1" />
        <stop offset="100%" stopColor="black" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="cloverPotG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="45%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <filter id="cloverShadow">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#064E3B" floodOpacity="0.2" />
      </filter>
    </defs>

    <motion.g
      filter="url(#cloverShadow)"
      initial={{ y: 12, x: 15 }}
      animate={{
        rotate: [-2.5, 2.5, -2.5],
        y: [12, 10, 12],
        x: [15, 15, 15]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{ originX: "50px", originY: "120px" }}
    >

      {/* Deep Charcoal Ceramic Pot - Improved design */}
      <motion.g
        transform="translate(0, 32)"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Stem - Now inside the group for perfect layering */}
        <motion.path
          d="M50 40 Q51 65 52 95"
          fill="none"
          stroke="url(#cloverStemG)"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8 }}
        />
        <path d="M37 90 L41 106 C41 110 59 110 59 106 L63 90 Z" fill="url(#cloverPotG)" />
        {/* Soil Layer */}
        <ellipse cx="50" cy="90" rx="13" ry="2.5" fill="#2D1A0A" />
        <g opacity="0.4">
          <circle cx="45" cy="91" r="0.4" fill="#451A03" />
          <circle cx="55" cy="90" r="0.5" fill="#451A03" />
        </g>
        {/* Premium Pot Rim */}
        <rect x="33" y="83" width="34" height="8" rx="2.5" fill="#1E293B" stroke="#0F172A" strokeWidth="0.8" />
        {/* Rim Shine */}
        <path d="M35 85 H65" stroke="white" strokeWidth="0.6" opacity="0.12" strokeLinecap="round" />
        {/* Pot Body Highlight */}
        <path d="M42 92 Q50 95 58 92" fill="none" stroke="white" opacity="0.06" strokeWidth="1.5" />
      </motion.g>


      {/* Four Leaf Rosette - X Formation (45, 135, 225, 315) - LARGER */}
      <g transform="translate(50, 72) scale(1.15)">
        {[45, 135, 225, 315].map((angle, i) => (
          <motion.g
            key={angle}
            transform={`rotate(${angle})`}
            animate={{
              rotate: [angle, angle - 3, angle],
              scale: [1, 1.02, 1]
            }}
            transition={{
              rotate: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }
            }}
            style={{ originX: "0px", originY: "0px" }}
          >
            {/* Heart Leaf Shape */}
            <path
              d="M0 2 C-18 -15 -18 -32 0 -32 C18 -32 18 -15 0 2 Z"
              fill="url(#cloverLeafG)"
              stroke="#064E3B"
              strokeWidth="0.1"
            />
            {/* Soft Central Glow */}
            <path d="M0 2 C-18 -15 -18 -32 0 -32 C18 -32 18 -15 0 2 Z" fill="url(#cloverGlow)" />

            {/* Premium Sheen/Highlight */}
            <path
              d="M-2 -8 Q-12 -20 -8 -28"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              opacity="0.1"
              strokeLinecap="round"
            />

            {/* Central Crease for 3D effect */}
            <path
              d="M0 2 V-32"
              stroke="url(#cloverCreaseG)"
              strokeWidth="2.5"
              opacity="0.5"
            />
            {/* Fine center line */}
            <path d="M0 2 V-30" stroke="#052E16" strokeWidth="0.2" opacity="0.2" fill="none" />
          </motion.g>
        ))}
        {/* Center intersection */}
        <circle r="0.8" fill="#052E16" opacity="0.3" />
      </g>
    </motion.g>
  </motion.svg>
);

const Mushroom = () => (
  <motion.svg viewBox="0 0 100 125" className="h-12 w-12 overflow-visible scale-[1.6]">
    <defs>
      <radialGradient id="mushroomCapG" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#991B1B" />
      </radialGradient>
      <filter id="mushroomShadow">
        <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#450A0A" floodOpacity="0.2" />
      </filter>
    </defs>

    <motion.g
      filter="url(#mushroomShadow)"
      initial={{ y: -17 }}
      animate={{
        y: [-17, -19, -17],
        rotate: [-1, 1, -1]
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      style={{ originX: "50px", originY: "125px" }}
    >
      {/* Natural Grass/Moss Base */}
      <motion.g transform="translate(50, 112)">
        <ellipse cx="0" cy="5" rx="28" ry="6" fill="#15803D" opacity="0.3" />
        <ellipse cx="0" cy="2" rx="20" ry="4" fill="#166534" />
        {/* Grass Blades */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = -22 + (i * 44) / 13;
          // Use deterministic height based on index to avoid hydration mismatch
          const h = 5 + ((i * 7) % 8);
          return (
            <motion.path
              key={i}
              d={`M${x} 2 Q${x + 1} -${h} ${x + 2} 0`}
              fill="none"
              stroke="#22C55E"
              strokeWidth="1.2"
              strokeLinecap="round"
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 3 + (i % 5) * 0.2, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </motion.g>

      {/* Mushroom Stem (Stipe) - Havana Brown */}
      <path
        d="M46 115 C46 100 44 90 50 80 C56 90 54 100 54 115 Z"
        fill="#D7BEA2"
        stroke="#B5A08D"
        strokeWidth="0.5"
      />

      {/* Stem Ring */}
      <path d="M45 92 Q50 94 55 92 L56 94 Q50 96 44 94 Z" fill="#EADBC8" stroke="#B5A08D" strokeWidth="0.2" />

      {/* Mushroom Cap (Pileus) - Massively Enlarged */}
      <motion.g
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "50px", originY: "80px" }}
      >
        {/* Underside with Gill Texture */}
        <g>
          <ellipse cx="50" cy="82" rx="34" ry="9" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="0.5" />
          {/* Subtle Gills */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i * Math.PI) / 19;
            const x1 = 50 + Math.cos(angle) * 4;
            const y1 = 82 + Math.sin(angle) * 1.5;
            const x2 = 50 + Math.cos(angle) * 32;
            const y2 = 82 + Math.sin(angle) * 8;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E2E8F0" strokeWidth="0.3" opacity="0.6" />
            );
          })}
        </g>

        {/* Main Red Cap - Extra Wide */}
        <path
          d="M16 80 C16 42 84 42 84 80 C84 89 16 89 16 80 Z"
          fill="url(#mushroomCapG)"
          stroke="#7F1D1D"
          strokeWidth="0.4"
        />

        {/* Glossy Top Highlights */}
        <path d="M30 52 Q50 42 70 52" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity="0.1" />
        <path d="M28 58 Q35 48 48 52" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.12" />

        {/* Irregular 'Veil Remnants' (Mushroom Warts) - Realistic & Organic */}
        <g opacity="0.95">
          {/* Top/Center Cluster (More dense) */}
          <path d="M48 55 Q50 53 53 56 Q52 60 49 61 Q46 59 48 55 Z" fill="#FEFCE8" />
          <path d="M42 48 Q44 46 46 49 Q45 51 42 52 Q40 50 42 48 Z" fill="#FFFBEB" opacity="0.8" />
          <path d="M55 45 Q57 44 59 47 Q57 49 54 48 Q53 46 55 45 Z" fill="#FFFBEB" opacity="0.8" />

          {/* Large Primary Warts */}
          <path d="M32 68 Q35 65 38 68 Q37 72 34 73 Q30 71 32 68 Z" fill="#FEFCE8" />
          <path d="M64 65 Q67 63 70 66 Q69 70 65 71 Q62 68 64 65 Z" fill="#FEFCE8" />
          <path d="M50 65 Q53 63 55 66 Q52 69 49 68 Q47 66 50 65 Z" fill="#FEFCE8" />

          {/* Mid-sized Warts */}
          <path d="M58 52 Q60 51 62 53 Q61 56 57 55 Q56 53 58 52 Z" fill="#FFFBEB" />
          <path d="M43 60 Q45 59 47 61 Q45 64 42 63 Q41 61 43 60 Z" fill="#FFFBEB" />
          <path d="M25 74 Q27 73 29 75 Q27 78 24 77 Q23 75 25 74 Z" fill="#FFFBEB" opacity="0.7" />
          <path d="M75 75 Q77 74 79 76 Q77 79 74 78 Q73 76 75 75 Z" fill="#FFFBEB" opacity="0.7" />

          {/* Small details / Speckles */}
          <ellipse cx="50" cy="42" rx="1.2" ry="0.8" fill="#FFFBEB" opacity="0.6" />
          <path d="M18 78 Q19 77 21 79 Q19 81 17 80 Z" fill="#FFFBEB" opacity="0.5" />
          <path d="M82 80 Q83 79 85 81 Q83 83 81 82 Z" fill="#FFFBEB" opacity="0.5" />
        </g>
      </motion.g>
    </motion.g>
  </motion.svg>
);


const PineTree = () => (
  <motion.svg viewBox="0 0 100 145" className="h-11 w-20 overflow-visible scale-[1.3]">
    <defs>
      <linearGradient id="pineTrunkG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#451A03" />
        <stop offset="50%" stopColor="#78350F" />
        <stop offset="100%" stopColor="#451A03" />
      </linearGradient>
      <linearGradient id="pineFoliageG" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4B8F5D" />
        <stop offset="100%" stopColor="#143D21" />
      </linearGradient>
      <filter id="pineShadow">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#143D21" floodOpacity="0.25" />
      </filter>
    </defs>

    <motion.g
      filter="url(#pineShadow)"
      initial={{ y: 10 }}
      animate={{ y: [10, 9.5, 10] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Semi-realistic Ground Base - Static */}
      <g transform="translate(50, 130)">
        <ellipse cx="0" cy="5" rx="32" ry="10" fill="#143D21" opacity="0.15" />
        <ellipse cx="0" cy="2" rx="24" ry="6" fill="#1E4D2B" />
        <path d="M-15 0 Q-10 -2 -5 1 M5 -1 Q10 -3 15 0" fill="none" stroke="#143D21" strokeWidth="0.5" opacity="0.4" />
      </g>

      {/* Textured Trunk - Static */}
      <path
        d="M45 130 L55 130 L53 60 L47 60 Z"
        fill="url(#pineTrunkG)"
        stroke="#270E01"
        strokeWidth="0.5"
      />
      {/* Bark Texture Details - Static */}
      <g stroke="#270E01" strokeWidth="0.3" opacity="0.4">
        <path d="M48 125 L52 115 M47 105 L53 95 M49 85 L51 75" />
        <path d="M52 122 L48 112 M53 102 L47 92" opacity="0.5" />
      </g>

      {/* Swaying Foliage - Horizontal Wind Effect with Increased Width */}
      <motion.g
        animate={{
          rotate: [-0.6, 0.6, -0.6],
          x: [-0.4, 0.4, -0.4]
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "50px", originY: "115px", scaleX: 1.25, scaleY: 1.1 }}
      >
        {/* Jagged Foliage Clusters - Darker Top Palette (Further elevated to show trunk) */}
        {[
          { d: "M50 -20 L65 10 L60 7 L55 10 L50 7 L45 10 L40 7 L35 10 Z", fill: "#14532D" },
          { d: "M50 -5 L72 30 L65 27 L58 30 L50 27 L42 30 L35 27 L28 30 Z", fill: "#166534" },
          { d: "M50 15 L80 55 L72 52 L64 55 L56 52 L50 55 L44 52 L36 55 L28 52 L20 55 Z", fill: "#15803D" },
          { d: "M50 35 L88 80 L78 77 L68 80 L58 77 L50 80 L42 77 L32 80 L22 77 L12 80 Z", fill: "#14532D" },
          { d: "M50 55 L94 100 L82 97 L70 100 L58 97 L50 100 L42 97 L30 100 L18 97 L6 100 Z", fill: "#166534" },
        ].reverse().map((layer, i) => (
          <g key={i}>
            {/* Main Jagged Layer */}
            <path d={layer.d} fill={layer.fill} stroke="#052E16" strokeWidth="0.4" />
            {/* Subtle Gradient Shadow within the layer */}
            <path
              d={layer.d}
              fill="black"
              opacity="0.1"
              clipPath={`inset(50% 0 0 0)`} // Simple way to darken the bottom half
            />
            {/* Inner highlight for 3D effect */}
            <path d={layer.d.replace(/L/g, "l 1 1 l -1 -1")} fill="none" stroke="white" strokeWidth="0.1" opacity="0.15" />
          </g>
        ))}


      </motion.g>
    </motion.g>
  </motion.svg>
);

export function Mascot() {
  const [index, setIndex] = useState(0);
  const mascots = [
    <PineTree key="pine" />,
    <Frog key="frog" />,
    <Mushroom key="mushroom" />,
    <Toucan key="toucan" />,
    <Cactus key="cactus" />,
    <Dory key="dory" />,
    <Sunflower key="sunflower" />,
    <Butterfly key="butterfly" />,
    <Clover key="clover" />,
    <Hummingbird key="bird" />,
  ];

  useEffect(() => {
    const timer = setInterval(() => setIndex((p) => (p + 1) % mascots.length), 6000);
    return () => clearInterval(timer);
  }, [mascots.length]);

  return (
    <div className="flex h-14 w-14 items-center justify-center">
      <div className="relative flex items-end justify-center w-full h-full pb-1">
        <motion.div
          className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/15 to-sky-500/15 rounded-full blur-2xl"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          onClick={() => setIndex((p) => (p + 1) % mascots.length)}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }}
          className="flex items-end justify-center cursor-pointer"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.5 }}
              className="flex items-end justify-center"
            >
              {mascots[index]}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
