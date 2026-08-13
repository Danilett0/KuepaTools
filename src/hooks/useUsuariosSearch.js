import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listUsuariosPaginados } from '../services/usuariosService';
import { toast } from 'react-toastify';

export const useUsuariosSearch = (pageSize = 10) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [usuariosFiltro, setUsuariosFiltro] = useState('nueva-america');
  const [usuariosPagina, setUsuariosPagina] = useState(0);

  // Debounce the search term to avoid spamming queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Si cambia el filtro, reiniciamos la página
  useEffect(() => {
    setUsuariosPagina(0);
  }, [usuariosFiltro]);

  const allianceId = usuariosFiltro === 'nueva-america'
    ? '6303ed663138387a1669d82a'
    : '602169e217b5c8a27f9e9c06';

  const { data, isFetching, error } = useQuery({
    queryKey: ['usuarios', allianceId, debouncedSearchTerm, usuariosPagina, pageSize],
    queryFn: async () => {
      const result = await listUsuariosPaginados(allianceId, debouncedSearchTerm, usuariosPagina, pageSize);
      return result;
    },
    keepPreviousData: true, // Mantiene los datos viejos visibles mientras carga la nueva página/búsqueda
    staleTime: 60 * 1000, // 1 minuto de frescura
  });

  if (error) {
    toast.error('Error cargando usuarios: ' + error.message);
  }

  return {
    searchTerm,
    setSearchTerm,
    usuariosFiltro,
    setUsuariosFiltro,
    usuariosPagina,
    setUsuariosPagina,
    serverUsers: data?.users || [],
    totalServerUsers: data?.total || 0,
    loadingUsuarios: isFetching
  };
};
