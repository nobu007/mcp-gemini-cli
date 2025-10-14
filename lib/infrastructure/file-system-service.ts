import { writeFile as fsWriteFile, mkdir, readdir } from "node:fs/promises";
import { err, ok, type Result } from "neverthrow";

export interface FileSystemService {
  getExistingSpecNames(path: string): Promise<string[]>;
  createDirectory(path: string): Promise<Result<void, Error>>;
  writeFile(path: string, content: string): Promise<Result<void, Error>>;
}

export class FileSystemServiceImpl implements FileSystemService {
  async getExistingSpecNames(path: string): Promise<string[]> {
    try {
      const entries = await readdir(path, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async createDirectory(path: string): Promise<Result<void, Error>> {
    try {
      await mkdir(path, { recursive: true });
      return ok(undefined);
    } catch (error) {
      return err(error);
    }
  }

  async writeFile(path: string, content: string): Promise<Result<void, Error>> {
    try {
      await fsWriteFile(path, content, "utf-8");
      return ok(undefined);
    } catch (error) {
      return err(error);
    }
  }
}
