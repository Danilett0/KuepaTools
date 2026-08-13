/**
 * usuariosService.js
 * Pure Supabase query functions for on-demand user search.
 * No React state, no module-level cache, no bulk loading.
 */

import { supabase } from './supabaseClient';

const USER_FIELDS = 'mongo_id, alliance_id, incremental_user_code, full_name, email, phone, programs';

/**
 * Normalize a raw Supabase user row into the MongoDB-like shape
 * used across the rest of the project.
 */
function normalizeUser(row) {
  return {
    _id:                   { $oid: row.mongo_id },
    alliance_id:           { $oid: row.alliance_id },
    incremental_user_code: row.incremental_user_code,
    profile: {
      full_name: row.full_name || '',
      email:     row.email     || '',
      phone:     row.phone     || '',
    },
    programs: row.programs || [],
  };
}

/**
 * Autocomplete: returns up to `limit` users whose incremental_user_code
 * starts with the given numeric prefix, filtered by alianzaId.
 *
 * Used by IncAutocomplete with debounce.
 *
 * @param {string|number} prefix    - Numeric prefix to match (e.g. "123")
 * @param {string}        alianzaId - MongoDB ObjectId of the alliance
 * @param {number}        limit     - Max results (default 6)
 * @returns {Promise<Array>}
 */
export async function searchByIncPrefix(prefix, alianzaId, limit = 6) {
  const str = String(prefix);

  let query = supabase
    .from('users')
    .select(USER_FIELDS)
    .like('incremental_user_code::text', `${str}%`)
    .limit(limit);

  if (alianzaId) {
    query = query.eq('alliance_id', alianzaId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(normalizeUser);
}

/**
 * Exact lookup: finds a single user by incremental_user_code OR mongo_id,
 * within the given alliance.
 *
 * Used by CambioEstados, AuditarEstadisticas on blur.
 *
 * @param {string} value      - INC number or mongo ObjectId string
 * @param {string} alianzaId  - MongoDB ObjectId of the alliance
 * @returns {Promise<object|null>}
 */
export async function findUser(value, alianzaId) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const incNum = Number(trimmed);
  const isInc  = !isNaN(incNum) && trimmed.length <= 7;

  let query = supabase.from('users').select(USER_FIELDS).limit(1);

  if (alianzaId) {
    query = query.eq('alliance_id', alianzaId);
  }

  if (isInc) {
    query = query.eq('incremental_user_code', incNum);
  } else {
    // mongo_id / _id lookup
    query = query.eq('mongo_id', trimmed);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.length ? normalizeUser(data[0]) : null;
}

/**
 * Bulk lookup: resolves a list of INC numbers to users in a single query.
 *
 * Used by BuscarIdInc and ProgramasPorEstudiante.
 *
 * @param {number[]} incList   - Array of incremental_user_code numbers
 * @param {string}   alianzaId - MongoDB ObjectId of the alliance
 * @returns {Promise<Array>}
 */
export async function findUsersByIncList(incList, alianzaId) {
  if (!incList.length) return [];

  let query = supabase
    .from('users')
    .select(USER_FIELDS)
    .in('incremental_user_code', incList);

  if (alianzaId) {
    query = query.eq('alliance_id', alianzaId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(normalizeUser);
}

/**
 * Paginated listing with optional text filter.
 * Searches full_name, email, and incremental_user_code.
 *
 * Used by Informacion.jsx.
 *
 * @param {string} alianzaId  - MongoDB ObjectId of the alliance
 * @param {string} searchTerm - Free-text filter (name, email, or INC)
 * @param {number} page       - Zero-based page index
 * @param {number} pageSize   - Rows per page (default 10)
 * @returns {Promise<{ users: Array, total: number }>}
 */
export async function listUsuariosPaginados(alianzaId, searchTerm = '', page = 0, pageSize = 10) {
  const from = page * pageSize;
  const to   = from + pageSize - 1;

  let query = supabase
    .from('users')
    .select(USER_FIELDS, { count: 'exact' });

  if (alianzaId) {
    query = query.eq('alliance_id', alianzaId);
  }

  const term = searchTerm.trim();
  if (term) {
    const incNum = Number(term);
    if (!isNaN(incNum) && term.length <= 7) {
      // INC prefix search
      query = query.like('incremental_user_code::text', `${term}%`);
    } else {
      // Full-text on name or email using Supabase OR filter
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    }
  }

  query = query
    .order('incremental_user_code', { ascending: true })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    users: data.map(normalizeUser),
    total: count ?? 0,
  };
}
