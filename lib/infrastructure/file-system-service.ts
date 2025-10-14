/**
 * File System Service
 * Provides type-safe file system operations with Result types for error handling
 */

import { writeFile as fsWriteFile, mkdir, readdir } from "node:fs/promises";
import { err, ok, type Result } from "neverthrow";

/**
 * Interface for file system operations
 * Uses Result types (neverthrow) for explicit error handling without exceptions
 */
export interface FileSystemService {
  /**
   * Gets the names of existing specification directories
   * @param path - The path to scan for spec directories
   * @returns Array of directory names, empty array if path doesn't exist
   */
  getExistingSpecNames(path: string): Promise<string[]>;

  /**
   * Creates a directory (recursive)
   * @param path - The directory path to create
   * @returns Result with void on success, Error on failure
   */
  createDirectory(path: string): Promise<Result<void, Error>>;

  /**
   * Writes content to a file
   * @param path - The file path to write
   * @param content - The content to write (UTF-8 encoding)
   * @returns Result with void on success, Error on failure
   */
  writeFile(path: string, content: string): Promise<Result<void, Error>>;
}

/**
 * Implementation of FileSystemService with Result-based error handling
 */
export class FileSystemServiceImpl implements FileSystemService {
  /**
   * Gets the names of existing specification directories
   * Returns empty array if the path doesn't exist (ENOENT), throws for other errors
   *
   * @param path - The path to scan for spec directories
   * @returns Array of directory names
   * @throws Error if readdir fails for reasons other than ENOENT
   */
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

  /**
   * Creates a directory recursively (like mkdir -p)
   *
   * @param path - The directory path to create
   * @returns Result with void on success, Error on failure
   * @example
   * const result = await service.createDirectory('/path/to/nested/dir');
   * if (result.isOk()) {
   *   console.log('Directory created');
   * } else {
   *   console.error('Failed:', result.error);
   * }
   */
  async createDirectory(path: string): Promise<Result<void, Error>> {
    try {
      await mkdir(path, { recursive: true });
      return ok(undefined);
    } catch (error) {
      return err(error);
    }
  }

  /**
   * Writes content to a file with UTF-8 encoding
   * Overwrites existing file if present
   *
   * @param path - The file path to write
   * @param content - The content to write
   * @returns Result with void on success, Error on failure
   * @example
   * const result = await service.writeFile('/path/file.txt', 'content');
   * if (result.isErr()) {
   *   console.error('Write failed:', result.error);
   * }
   */
  async writeFile(path: string, content: string): Promise<Result<void, Error>> {
    try {
      await fsWriteFile(path, content, "utf-8");
      return ok(undefined);
    } catch (error) {
      return err(error);
    }
  }
}
