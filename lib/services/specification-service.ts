import { join } from "node:path";
import { err, ok, type Result } from "neverthrow";
import type { Spec } from "../core/specs/types";
import type { FileSystemService } from "../infrastructure/file-system-service";
import type { NameGenerationService } from "./name-generation-service";

/**
 * Configuration options for SpecificationService
 */
export interface SpecificationServiceConfig {
  /** Base directory for storing specification files (default: .kiro/specs) */
  specsBasePath?: string;
  /** Default language for specification documents (default: ja) */
  defaultLanguage?: "ja" | "en";
}

/**
 * Service for managing project specifications and feature documentation
 *
 * @remarks
 * This service handles the lifecycle of specification documents, including:
 * - Initializing new specifications from project descriptions
 * - Generating unique feature names
 * - Creating spec directory structures
 * - Managing spec.json metadata files
 *
 * @example
 * ```typescript
 * const specService = new SpecificationService(
 *   fileSystemService,
 *   nameGenerationService,
 *   { specsBasePath: ".kiro/specs", defaultLanguage: "ja" }
 * );
 *
 * const result = await specService.initialize("User authentication system");
 * if (result.isOk()) {
 *   console.log(`Created spec: ${result.value.featureName}`);
 *   console.log(`Path: ${result.value.specPath}`);
 * }
 * ```
 */
export class SpecificationService {
  private readonly specsBasePath: string;
  private readonly defaultLanguage: "ja" | "en";

  constructor(
    private readonly fileSystemService: FileSystemService,
    private readonly nameGenerationService: NameGenerationService,
    config: SpecificationServiceConfig = {},
  ) {
    this.specsBasePath = config.specsBasePath || ".kiro/specs";
    this.defaultLanguage = config.defaultLanguage || "ja";
  }

  /**
   * Initializes a new specification from a project description
   *
   * @param projectDescription - Human-readable description of the feature/project
   * @returns Result containing the generated feature name and spec path, or an error
   *
   * @remarks
   * This method performs the following steps:
   * 1. Validates the project description is non-empty
   * 2. Generates a unique feature name from the description
   * 3. Creates the specification directory structure
   * 4. Writes an initial spec.json file with metadata
   *
   * @throws Error if:
   * - Project description is empty or whitespace-only
   * - Spec directory creation fails
   * - spec.json file write fails
   *
   * @example
   * ```typescript
   * const result = await specService.initialize("User authentication with OAuth2");
   *
   * if (result.isOk()) {
   *   // Success: { featureName: "user-authentication-with-oauth2", specPath: ".kiro/specs/..." }
   *   const { featureName, specPath } = result.value;
   * } else {
   *   // Error: result.error contains the Error object
   *   console.error(result.error.message);
   * }
   * ```
   */
  async initialize(
    projectDescription: string,
  ): Promise<Result<{ featureName: string; specPath: string }, Error>> {
    try {
      // Validate input
      if (!projectDescription || projectDescription.trim().length === 0) {
        return err(new Error("Project description cannot be empty"));
      }

      // Get existing spec names for uniqueness check
      const existingNames = await this.fileSystemService.getExistingSpecNames(
        this.specsBasePath,
      );

      // Generate unique feature name
      const featureName = this.nameGenerationService.generateUniqueName(
        projectDescription,
        existingNames,
      );

      // Create spec directory path
      const specPath = join(this.specsBasePath, featureName);

      // Create the spec directory
      const dirResult = await this.fileSystemService.createDirectory(specPath);
      if (dirResult.isErr()) {
        return err(
          new Error(
            `Failed to create spec directory: ${dirResult.error.message}`,
          ),
        );
      }

      // Create initial spec.json
      const now = new Date().toISOString();
      const initialSpec: Spec = {
        feature_name: featureName,
        created_at: now,
        updated_at: now,
        language: this.defaultLanguage,
        phase: "initialized",
        approvals: {
          requirements: { generated: false, approved: false },
          design: { generated: false, approved: false },
          tasks: { generated: false, approved: false },
        },
        ready_for_implementation: false,
      };

      const specFilePath = join(specPath, "spec.json");
      const writeResult = await this.fileSystemService.writeFile(
        specFilePath,
        JSON.stringify(initialSpec, null, 2),
      );

      if (writeResult.isErr()) {
        return err(
          new Error(`Failed to write spec file: ${writeResult.error.message}`),
        );
      }

      return ok({ featureName, specPath });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
