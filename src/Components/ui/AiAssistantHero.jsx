import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AiAssistantHero() {
  const bars = [14, 26, 40, 22, 36, 46, 30, 20, 38, 24, 16];

  return (
    <div
      style={{
        padding: '36px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(18, 163, 131, 0.22) 0%, rgba(56, 189, 248, 0.12) 40%, rgba(139, 92, 246, 0.06) 70%, transparent 80%)',
          filter: 'blur(32px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main Neural Orb Container */}
      <div
        style={{
          position: 'relative',
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          zIndex: 1
        }}
      >
        {/* Pulsating Outer Halo */}
        <motion.div
          animate={{
            scale: [1, 1.28, 1],
            opacity: [0.35, 0.7, 0.35],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(18, 163, 131, 0.5) 0%, rgba(56, 189, 248, 0.25) 50%, transparent 75%)',
            filter: 'blur(16px)',
          }}
        />

        {/* Outer Gyroscopic Ring (Clockwise) with orbiting satellite */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            border: '1.5px dashed rgba(56, 189, 248, 0.45)',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
          }}
        >
          {/* Satellite Node 1 */}
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#38bdf8',
              boxShadow: '0 0 12px #38bdf8, 0 0 20px #38bdf8',
            }}
          />
        </motion.div>

        {/* Inner Counter-Rotating Ring (Counter-clockwise) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: '118px',
            height: '118px',
            borderRadius: '50%',
            border: '1.5px solid rgba(18, 163, 131, 0.55)',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            boxShadow: '0 0 16px rgba(18, 163, 131, 0.25)',
          }}
        >
          {/* Satellite Node 2 */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 10px #34d399',
            }}
          />
        </motion.div>

        {/* Organic Plasma Core */}
        <motion.div
          animate={{
            scale: [0.94, 1.08, 0.94],
            rotate: [0, 90, 180, 270, 360],
            borderRadius: ['50%', '46% 54% 52% 48% / 54% 48% 52% 46%', '50%'],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            width: '84px',
            height: '84px',
            background: 'conic-gradient(from 180deg at 50% 50%, #12a383 0deg, #38bdf8 120deg, #818cf8 240deg, #12a383 360deg)',
            filter: 'blur(3px)',
            boxShadow: '0 0 35px rgba(18, 163, 131, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />

        {/* Floating Center Icon (Quantum Emblem) */}
        <motion.div
          animate={{
            y: [-2, 3, -2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(7, 10, 15, 0.85)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
            zIndex: 2
          }}
        >
          <Sparkles size={20} color="#38bdf8" />
        </motion.div>
      </div>

      {/* AI Synapse Frequency Waveform */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          height: '24px',
          marginBottom: '16px',
          zIndex: 1
        }}
      >
        {bars.map((maxH, i) => (
          <motion.div
            key={i}
            animate={{
              height: [4, maxH, 6, maxH * 0.6, 4],
              opacity: [0.35, 1, 0.5, 0.9, 0.35]
            }}
            transition={{
              duration: 1.4 + (i % 3) * 0.25,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.1
            }}
            style={{
              width: '3.5px',
              borderRadius: '999px',
              background: i % 2 === 0
                ? 'linear-gradient(180deg, #38bdf8, #12a383)'
                : 'linear-gradient(180deg, #12a383, #818cf8)'
            }}
          />
        ))}
      </div>

      {/* Typography & Status Indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #ffffff 20%, #34d399 60%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 24px rgba(18, 163, 131, 0.35)'
          }}
        >
          Kuepa Neural Assistant
        </h3>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '20px',
            background: 'rgba(18, 163, 131, 0.1)',
            border: '1px solid rgba(18, 163, 131, 0.25)',
          }}
        >
          {/* Radar ping dot */}
          <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
            <motion.span
              animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: '#10b981'
              }}
            />
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                borderRadius: '50%',
                width: '8px',
                height: '8px',
                background: '#10b981'
              }}
            />
          </span>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--on-surface-variant)',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            Núcleo cognitivo activo · Esperando tu orden
          </span>
        </div>

        <p
          style={{
            margin: '4px 0 0',
            fontSize: '12.5px',
            color: 'var(--on-surface-variant)',
            opacity: 0.75,
            maxWidth: '440px',
            lineHeight: '1.45'
          }}
        >
          Escribe en lenguaje natural consultas, inscripciones, auditorías o retiros de estudiantes.
        </p>
      </div>
    </div>
  );
}
