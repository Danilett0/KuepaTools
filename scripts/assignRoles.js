const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Manual simple .env parser
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim();
  }
});

const url = env['VITE_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!serviceRoleKey) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY no está definido en el archivo .env");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function assignRoles() {
  console.log("Obteniendo usuarios desde Supabase...");
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error("Error al obtener usuarios:", usersError.message);
    return;
  }

  console.log("Usuarios en la base de datos:");
  usersData.users.forEach(u => console.log(u.email));

  const danilo = usersData.users.find(u => u.email === 'daniilo.97@hotmail.com');
  const leonardo = usersData.users.find(u => u.email === 'leonardo.sanches@kuepa.com');

  const roles = [];
  if (danilo) {
    roles.push({ user_id: danilo.id, role: 'admin' });
    console.log(`Encontrado daniilo.97@hotmail.com con ID: ${danilo.id}`);
  } else {
    console.log("No se encontró a daniilo.97@hotmail.com");
  }
  
  if (leonardo) {
    roles.push({ user_id: leonardo.id, role: 'user' });
    console.log(`Encontrado leonardo.sanches@kuepa.com con ID: ${leonardo.id}`);
  } else {
    console.log("No se encontró a leonardo.sanches@kuepa.com");
  }

  if (roles.length === 0) {
    console.log("No hay usuarios válidos para actualizar.");
    return;
  }

  console.log("Iniciando inserción de roles...");
  
  const { data, error } = await supabase
    .from('user_roles')
    .upsert(roles);

  if (error) {
    console.error("Error al asignar roles:", error.message);
  } else {
    console.log("¡Roles asignados exitosamente en Supabase!");
  }
}

assignRoles();
