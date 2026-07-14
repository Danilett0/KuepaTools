import { useState, useEffect } from 'react';

const URLS = {
  alianzas: "https://raw.githubusercontent.com/Danilett0/KuepaTools/refs/heads/main/src/data/alianzas.json",
  programas: "https://raw.githubusercontent.com/Danilett0/KuepaTools/refs/heads/main/src/data/programas.json",
  estados: "https://raw.githubusercontent.com/Danilett0/KuepaTools/refs/heads/main/src/data/estados.json"
};

let cachedAlianzas = null;
let cachedProgramas = null;
let cachedEstados = null;
let fetchPromise = null;

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
      fetchPromise = Promise.all([
        fetch(URLS.alianzas).then(r => {
          if (!r.ok) throw new Error("Error cargando alianzas");
          return r.json();
        }),
        fetch(URLS.programas).then(r => {
          if (!r.ok) throw new Error("Error cargando programas");
          return r.json();
        }),
        fetch(URLS.estados).then(r => {
          if (!r.ok) throw new Error("Error cargando estados");
          return r.json();
        })
      ]).then(([a, p, e]) => {
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
