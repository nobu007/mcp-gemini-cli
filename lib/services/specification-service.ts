import { Result, ok, err } from "neverthrow";
import { join } from "path";
import { FileSystemService } from "../infrastructure/file-system-service";
import { NameGenerationService } from "./name-generation-service";
import { Spec } from "../core/specs/types";

export interface SpecificationServiceConfig {
  specsBasePath?: string;
  defaultLanguage?: "ja" | "en";
}

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
