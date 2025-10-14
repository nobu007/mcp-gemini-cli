import { describe, it, expect, beforeEach, mock } from "bun:test";
import { SpecificationService } from "../../../lib/services/specification-service";
import type { FileSystemService } from "../../../lib/infrastructure/file-system-service";
import type { NameGenerationService } from "../../../lib/services/name-generation-service";
import { ok, err } from "neverthrow";

describe("SpecificationService", () => {
  let specificationService: SpecificationService;
  let fileSystemService: FileSystemService;
  let nameGenerationService: NameGenerationService;

  beforeEach(() => {
    fileSystemService = {
      getExistingSpecNames: mock(() => Promise.resolve([])),
      createDirectory: mock(() => Promise.resolve(ok(undefined))),
      writeFile: mock(() => Promise.resolve(ok(undefined))),
    };

    nameGenerationService = {
      generateUniqueName: mock(() => "new-feature"),
    };

    specificationService = new SpecificationService(
      fileSystemService,
      nameGenerationService,
    );
  });

  it("should be defined", () => {
    expect(specificationService).toBeDefined();
  });

  describe("initialize", () => {
    it("should successfully initialize a new spec with valid description", async () => {
      const result = await specificationService.initialize("My New Feature");

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.featureName).toBe("new-feature");
        expect(result.value.specPath).toBe(".kiro/specs/new-feature");
      }
    });

    it("should call fileSystemService.getExistingSpecNames with correct path", async () => {
      await specificationService.initialize("Test Feature");

      expect(fileSystemService.getExistingSpecNames).toHaveBeenCalledWith(
        ".kiro/specs",
      );
    });

    it("should call nameGenerationService.generateUniqueName with description and existing names", async () => {
      const existingNames = ["existing-feature"];
      fileSystemService.getExistingSpecNames = mock(() =>
        Promise.resolve(existingNames),
      );

      await specificationService.initialize("Test Feature");

      expect(nameGenerationService.generateUniqueName).toHaveBeenCalledWith(
        "Test Feature",
        existingNames,
      );
    });

    it("should create spec directory with correct path", async () => {
      await specificationService.initialize("My Feature");

      expect(fileSystemService.createDirectory).toHaveBeenCalledWith(
        ".kiro/specs/new-feature",
      );
    });

    it("should write spec.json file with correct structure", async () => {
      await specificationService.initialize("My Feature");

      expect(fileSystemService.writeFile).toHaveBeenCalled();
      const writeCall = (fileSystemService.writeFile as any).mock.calls[0];
      expect(writeCall[0]).toBe(".kiro/specs/new-feature/spec.json");

      const specContent = JSON.parse(writeCall[1]);
      expect(specContent.feature_name).toBe("new-feature");
      expect(specContent.phase).toBe("initialized");
      expect(specContent.language).toBe("ja");
      expect(specContent.ready_for_implementation).toBe(false);
      expect(specContent.approvals.requirements).toEqual({
        generated: false,
        approved: false,
      });
      expect(specContent.approvals.design).toEqual({
        generated: false,
        approved: false,
      });
      expect(specContent.approvals.tasks).toEqual({
        generated: false,
        approved: false,
      });
    });

    it("should reject empty description", async () => {
      const result = await specificationService.initialize("");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Project description cannot be empty",
        );
      }
    });

    it("should reject whitespace-only description", async () => {
      const result = await specificationService.initialize("   ");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe(
          "Project description cannot be empty",
        );
      }
    });

    it("should return error when directory creation fails", async () => {
      fileSystemService.createDirectory = mock(() =>
        Promise.resolve(err(new Error("Permission denied"))),
      );

      const result = await specificationService.initialize("My Feature");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(
          "Failed to create spec directory",
        );
        expect(result.error.message).toContain("Permission denied");
      }
    });

    it("should return error when file write fails", async () => {
      fileSystemService.writeFile = mock(() =>
        Promise.resolve(err(new Error("Disk full"))),
      );

      const result = await specificationService.initialize("My Feature");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain("Failed to write spec file");
        expect(result.error.message).toContain("Disk full");
      }
    });

    it("should use custom specs base path from config", async () => {
      const customService = new SpecificationService(
        fileSystemService,
        nameGenerationService,
        { specsBasePath: "custom/path" },
      );

      await customService.initialize("Feature");

      expect(fileSystemService.getExistingSpecNames).toHaveBeenCalledWith(
        "custom/path",
      );
      expect(fileSystemService.createDirectory).toHaveBeenCalledWith(
        "custom/path/new-feature",
      );
    });

    it("should use custom default language from config", async () => {
      const customService = new SpecificationService(
        fileSystemService,
        nameGenerationService,
        { defaultLanguage: "en" },
      );

      await customService.initialize("Feature");

      const writeCall = (fileSystemService.writeFile as any).mock.calls[0];
      const specContent = JSON.parse(writeCall[1]);
      expect(specContent.language).toBe("en");
    });

    it("should include ISO 8601 timestamps", async () => {
      await specificationService.initialize("Feature");

      const writeCall = (fileSystemService.writeFile as any).mock.calls[0];
      const specContent = JSON.parse(writeCall[1]);

      // Validate ISO 8601 format
      const createdDate = new Date(specContent.created_at);
      const updatedDate = new Date(specContent.updated_at);

      expect(createdDate.toISOString()).toBe(specContent.created_at);
      expect(updatedDate.toISOString()).toBe(specContent.updated_at);
      expect(specContent.created_at).toBe(specContent.updated_at);
    });

    it("should handle errors from getExistingSpecNames gracefully", async () => {
      fileSystemService.getExistingSpecNames = mock(() =>
        Promise.reject(new Error("Read error")),
      );

      const result = await specificationService.initialize("Feature");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Read error");
      }
    });

    it("should format spec.json with proper indentation", async () => {
      await specificationService.initialize("Feature");

      const writeCall = (fileSystemService.writeFile as any).mock.calls[0];
      const jsonString = writeCall[1];

      // Check for indentation (2 spaces)
      expect(jsonString).toContain("\n  ");
      // Validate it's valid JSON
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });
  });

  describe("configuration", () => {
    it("should use default config when not provided", () => {
      const service = new SpecificationService(
        fileSystemService,
        nameGenerationService,
      );
      expect(service).toBeDefined();
    });

    it("should accept partial config", () => {
      const service = new SpecificationService(
        fileSystemService,
        nameGenerationService,
        { specsBasePath: "custom/path" },
      );
      expect(service).toBeDefined();
    });

    it("should accept empty config", () => {
      const service = new SpecificationService(
        fileSystemService,
        nameGenerationService,
        {},
      );
      expect(service).toBeDefined();
    });
  });
});
