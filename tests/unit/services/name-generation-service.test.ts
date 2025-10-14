import { describe, it, expect } from "bun:test";
import { NameGenerationServiceImpl } from "../../../lib/services/name-generation-service";

describe("NameGenerationService", () => {
  const nameGenerationService = new NameGenerationServiceImpl();

  it("should generate a URL-friendly slug from a description", () => {
    const description = "My New Awesome Feature!";
    const slug = nameGenerationService.generateUniqueName(description, []);
    expect(slug).toBe("my-new-awesome-feature");
  });

  it("should handle special characters", () => {
    const description = "Feature with special chars!@#$%^&*()";
    const slug = nameGenerationService.generateUniqueName(description, []);
    expect(slug).toBe("feature-with-special-chars");
  });

  it("should ensure uniqueness by adding a suffix", () => {
    const description = "My Feature";
    const existingNames = ["my-feature"];
    const slug = nameGenerationService.generateUniqueName(
      description,
      existingNames,
    );
    expect(slug).toBe("my-feature-2");
  });

  it("should increment suffix until unique", () => {
    const description = "My Feature";
    const existingNames = ["my-feature", "my-feature-2"];
    const slug = nameGenerationService.generateUniqueName(
      description,
      existingNames,
    );
    expect(slug).toBe("my-feature-3");
  });
});
