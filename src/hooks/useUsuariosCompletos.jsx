import { useQueryClient } from '@tanstack/react-query';
import {
  findUser as svcFindUser,
  findUsersByIncList as svcFindUsersByIncList,
  searchByIncPrefix as svcSearchByIncPrefix,
} from '../services/usuariosService';

/**
 * Hook para buscar usuarios usando la caché de React Query.
 * Exporta funciones imperativas para ser llamadas en eventos (clicks, debounced typing, etc).
 */
export const useUsuariosCompletos = () => {
  const queryClient = useQueryClient();

  const findUser = async (value, alianzaId) => {
    if (!value) return null;
    return queryClient.fetchQuery({
      queryKey: ['user', alianzaId, value],
      queryFn: () => svcFindUser(value, alianzaId),
      staleTime: 5 * 60 * 1000, // 5 minutos en caché
    });
  };

  const findUsersByIncList = async (incList, alianzaId) => {
    if (!incList || incList.length === 0) return [];
    const sortedListKey = [...incList].sort().join(',');
    return queryClient.fetchQuery({
      queryKey: ['usersList', alianzaId, sortedListKey],
      queryFn: () => svcFindUsersByIncList(incList, alianzaId),
      staleTime: 5 * 60 * 1000,
    });
  };

  const searchByIncPrefix = async (prefix, alianzaId, limit = 6) => {
    if (!prefix) return [];
    return queryClient.fetchQuery({
      queryKey: ['usersPrefix', alianzaId, prefix, limit],
      queryFn: () => svcSearchByIncPrefix(prefix, alianzaId, limit),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { findUser, findUsersByIncList, searchByIncPrefix };
};
