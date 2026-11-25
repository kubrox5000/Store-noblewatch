import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function loadFirebaseProjectId(): string {
  const candidates = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(process.cwd(), '../firebase-applet-config.json'),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (parsed?.projectId) return String(parsed.projectId);
      }
    } catch {
      // ignore
    }
  }
  return 'intricate-cogency-flcf1';
}

if (!getApps().length) {
  initializeApp({
    projectId: loadFirebaseProjectId(),
  });
}

export const adminAuth = getAuth();
