import React, { useState } from 'react';
import { Lock, User, LogIn } from 'lucide-react';
import { toast } from 'react-toastify';
import { supabase } from '../services/supabaseClient';
import { motion } from 'framer-motion';
import '../Styles/styles.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, ingresa tus credenciales');
      return;
    }
    
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      toast.error('Credenciales incorrectas');
    } else {
      toast.success('¡Bienvenido!');
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
      overflow: 'hidden'
    }}>
      {/* Animated Glowing Orbs Background */}
      <motion.div
        animate={{
          x: [0, 150, -100, 0],
          y: [0, -150, 100, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '500px',
          height: '500px',
          background: 'var(--primary)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.15,
          zIndex: 0,
        }}
      />
      
      <motion.div
        animate={{
          x: [0, -150, 150, 0],
          y: [0, 150, -100, 0],
          scale: [1, 1.5, 0.9, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '600px',
          height: '600px',
          background: '#0ea5e9', /* Teal/Blue tint for contrast */
          borderRadius: '50%',
          filter: 'blur(140px)',
          opacity: 0.1,
          zIndex: 0,
        }}
      />

      <motion.div
        animate={{
          x: [0, 100, -150, 0],
          y: [0, 100, 150, 0],
          scale: [1, 0.8, 1.3, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear", delay: 5 }}
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '400px',
          height: '400px',
          background: '#8b5cf6', /* Subtle purple for depth */
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.08,
          zIndex: 0,
        }}
      />
      
      {/* Subtle Noise Texture Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.03%22/%3E%3C/svg%3E")',
        zIndex: 1,
        pointerEvents: 'none'
      }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="content-container" 
        style={{ 
          maxWidth: '400px', 
          width: '90%', 
          position: 'relative', 
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
          background: 'rgba(18, 18, 18, 0.65)', // Un poco más oscuro para mejor contraste con las luces
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)'
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
          Kuepa Tools
        </h2>
        <p style={{ 
          color: 'var(--on-surface-variant)', 
          margin: '0 0 32px 0', 
          fontSize: '14px',
          textAlign: 'center'
        }}>
          Inicia sesión para acceder al panel
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-wrapper">
            <label className="input-label">Correo electrónico</label>
            <div style={{ position: 'relative' }}>
              <User 
                size={20} 
                color="var(--on-surface-variant)" 
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
              />
              <input
                type="email"
                className="input"
                placeholder="ejemplo@kuepa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '48px' }}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-wrapper">
            <label className="input-label">Contraseña</label>
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

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '12px', padding: '16px', opacity: isLoading ? 0.7 : 1 }}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Iniciando...' : 'Iniciar Sesión'}</span>
            {!isLoading && <LogIn size={18} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
