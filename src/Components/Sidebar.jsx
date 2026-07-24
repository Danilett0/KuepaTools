import { useRef } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import ClearStorageModal from "./ui/ClearStorageModal.jsx";

/**
 * Sidebar
 * Contains the logo (with triple-click to clear storage),
 * the navigation menu and the bottom Info link.
 *
 * @param {string}   activeComponent - Current active route ID
 * @param {string|null} expandedMenu - ID of the currently expanded submenu
 * @param {boolean}  showClearModal  - Whether the clear-storage modal is visible
 * @param {Function} setActiveComponent
 * @param {Function} setExpandedMenu
 * @param {Function} setShowClearModal
 * @param {Function} onConfirmClear  - Called when the user confirms clearing storage
 * @param {Array}    navItems        - Navigation item definitions
 */
export default function Sidebar({
  activeComponent,
  expandedMenu,
  showClearModal,
  setActiveComponent,
  setExpandedMenu,
  setShowClearModal,
  onConfirmClear,
  navItems,
}) {
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 500);
    if (clickCountRef.current === 3) {
      clickCountRef.current = 0;
      clearTimeout(clickTimerRef.current);
      setShowClearModal(true);
    }
  };

  return (
    <>
      <aside className="sidebar">
        {/* ── Logo ─────────────────────────────────────────────────── */}
        <div className="sidebar-title">
          <svg
            width="60" height="60" viewBox="4 2 32 37" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, cursor: 'pointer' }}
            onClick={handleLogoClick}
            title="Triple clic para limpiar el storage"
          >
            <defs>
              <linearGradient id="shieldGrad" x1="4" y1="2" x2="36" y2="39" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#12a383" />
                <stop offset="100%" stopColor="#06a080" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path
              d="M20 3L5 9v10c0 8.5 6.5 16 15 18 8.5-2 15-9.5 15-18V9L20 3z"
              fill="url(#shieldGrad)"
              filter="url(#glow)"
            />
            <path
              d="M20 6.5L7.5 11.5v8.5c0 7 5.5 13 12.5 15 7-2 12.5-8 12.5-15v-8.5L20 6.5z"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.8"
            />
            <text
              x="20" y="27"
              textAnchor="middle"
              fontFamily="'Nunito', sans-serif"
              fontWeight="800"
              fontSize="18"
              fill="#fff"
            >K</text>
          </svg>
          <span style={{ lineHeight: 1, fontSize: '24px', fontWeight: 800, marginLeft: '-10px' }}>
            <span style={{ color: 'var(--on-surface)' }}>uepa</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Tools</span>
          </span>
        </div>

        {/* ── Nav menu ─────────────────────────────────────────────── */}
        <div className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenu === item.id;
            const isActive = activeComponent.startsWith(item.id) || activeComponent === item.id;

            return (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  className={`sidebar-item ${isActive && !item.subItems ? 'active' : ''}`}
                  style={item.subItems && isActive ? { color: 'var(--primary)' } : {}}
                  onClick={() => {
                    if (item.subItems) {
                      setExpandedMenu(isExpanded ? null : item.id);
                      if (!isExpanded && !activeComponent.startsWith(item.id)) {
                        setActiveComponent(item.subItems[0].id);
                      }
                    } else {
                      setActiveComponent(item.id);
                      setExpandedMenu(null);
                    }
                  }}
                >
                  <Icon size={20} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.subItems && (
                    isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </div>
                {item.subItems && isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '28px', marginTop: '4px' }}>
                    {item.subItems.map((sub) => (
                      <div
                        key={sub.id}
                        className={`sidebar-item ${activeComponent === sub.id ? 'active' : ''}`}
                        style={{ padding: '10px 16px', fontSize: '13px' }}
                        onClick={() => setActiveComponent(sub.id)}
                      >
                        {sub.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Bottom: Información ───────────────────────────────────── */}
        <div className="sidebar-bottom" style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
          <div
            className={`sidebar-item ${activeComponent === 'informacion' ? 'active' : ''}`}
            onClick={() => { setActiveComponent('informacion'); setExpandedMenu(null); }}
          >
            <Info size={20} />
            <span style={{ flex: 1 }}>Información</span>
          </div>
        </div>
      </aside>

      {/* ── Modal: limpiar storage ───────────────────────────────────── */}
      {showClearModal && (
        <ClearStorageModal
          onClose={() => setShowClearModal(false)}
          onConfirm={onConfirmClear}
        />
      )}
    </>
  );
}
