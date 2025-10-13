import fs from "node:fs/promises";
import type { Result } from "../core/types";

export class FileSystemService {
  async getExistingSpecNames(path: string): Promise<string[]> {
    try {
      const dirents = await fs.readdir(path, { withFileTypes: true });
      return dirents
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
    } catch (error) {
      // If the directory doesn't exist, return an empty array.
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }
      // Re-throw other errors
      throw error;
    }
  }

  async createDirectory(path: string): Promise<Result<void>> {
    try {
      await fs.mkdir(path, { recursive: true });
      return { success: true, value: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async writeFile(path: string, content: string): Promise<Result<void>> {
    try {
      await fs.writeFile(path, content, "utf-8");
      return { success: true, value: undefined };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}
