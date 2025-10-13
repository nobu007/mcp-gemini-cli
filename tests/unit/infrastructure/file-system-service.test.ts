import { spyOn, describe, it, expect, beforeEach } from "bun:test";
import fs from "node:fs/promises";
import { FileSystemService } from "../../../lib/infrastructure/file-system-service";

describe("FileSystemService", () => {
  let fileSystemService: FileSystemService;

  beforeEach(() => {
    fileSystemService = new FileSystemService();
  });

  describe("getExistingSpecNames", () => {
    it("should return a list of directory names", async () => {
      const mockDirents = [
        { name: "spec-one", isDirectory: () => true },
        { name: "spec-two", isDirectory: () => true },
        { name: "file.txt", isDirectory: () => false },
      ];
      const readdirSpy = spyOn(fs, "readdir").mockResolvedValue(
        mockDirents as any,
      );

      const result =
        await fileSystemService.getExistingSpecNames("./.kiro/specs");
      expect(result).toEqual(["spec-one", "spec-two"]);
      expect(readdirSpy).toHaveBeenCalledWith("./.kiro/specs", {
        withFileTypes: true,
      });
      readdirSpy.mockRestore();
    });

    it("should return an empty array if the directory does not exist", async () => {
      const mockError = new Error("ENOENT: no such file or directory");
      (mockError as any).code = "ENOENT";
      const readdirSpy = spyOn(fs, "readdir").mockRejectedValue(mockError);

      const result =
        await fileSystemService.getExistingSpecNames("./non-existent");
      expect(result).toEqual([]);
      readdirSpy.mockRestore();
    });
  });

  describe("createDirectory", () => {
    it("should create a directory successfully", async () => {
      const mkdirSpy = spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
      const result = await fileSystemService.createDirectory("./new-dir");
      expect(result.success).toBe(true);
      expect(mkdirSpy).toHaveBeenCalledWith("./new-dir", { recursive: true });
      mkdirSpy.mockRestore();
    });

    it("should return an error if directory creation fails", async () => {
      const mockError = new Error("Permission denied");
      const mkdirSpy = spyOn(fs, "mkdir").mockRejectedValue(mockError);
      const result = await fileSystemService.createDirectory("./new-dir");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(mockError);
      }
      mkdirSpy.mockRestore();
    });
  });

  describe("writeFile", () => {
    it("should write a file successfully", async () => {
      const writeFileSpy = spyOn(fs, "writeFile").mockResolvedValue(
        undefined as any,
      );
      const result = await fileSystemService.writeFile("./file.txt", "content");
      expect(result.success).toBe(true);
      expect(writeFileSpy).toHaveBeenCalledWith(
        "./file.txt",
        "content",
        "utf-8",
      );
      writeFileSpy.mockRestore();
    });

    it("should return an error if file writing fails", async () => {
      const mockError = new Error("Disk full");
      const writeFileSpy = spyOn(fs, "writeFile").mockRejectedValue(mockError);
      const result = await fileSystemService.writeFile("./file.txt", "content");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(mockError);
      }
      writeFileSpy.mockRestore();
    });
  });
});
