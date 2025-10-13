import { NameGenerationService } from "../../../lib/services/name-generation-service";

describe("NameGenerationService", () => {
  let nameGenerationService: NameGenerationService;

  beforeEach(() => {
    nameGenerationService = new NameGenerationService();
  });

  it("should convert a string to a URL-friendly slug", () => {
    const input = "Initialize Specification Structure";
    const expected = "initialize-specification-structure";
    expect(nameGenerationService.generateUniqueName(input, [])).toBe(expected);
  });

  it("should handle special characters and multiple spaces", () => {
    const input = "  My  Cool@Feature! ";
    const expected = "my-cool-feature";
    expect(nameGenerationService.generateUniqueName(input, [])).toBe(expected);
  });

  it("should append a numeric suffix if the name already exists", () => {
    const input = "Existing Feature";
    const existingNames = ["existing-feature"];
    const expected = "existing-feature-2";
    expect(nameGenerationService.generateUniqueName(input, existingNames)).toBe(
      expected,
    );
  });

  it("should increment the suffix until a unique name is found", () => {
    const input = "Existing Feature";
    const existingNames = ["existing-feature", "existing-feature-2"];
    const expected = "existing-feature-3";
    expect(nameGenerationService.generateUniqueName(input, existingNames)).toBe(
      expected,
    );
  });

  it("should not append a suffix if the name is already unique", () => {
    const input = "New Unique Feature";
    const existingNames = ["another-feature"];
    const expected = "new-unique-feature";
    expect(nameGenerationService.generateUniqueName(input, existingNames)).toBe(
      expected,
    );
  });
});
