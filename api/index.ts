import type { Request, Response } from 'express';
import { app } from '../src/server/app.ts';

export default function handler(req: Request, res: Response) {
  try {
    const parsed = new URL(req.url || '/', 'http://localhost');
    const rewrittenPath = parsed.searchParams.get('__vercel_path');
    if (rewrittenPath) {
      parsed.searchParams.delete('__vercel_path');
      const remainingQs = parsed.searchParams.toString();
      req.url = `${rewrittenPath.startsWith('/') ? '' : '/'}${rewrittenPath}${
        remainingQs ? `?${remainingQs}` : ''
      }`;
    }
  } catch {
    // Keep original req.url on malformed URLs
  }

  // Prevent Express body-parser from re-reading stream if Vercel already parsed req.body
  const anyReq = req as any;
  if (anyReq.body !== undefined && !anyReq._body) {
    anyReq._body = true;
  }

  return app(req, res);
}
