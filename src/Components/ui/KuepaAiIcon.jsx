import React, { useId } from 'react';

/**
 * KuepaAiIcon
 * Custom futuristic brand icon for Kuepa AI.
 * Combines a geometric letter "K" with an integrated AI intelligence sparkle.
 * 
 * @param {number} size - Dimension in pixels (default 24)
 * @param {string} color - Optional color override (if set, overrides the gradients)
 * @param {boolean} glow - Whether to apply a subtle drop shadow glow
 * @param {object} style - Inline styles
 * @param {string} className - Optional CSS class
 */
export default function KuepaAiIcon({
  size = 24,
  color = null,
  glow = false,
  style = {},
  className = ''
}) {
  const rawId = useId();
  // Sanitize id for valid SVG element IDs
  const id = rawId.replace(/[^a-zA-Z0-9-_]/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: glow ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.45))' : undefined,
        ...style
      }}
    >
      <defs>
        <linearGradient id={`k-stem-${id}`} x1="5.5" y1="3" x2="5.5" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id={`k-arm-up-${id}`} x1="7" y1="12.5" x2="16" y2="3.8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id={`k-arm-down-${id}`} x1="10.5" y1="11.5" x2="17.2" y2="20.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id={`k-sparkle-${id}`} x1="17" y1="1.5" x2="22" y2="6.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {/* Vertical Spine of the K */}
      <path
        d="M 5.5 3.5 V 20.5"
        stroke={color || `url(#k-stem-${id})`}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Upper diagonal arm towards top-right */}
      <path
        d="M 6.8 12.5 L 15.8 3.8"
        stroke={color || `url(#k-arm-up-${id})`}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Lower diagonal arm towards bottom-right */}
      <path
        d="M 10.6 11.4 L 17 20.2"
        stroke={color || `url(#k-arm-down-${id})`}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Integrated AI Sparkle / Star in the upper quadrant */}
      <path
        d="M 19.5 1.5 C 19.5 3.2 20.3 4 22 4 C 20.3 4 19.5 4.8 19.5 6.5 C 19.5 4.8 18.7 4 17 4 C 18.7 4 19.5 3.2 19.5 1.5 Z"
        fill={color || `url(#k-sparkle-${id})`}
      />
    </svg>
  );
}
