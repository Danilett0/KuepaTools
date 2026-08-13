import React from 'react';
import { motion } from 'framer-motion';

export default function Skeleton({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '8px', 
  style = {},
  className = ''
}) {
  return (
    <motion.div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
        backgroundSize: '400% 100%',
        ...style
      }}
      initial={{ backgroundPosition: '200% 0' }}
      animate={{ backgroundPosition: '-200% 0' }}
      transition={{ 
        repeat: Infinity, 
        duration: 2, 
        ease: 'linear' 
      }}
    />
  );
}
