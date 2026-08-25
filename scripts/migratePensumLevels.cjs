const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');

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
  console.log("Reading pensum_levels.json...");
  
  if (!fs.existsSync('./pensum_levels.json')) {
    console.error("pensum_levels.json not found!");
    return;
  }

  const data = JSON.parse(fs.readFileSync('./pensum_levels.json', 'utf8'));
  console.log(`Found ${data.length} records. Processing...`);

  const transformed = data.map(doc => {
    return {
      mongo_id: doc._id?.$oid || doc._id,
      name: doc.name || 'Sin nombre',
      alliance_id: doc.alliance_id?.$oid || doc.alliance_id || null
    };
  });

  const BATCH_SIZE = 500;
  let totalProcessed = 0;
  let hasError = false;
  
  for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
    const batch = transformed.slice(i, i + BATCH_SIZE);
    const validBatch = batch.filter(s => s.mongo_id);
    if (validBatch.length === 0) continue;

    const { data: result, error } = await supabase
      .from('pensum_levels')
      .upsert(validBatch, { 
        onConflict: 'mongo_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error processing batch ${i} to ${i + BATCH_SIZE}:`, error.message);
      hasError = true;
    } else {
      totalProcessed += validBatch.length;
      console.log(`Successfully upserted ${totalProcessed}/${transformed.length} records...`);
    }
  }

  console.log("Migration complete!");
  if (!hasError) {
    try {
      fs.unlinkSync('./pensum_levels.json');
      console.log("Cleaned up: pensum_levels.json was successfully deleted.");
    } catch (err) {}
  } else {
    console.warn("Errors occurred during migration. File pensum_levels.json was kept for debugging.");
  }
}

migrate().catch(err => {
  console.error("Fatal error during migration:", err);
});
