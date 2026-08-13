/**
 * useUsuariosCompletos
 *
 * ⚠️  MIGRADO: ya NO descarga todos los usuarios.
 *
 * Expone helpers de búsqueda bajo demanda que delegan en usuariosService.js.
 * Cada componente pide solo lo que necesita, cuando lo necesita.
 *
 * API:
 *   const { findUser, findUsersByIncList, searchByIncPrefix, loading, error } = useUsuariosCompletos();
 */

import { useState, useCallback } from 'react';
import {
  findUser        as svcFindUser,
  findUsersByIncList as svcFindUsersByIncList,
  searchByIncPrefix  as svcSearchByIncPrefix,
} from '../services/usuariosService';

export const useUsuariosCompletos = () => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const wrap = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /** Exact user lookup by INC or mongo_id within an alliance. */
  const findUser = useCallback(
    (value, alianzaId) => wrap(() => svcFindUser(value, alianzaId)),
    [wrap]
  );

  /** Bulk lookup of multiple INC numbers in one query. */
  const findUsersByIncList = useCallback(
    (incList, alianzaId) => wrap(() => svcFindUsersByIncList(incList, alianzaId)),
    [wrap]
  );

  /** Autocomplete: users whose INC starts with prefix (no debounce here — caller handles it). */
  const searchByIncPrefix = useCallback(
    (prefix, alianzaId, limit) => wrap(() => svcSearchByIncPrefix(prefix, alianzaId, limit)),
    [wrap]
  );

  return { findUser, findUsersByIncList, searchByIncPrefix, loading, error };
};
