/**
 * usuariosService.js
 * Pure Supabase query functions for on-demand user search.
 * No React state, no module-level cache, no bulk loading.
 */

import { supabase } from './supabaseClient.js';

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
  const str = String(prefix).trim();
  if (!/^\d+$/.test(str)) return [];

  const num = parseInt(str, 10);
  const parts = [`incremental_user_code.eq.${num}`];
  for (let d = str.length + 1; d <= 6; d++) {
    const mult = Math.pow(10, d - str.length);
    const min = num * mult;
    const max = min + mult - 1;
    parts.push(`and(incremental_user_code.gte.${min},incremental_user_code.lte.${max})`);
  }

  let query = supabase
    .from('users')
    .select(USER_FIELDS)
    .or(parts.join(','))
    .order('incremental_user_code', { ascending: true })
    .limit(limit);

  if (alianzaId) {
    query = query.eq('alliance_id', alianzaId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(normalizeUser);
}

const inFlightUsers = new Map();

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
  const trimmed = (value || '').trim();
  if (!trimmed) return null;

  const key = `${trimmed}:${alianzaId || ''}`;
  if (inFlightUsers.has(key)) {
    return inFlightUsers.get(key);
  }

  const promise = (async () => {
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
  })();

  inFlightUsers.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightUsers.delete(key);
  }
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
 * Bulk lookup: resolves a list of mongo_id (ObjectId) strings to users in a single query.
 *
 * @param {string[]} mongoIds  - Array of mongo_id strings
 * @param {string}   alianzaId - MongoDB ObjectId of the alliance
 * @returns {Promise<Array>}
 */
export async function findUsersByMongoIds(mongoIds, alianzaId) {
  if (!mongoIds || !mongoIds.length) return [];

  const uniqueIds = [...new Set(mongoIds.filter(id => /^[a-f0-9]{24}$/i.test(id)))];
  if (!uniqueIds.length) return [];

  let query = supabase
    .from('users')
    .select(USER_FIELDS)
    .in('mongo_id', uniqueIds);

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

  const rawTerm = searchTerm.trim();
  if (rawTerm) {
    const term = rawTerm.replace(/[,()]/g, ' ').trim();
    if (term) {
      const isMongoId = /^[a-f0-9]{24}$/i.test(term);
      const isNumericSafe = /^\d{1,9}$/.test(term); // safe for 32-bit integer columns

      if (isMongoId) {
        // Exact ObjectId match or fallback to text fields
        query = query.or(`mongo_id.eq.${term},full_name.ilike.%${term}%,email.ilike.%${term}%`);
      } else if (isNumericSafe) {
        const num = parseInt(term, 10);
        // Matches exact INC code, internal Postgres ID, phone, email, full_name, or partial mongo_id
        query = query.or(`incremental_user_code.eq.${num},id.eq.${num},phone.ilike.%${term}%,email.ilike.%${term}%,full_name.ilike.%${term}%`);
      } else {
        // Phone numbers > 9 digits, alphanumeric text, emails, names, partial mongo IDs
        query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,mongo_id.ilike.%${term}%`);
      }
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
