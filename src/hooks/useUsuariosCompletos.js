import { useState, useEffect } from 'react';

const RAW_URL = "https://raw.githubusercontent.com/Danilett0/KuepaTools/refs/heads/main/src/data/usuarios_completos.json";

// Variables globales al módulo para actuar como caché
let cachedData = null;
let fetchPromise = null;

export const useUsuariosCompletos = () => {
  const [data, setData] = useState(cachedData || []);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si ya tenemos los datos cacheados, no volvemos a hacer fetch
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    // Si ya hay un fetch en curso, nos suscribimos a él
    if (!fetchPromise) {
      fetchPromise = fetch(RAW_URL)
        .then(res => {
          if (!res.ok) throw new Error("Error de red al cargar el JSON");
          return res.json();
        })
        .then(jsonData => {
          cachedData = jsonData;
          return jsonData;
        });
    }

    fetchPromise
      .then(jsonData => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        fetchPromise = null; // Reset promise so it can be retried
      });
  }, []);

  return { data, loading, error };
};
