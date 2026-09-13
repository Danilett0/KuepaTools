import { Info, LogOut, Database } from "lucide-react";
import { motion } from "framer-motion";
import ClearStorageModal from "./ui/ClearStorageModal.jsx";
import { useAppStore } from "../store/useAppStore.js";

/**
 * Sidebar
 * Contains the logo (with click to clear storage),
 * the navigation menu and the bottom Info / Logout links.
 *
 * @param {Function} onConfirmClear  - Called when the user confirms clearing storage
 * @param {Array}    navItems        - Navigation item definitions
 */
export default function Sidebar({ onConfirmClear, navItems }) {
  const activeComponent = useAppStore(state => state.activeComponent);
  const expandedMenu   = useAppStore(state => state.expandedMenu);
  const showClearModal = useAppStore(state => state.showClearModal);
  const setActiveComponent = useAppStore(state => state.setActiveComponent);
  const setExpandedMenu    = useAppStore(state => state.setExpandedMenu);
  const setShowClearModal  = useAppStore(state => state.setShowClearModal);
  const logout   = useAppStore(state => state.logout);
  const userRole = useAppStore(state => state.userRole);

  const handleLogoClick = () => {
    setActiveComponent('estudiante-360');
    setExpandedMenu(null);
  };

  const isGrupos        = (id) => typeof id === 'string' && id.startsWith('herramientas');
  const isInscripciones = (id) => typeof id === 'string' && id.startsWith('inscripciones');

  const getIsActive = (item) =>
    activeComponent === item.id ||
    (isGrupos(item.id)        && isGrupos(activeComponent)) ||
    (isInscripciones(item.id) && isInscripciones(activeComponent)) ||
    activeComponent.startsWith(item.id);

  const is360Active = activeComponent === 'estudiante-360';

  /* ─── Shared active-bg pill ─────────────────────────────────────────── */
  const ActivePill = () => (
    <motion.div
      layoutId="sidebar-active-indicator"
      initial={false}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "10px",
        background: "linear-gradient(135deg, rgba(18,163,131,0.14) 0%, rgba(18,163,131,0.06) 100%)",
        borderLeft: "2.5px solid var(--primary)",
        boxShadow: "inset 0 0 24px rgba(18,163,131,0.06)",
        zIndex: 0,
      }}
    />
  );

  /* ─── Reusable nav item ─────────────────────────────────────────────── */
  const NavItem = ({ item }) => {
    const Icon     = item.icon;
    const isActive = getIsActive(item);

    return (
      <div
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        onClick={() => {
          if (item.subItems) {
            const isExpanded = expandedMenu === item.id;
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
        {isActive && <ActivePill />}
        <span className="sidebar-item-icon" style={{ position: 'relative', zIndex: 1 }}>
          <Icon size={17} />
        </span>
        <span style={{ position: 'relative', zIndex: 1, flex: 1 }}>{item.label}</span>
      </div>
    );
  };

  /* ─── Bottom items (reused pattern) ───────────────────────────────── */
  const FooterItem = ({ id, icon: Icon, label, color, onClick }) => {
    const isActive = activeComponent === id;
    return (
      <div
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        style={color ? { color } : {}}
        onClick={onClick}
      >
        {isActive && !color && <ActivePill />}
        <span className="sidebar-item-icon" style={{ position: 'relative', zIndex: 1 }}>
          <Icon size={17} />
        </span>
        <span style={{ position: 'relative', zIndex: 1, flex: 1 }}>{label}</span>
      </div>
    );
  };

  return (
    <>
      <aside className="sidebar">

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <div
          className="sidebar-title"
          onClick={handleLogoClick}
          style={{
            cursor: 'pointer',
            background: is360Active ? 'rgba(18,163,131,0.08)' : undefined,
            border: is360Active ? '1px solid rgba(18,163,131,0.2)' : '1px solid transparent',
          }}
          title="Centro de Operaciones: Estudiante 360°"
        >
          <svg
            width="52" height="52" viewBox="4 2 32 37" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
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
              fill="url(#shieldGrad)" filter="url(#glow)"
            />
            <path
              d="M20 6.5L7.5 11.5v8.5c0 7 5.5 13 12.5 15 7-2 12.5-8 12.5-15v-8.5L20 6.5z"
              fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"
            />
            <text x="20" y="27" textAnchor="middle"
              fontFamily="'Nunito', sans-serif" fontWeight="800" fontSize="18" fill="#fff"
            >K</text>
          </svg>
          <span style={{ lineHeight: 1, fontSize: '20px', fontWeight: 800, marginLeft: '-6px' }}>
            <span style={{ color: 'var(--on-surface)' }}>uepa</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Tools</span>
          </span>
        </div>

        {/* ── Section label + Nav items ──────────────────────────────── */}
        <p className="sidebar-section-label">Herramientas</p>
        <nav className="sidebar-menu">
          {navItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="sidebar-footer">
          {userRole === 'admin' && (
            <FooterItem
              id="migraciones"
              icon={Database}
              label="Migraciones DB"
              onClick={() => { setActiveComponent('migraciones'); setExpandedMenu(null); }}
            />
          )}
          <FooterItem
            id="informacion"
            icon={Info}
            label="Información"
            onClick={() => { setActiveComponent('informacion'); setExpandedMenu(null); }}
          />
          <div
            className="sidebar-item"
            style={{ color: '#ff5263', marginTop: '4px' }}
            onClick={logout}
          >
            <span className="sidebar-item-icon" style={{ position: 'relative', zIndex: 1 }}>
              <LogOut size={17} />
            </span>
            <span style={{ position: 'relative', zIndex: 1, flex: 1 }}>Cerrar Sesión</span>
          </div>
        </div>
      </aside>

      {/* ── Modal: limpiar storage ──────────────────────────────────── */}
      {showClearModal && (
        <ClearStorageModal
          onClose={() => setShowClearModal(false)}
          onConfirm={onConfirmClear}
        />
      )}
    </>
  );
}
