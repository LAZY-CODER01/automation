
const { Client } = require('pg');

require('dotenv').config();

async function checkConnection() {
  console.log('Attempting to connect to the database...');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined in your .env file.');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Attempt to connect
    await client.connect();
    console.log('✅ Success! Database connection is working correctly.');

    // Run a simple query to be sure
    const res = await client.query('SELECT NOW()');
    console.log('✅ Test query successful. Current server time:', res.rows[0].now);

  } catch (err) {
    console.error('❌ Failure! Could not connect to the database.');
    console.error('Error details:', err.message);
  } finally {
    // Close the connection
    await client.end();
  }
}

checkConnection();
