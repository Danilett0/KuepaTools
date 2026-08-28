import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../store/useAppStore';
import '../Styles/styles.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Por favor, completa ambos campos');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error('Error al actualizar: ' + error.message);
    } else {
      toast.success('¡Contraseña actualizada exitosamente!');
      // Reset the recovery state manually so they enter the app normally
      useAppStore.setState({ isPasswordRecovery: false });
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 9999,
      background: 'var(--surface-void)',
      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.06) 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px',
    }}>
      {/* Aurora effects */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '0',
        right: '0',
        height: '500px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(18, 163, 131, 0.18), transparent 70%)',
        zIndex: 0,
        pointerEvents: 'none',
        animation: 'auroraPulse 8s ease-in-out infinite alternate',
      }}></div>
      
      <div 
        className="content-container" 
        style={{ 
          maxWidth: '400px', 
          width: '90%', 
          position: 'relative', 
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 32px'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '24px',
          boxShadow: '0 4px 15px var(--gold-glow)'
        }}>
          <Lock size={32} color="#fff" />
        </div>
        
        <h2 style={{ margin: '0 0 8px 0', fontWeight: '800', fontSize: '24px' }}>
          Nueva Contraseña
        </h2>
        <p style={{ 
          color: 'var(--on-surface-variant)', 
          margin: '0 0 32px 0', 
          fontSize: '14px',
          textAlign: 'center'
        }}>
          Ingresa tu nueva clave de acceso
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-wrapper">
            <label className="input-label">Nueva Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={20} 
                color="var(--on-surface-variant)" 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <div className="input-wrapper">
            <label className="input-label">Confirmar Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock 
                size={20} 
                color="var(--on-surface-variant)" 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '48px' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '12px', padding: '16px', opacity: isLoading ? 0.7 : 1 }}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Actualizando...' : 'Guardar y Entrar'}</span>
            {!isLoading && <LogIn size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
