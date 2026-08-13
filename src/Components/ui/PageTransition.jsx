import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PageTransition wrapper
 * Requires a unique key to trigger the animation. We use the activeComponent ID or location key.
 */
export default function PageTransition({ children, transitionKey }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.98 }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.1, 0.25, 1.0] // Smooth custom cubic bezier
        }}
        style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
