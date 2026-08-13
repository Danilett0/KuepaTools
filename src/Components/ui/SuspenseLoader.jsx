import React from 'react';
import { motion } from 'framer-motion';
import Skeleton from './Skeleton';

export default function SuspenseLoader({ message = 'Cargando herramienta...' }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        padding: '32px',
        gap: '24px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width="40%" height="28px" borderRadius="12px" />
        <Skeleton width="60%" height="16px" borderRadius="8px" />
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <Skeleton width="100px" height="40px" borderRadius="100px" />
        <Skeleton width="100px" height="40px" borderRadius="100px" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <Skeleton height="60px" borderRadius="16px" />
        <Skeleton height="60px" borderRadius="16px" />
        <Skeleton height="60px" borderRadius="16px" />
        <Skeleton height="60px" borderRadius="16px" />
      </div>

      <motion.p 
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1, direction: 'alternate' }}
        style={{ marginTop: '24px', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
