require('dotenv').config({path:'.env.local'});
const {neon} = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`SELECT id, piuser FROM u LIMIT 10`.then(r => console.log(r)).catch(e => console.error(e));
