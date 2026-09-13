import React from 'react';
import { motion } from 'framer-motion';
import Skeleton from './Skeleton';

export default function SuspenseLoader({ message = 'Cargando herramienta...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        width: '100%',
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '18px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Header skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Skeleton width="220px" height="30px" borderRadius="10px" />
        <Skeleton width="340px" height="16px" borderRadius="8px" />
      </div>

      {/* Tab bar skeleton */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <Skeleton width="110px" height="40px" borderRadius="100px" />
        <Skeleton width="110px" height="40px" borderRadius="100px" />
        <Skeleton width="110px" height="40px" borderRadius="100px" />
      </div>

      {/* Glass card skeleton */}
      <div
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Search row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Skeleton height="42px" borderRadius="12px" style={{ flex: 1 }} />
          <Skeleton width="120px" height="42px" borderRadius="12px" />
        </div>

        {/* Result rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          <Skeleton height="52px" borderRadius="12px" />
          <Skeleton height="52px" borderRadius="12px" />
          <Skeleton height="52px" borderRadius="12px" />
        </div>
      </div>

      {/* Loading label */}
      <motion.p
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, repeatType: 'mirror', duration: 1 }}
        style={{
          color: 'var(--primary)',
          fontSize: 'var(--fs-xs, 12px)',
          fontWeight: 'var(--fw-semibold, 600)',
          fontFamily: 'var(--font-body)',
          textAlign: 'center',
          margin: '4px 0 0',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
