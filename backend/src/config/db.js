import "dotenv/config"
import dns from "dns";
dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
]);
import { Pool } from 'pg';



const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export { pool };