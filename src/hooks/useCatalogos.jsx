import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabaseClient';

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
  const { data, isLoading, error } = useQuery({
    queryKey: ['catalogos'],
    queryFn: fetchCatalogos,
    staleTime: Infinity, // Los catálogos raramente cambian, los mantenemos en caché de por vida en la sesión.
  });

  return {
    alianzas: data?.alianzas || [],
    programas: data?.programas || [],
    estados: data?.estados || [],
    loading: isLoading,
    error: error?.message || null,
  };
};
