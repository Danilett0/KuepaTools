import React from 'react';
import { motion } from 'framer-motion';
import KuepaAiIcon from './KuepaAiIcon';

export default function AiAssistantHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 24px 28px',
        textAlign: 'center',
        userSelect: 'none',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Icon Emblem */}
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(16, 185, 129, 0.04) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 0 24px rgba(16, 185, 129, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        <KuepaAiIcon size={24} glow />
      </div>

      {/* Heading */}
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: '#ffffff',
          margin: '0 0 6px 0',
          letterSpacing: '-0.02em',
          fontFamily: "'Space Grotesk', sans-serif"
        }}
      >
        ¿En qué puedo ayudarte hoy?
      </h2>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '13.5px',
          color: 'rgba(255, 255, 255, 0.45)',
          margin: 0,
          maxWidth: '460px',
          lineHeight: '1.5',
          fontFamily: "'Space Grotesk', sans-serif"
        }}
      >
        Gestiona inscripciones, retiros de materias o consultas de alumnos en lenguaje natural.
      </p>
    </motion.div>
  );
}
