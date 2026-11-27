import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load local .env with override BEFORE database pools initialize at module import time.
// On serverless platforms (Vercel / Netlify), environment variables are injected natively.
if (!process.env.VERCEL && !process.env.NETLIFY) {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}
