import { supabase } from './supabaseClient';

export const getAgregaciones = async () => {
  const { data, error } = await supabase
    .from('agregaciones')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data;
};

export const createAgregacion = async (agregacion) => {
  const { data, error } = await supabase
    .from('agregaciones')
    .insert([agregacion])
    .select();
    
  if (error) throw new Error(error.message);
  return data[0];
};

export const updateAgregacion = async (id, updates) => {
  const { data, error } = await supabase
    .from('agregaciones')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) throw new Error(error.message);
  return data[0];
};

export const deleteAgregacion = async (id) => {
  const { error } = await supabase
    .from('agregaciones')
    .delete()
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  return true;
};
