// file_token_storage.ts

import * as path from "@std/path";
import { ensureDir } from "@std/fs";

export class FileTokenStorage {
  private tokenDir: string;

  constructor() {
    const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || ".";
    this.tokenDir = path.join(homeDir, ".deno_tokens");
  }

  private getTokenPath(key: string): string {
    // Sanitize key for safe filename
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(this.tokenDir, `${safeKey}.token`);
  }

  async store(key: string, token: string): Promise<void> {
    try {
      // Ensure directory exists
      await ensureDir(this.tokenDir);
      
      // Base64 encode for basic obfuscation
      const encodedToken = btoa(token);
      const filePath = this.getTokenPath(key);
      
      // Write token to file
      await Deno.writeTextFile(filePath, encodedToken);
      
      // Set restrictive file permissions (Unix-like systems only)
      if (Deno.build.os !== "windows") {
        await Deno.chmod(filePath, 0o600); // Read/write for owner only
      }
    } catch (error: unknown) {
      throw new Error(`Failed to store token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async retrieve(key: string): Promise<string | null> {
    try {
      const filePath = this.getTokenPath(key);
      const encodedToken = await Deno.readTextFile(filePath);
      
      // Decode the token
      const token = atob(encodedToken);
      return token;
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        console.log(`❌ Token not found: ${key}`);
        return null;
      }
      throw new Error(`Failed to retrieve token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getTokenPath(key);
      await Deno.remove(filePath);
      console.log(`✅ Token deleted: ${key}`);
      return true;
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        console.log(`❌ Token not found for deletion: ${key}`);
        return false;
      }
      throw new Error(`Failed to delete token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getTokenPath(key);
      const stat = await Deno.stat(filePath);
      return stat.isFile;
    } catch {
      return false;
    }
  }

  async listTokens(): Promise<string[]> {
    try {
      const tokens: string[] = [];
      for await (const entry of Deno.readDir(this.tokenDir)) {
        if (entry.isFile && entry.name.endsWith('.token')) {
          // Remove .token extension to get the key
          const key = entry.name.replace('.token', '');
          tokens.push(key);
        }
      }
      return tokens;
    } catch {
      return [];
    }
  }

  async clearAll(): Promise<number> {
    try {
      let count = 0;
      for await (const entry of Deno.readDir(this.tokenDir)) {
        if (entry.isFile && entry.name.endsWith('.token')) {
          await Deno.remove(path.join(this.tokenDir, entry.name));
          count++;
        }
      }
      console.log(`✅ Cleared ${count} tokens`);
      return count;
    } catch {
      return 0;
    }
  }
}

// Example usage
if (import.meta.main) {
  const storage = new FileTokenStorage();
  
  // Store some tokens
  await storage.store("github_token", "ghp_1234567890abcdef");
  await storage.store("api_key", "sk-proj-1234567890");
  await storage.store("db_password", "super_secret_password");
  
  // List all tokens
  console.log("\nStored tokens:", await storage.listTokens());
  
  // Retrieve a token
  const githubToken = await storage.retrieve("github_token");
  console.log("GitHub token:", githubToken);
  
  // Check if token exists
  const exists = await storage.exists("api_key");
  console.log("API key exists:", exists);
  
//   // Delete a token
//   await storage.delete("db_password");
  
//   // List remaining tokens
//   console.log("Remaining tokens:", await storage.listTokens());
  
//   // Clear all tokens
//   await storage.clearAll();
}