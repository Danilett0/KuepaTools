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
  console.log("Reading users_updated.json...");
  const data = JSON.parse(fs.readFileSync('./users_updated.json', 'utf8'));
  console.log(`Found ${data.length} records. Processing...`);

  // Transform data
  const transformed = data.map(doc => {
    return {
      mongo_id: doc._id?.$oid || doc._id,
      alliance_id: doc.alliance_id?.$oid || doc.alliance_id || null,
      incremental_user_code: doc.incremental_user_code,
      full_name: doc.profile?.full_name?.trim() || null,
      email: doc.profile?.email?.trim() || null,
      phone: doc.profile?.phone?.trim() || null,
      programs: doc.programs || []
    };
  });

  // Batch insert/upsert
  const BATCH_SIZE = 500;
  let totalProcessed = 0;
  
  for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
    const batch = transformed.slice(i, i + BATCH_SIZE);
    
    // Check for errors in batch mapping (missing mongo_id or incremental_user_code)
    const validBatch = batch.filter(u => u.mongo_id && u.incremental_user_code != null);
    
    if (validBatch.length === 0) continue;

    const { data: result, error } = await supabase
      .from('users')
      .upsert(validBatch, { 
        onConflict: 'mongo_id',
        ignoreDuplicates: false // We want to update existing
      });

    if (error) {
      console.error(`Error processing batch ${i} to ${i + BATCH_SIZE}:`, error.message);
    } else {
      totalProcessed += validBatch.length;
      console.log(`Successfully upserted ${totalProcessed}/${transformed.length} records...`);
    }
  }

  console.log("Migration complete!");

  try {
    fs.unlinkSync('./users_updated.json');
    console.log("Cleaned up: users_updated.json was successfully deleted.");
  } catch (err) {
    console.warn("Could not delete users_updated.json:", err.message);
  }
}

migrate().catch(err => {
  console.error("Fatal error during migration:", err);
});
