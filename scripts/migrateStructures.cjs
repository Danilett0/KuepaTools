const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');

// Parse .env file manually
function loadEnv() {
  try {
    const envFile = fs.readFileSync('./.env', 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  } catch (e) {
    console.warn("Could not load .env file", e.message);
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Reading structures.json...");
  
  // Read the file directly from the root directory
  const data = JSON.parse(fs.readFileSync('./structures.json', 'utf8'));
  console.log(`Found ${data.length} records. Processing...`);

  // Transform data
  const transformed = data.map(doc => {
    // Extract user IDs from the config.users array
    const userIds = (doc.config?.users || [])
      .map(u => u.user?.$oid || u.user)
      .filter(Boolean); // Remove any null/undefined values

    return {
      mongo_id: doc._id?.$oid || doc._id,
      name: doc.name || 'Sin nombre',
      users: userIds,
      parent_id: doc.parent?.$oid || doc.parent || null,
      pensum_level_id: doc.config?.pensum_level?.$oid || doc.config?.pensum_level || null,
      alliance_id: doc.alliance_id?.$oid || doc.alliance_id || null
    };
  });

  // Batch insert/upsert
  const BATCH_SIZE = 500;
  let hasError = false;
  
  // Build a Set of all valid mongo_ids to ensure referential integrity
  const allMongoIds = new Set(transformed.map(s => s.mongo_id));

  console.log("=== PASS 1: Inserting structures without parent_id ===");
  for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
    const batch = transformed.slice(i, i + BATCH_SIZE).map(s => ({ ...s, parent_id: null }));
    const validBatch = batch.filter(s => s.mongo_id);
    if (validBatch.length === 0) continue;

    const { error } = await supabase
      .from('structures')
      .upsert(validBatch, { 
        onConflict: 'mongo_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Pass 1 Error processing batch ${i} to ${i + BATCH_SIZE}:`, error.message);
      hasError = true;
    } else {
      console.log(`Pass 1: Processed ${Math.min(i + BATCH_SIZE, transformed.length)}/${transformed.length} records...`);
    }
  }

  if (!hasError) {
    console.log("=== PASS 2: Updating structures with valid parent_ids ===");
    for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
      // Only include if parent_id is not null AND parent_id exists in our dataset
      const batch = transformed
        .slice(i, i + BATCH_SIZE)
        .filter(s => s.parent_id !== null && allMongoIds.has(s.parent_id));
        
      if (batch.length === 0) continue;

      const { error } = await supabase
        .from('structures')
        .upsert(batch, { 
          onConflict: 'mongo_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Pass 2 Error processing batch ${i} to ${i + BATCH_SIZE}:`, error.message);
        hasError = true;
      } else {
        console.log(`Pass 2: Processed ${Math.min(i + BATCH_SIZE, transformed.length)}/${transformed.length} records...`);
      }
    }
  }

  console.log("Migration complete!");
  if (!hasError) {
    try {
      fs.unlinkSync('./structures.json');
      console.log("Cleaned up: structures.json was successfully deleted.");
    } catch (err) {
      console.warn("Could not delete structures.json:", err.message);
    }
  } else {
    console.warn("Errors occurred during migration. File structures.json was kept for debugging.");
  }
}

migrate().catch(err => {
  console.error("Fatal error during migration:", err);
});
