import { supabase } from './supabaseClient';

/**
 * Obtiene el valor de una configuración global por su clave
 * @param {string} key 
 * @returns {Promise<string|null>}
 */
export const getGlobalSetting = async (key) => {
  try {
    const { data, error } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 es "No rows found"
      console.error(`Error fetching setting [${key}]:`, error);
      return null;
    }
    
    return data ? data.value : null;
  } catch (error) {
    console.error(`Error in getGlobalSetting [${key}]:`, error);
    return null;
  }
};

/**
 * Guarda o actualiza una configuración global
 * @param {string} key 
 * @param {string} value 
 * @returns {Promise<boolean>}
 */
export const setGlobalSetting = async (key, value) => {
  try {
    const { error } = await supabase
      .from('global_settings')
      .upsert({ key, value }, { onConflict: 'key' });
      
    if (error) {
      console.error(`Error saving setting [${key}]:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in setGlobalSetting [${key}]:`, error);
    return false;
  }
};
