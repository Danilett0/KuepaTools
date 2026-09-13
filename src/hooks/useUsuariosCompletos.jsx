import { useQueryClient } from '@tanstack/react-query';
import {
  findUser as svcFindUser,
  findUsersByIncList as svcFindUsersByIncList,
  findUsersByMongoIds as svcFindUsersByMongoIds,
  searchByIncPrefix as svcSearchByIncPrefix,
} from '../services/usuariosService';

/**
 * Hook para buscar usuarios usando la caché de React Query.
 * Exporta funciones imperativas para ser llamadas en eventos (clicks, debounced typing, etc).
 */
export const useUsuariosCompletos = () => {
  const queryClient = useQueryClient();

  const seedIndividualUserCache = (users, alianzaId) => {
    if (!Array.isArray(users)) return;
    for (const u of users) {
      if (u.incremental_user_code) {
        queryClient.setQueryData(['user', alianzaId, String(u.incremental_user_code)], u);
        queryClient.setQueryData(['user', alianzaId, Number(u.incremental_user_code)], u);
      }
      if (u._id?.$oid) {
        queryClient.setQueryData(['user', alianzaId, u._id.$oid], u);
      }
    }
  };

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
    const users = await queryClient.fetchQuery({
      queryKey: ['usersList', alianzaId, sortedListKey],
      queryFn: () => svcFindUsersByIncList(incList, alianzaId),
      staleTime: 5 * 60 * 1000,
    });
    seedIndividualUserCache(users, alianzaId);
    return users;
  };

  const findUsersByMongoIds = async (mongoIds, alianzaId) => {
    if (!mongoIds || mongoIds.length === 0) return [];
    const sortedListKey = [...mongoIds].sort().join(',');
    const users = await queryClient.fetchQuery({
      queryKey: ['usersMongoList', alianzaId, sortedListKey],
      queryFn: () => svcFindUsersByMongoIds(mongoIds, alianzaId),
      staleTime: 5 * 60 * 1000,
    });
    seedIndividualUserCache(users, alianzaId);
    return users;
  };

  const searchByIncPrefix = async (prefix, alianzaId, limit = 6) => {
    if (!prefix) return [];
    return queryClient.fetchQuery({
      queryKey: ['usersPrefix', alianzaId, prefix, limit],
      queryFn: () => svcSearchByIncPrefix(prefix, alianzaId, limit),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { findUser, findUsersByIncList, findUsersByMongoIds, searchByIncPrefix };
};
