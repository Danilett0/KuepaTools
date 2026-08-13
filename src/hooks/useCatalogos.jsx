import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

// ── Caché de módulo: solo 1 fetch por sesión ────────────────────────────────
let cachedAlianzas = null;
let cachedProgramas = null;
let cachedEstados = null;
let fetchPromise = null;

/**
 * Normaliza una fila de Supabase al shape MongoDB-like que usa el resto del proyecto.
 * Alianzas:  { _id: { $oid }, name }
 * Programas: { _id: { $oid }, name, alliance_id: { $oid } }
 * Estados:   { _id: { $oid }, name }
 */
function normalizeAlianza(row) {
  return {
    _id: { $oid: row.mongo_id },
    name: row.name,
  };
}

function normalizePrograma(row) {
  return {
    _id: { $oid: row.mongo_id },
    name: row.name,
    alliance_id: { $oid: row.alliance_id },
  };
}

function normalizeEstado(row) {
  return {
    _id: { $oid: row.mongo_id },
    name: row.name,
  };
}

async function fetchCatalogos() {
  const [alianzasRes, programasRes, estadosRes] = await Promise.all([
    supabase.from('alianzas').select('mongo_id, name'),
    supabase.from('programas').select('mongo_id, name, alliance_id'),
    supabase.from('estados').select('mongo_id, name'),
  ]);

  if (alianzasRes.error) throw new Error(alianzasRes.error.message);
  if (programasRes.error) throw new Error(programasRes.error.message);
  if (estadosRes.error) throw new Error(estadosRes.error.message);

  return {
    alianzas: alianzasRes.data.map(normalizeAlianza),
    programas: programasRes.data.map(normalizePrograma),
    estados:   estadosRes.data.map(normalizeEstado),
  };
}

export const useCatalogos = () => {
  const [alianzas, setAlianzas] = useState(cachedAlianzas || []);
  const [programas, setProgramas] = useState(cachedProgramas || []);
  const [estados, setEstados] = useState(cachedEstados || []);
  const [loading, setLoading] = useState(!cachedAlianzas || !cachedProgramas || !cachedEstados);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedAlianzas && cachedProgramas && cachedEstados) {
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchCatalogos().then(({ alianzas: a, programas: p, estados: e }) => {
        cachedAlianzas = a;
        cachedProgramas = p;
        cachedEstados = e;
        return { a, p, e };
      });
    }

    fetchPromise
      .then(({ a, p, e }) => {
        setAlianzas(a);
        setProgramas(p);
        setEstados(e);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        fetchPromise = null;
      });
  }, []);

  return { alianzas, programas, estados, loading, error };
};
