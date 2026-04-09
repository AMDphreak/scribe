import fs from 'fs/promises';
import path from 'path';

export interface VcsProfile {
  id: string;
  name: string;
  host: string;
  binary: string;
  authUrl?: string;
  tokenUrl?: string;
  apiUrl?: string;
  helpUrl?: string;
}

export async function listProfiles(profilesDir: string): Promise<VcsProfile[]> {
  try {
    const files = await fs.readdir(profilesDir);
    const sdlFiles = files.filter(f => f.endsWith('.sdl'));
    const profiles: VcsProfile[] = [];

    for (const file of sdlFiles) {
      const filePath = path.join(profilesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const profile = parseSdl(content, path.basename(file, '.sdl'));
      if (profile) profiles.push(profile);
    }
    
    return profiles;
  } catch (e) {
    console.error("Failed to list profiles:", e);
    return [];
  }
}

function parseSdl(content: string, id: string): VcsProfile | null {
  const result: any = { id };
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimLine = line.trim();
    if (!trimLine || trimLine.startsWith('//') || trimLine.startsWith('/*')) continue;
    
    const match = trimLine.match(/^(\w+)\s+"(.*)"$/);
    if (match) {
      const key = match[1];
      const val = match[2];
      result[key] = val;
    }
  }
  
  if (!result.name || !result.host) return null;
  return result as VcsProfile;
}
