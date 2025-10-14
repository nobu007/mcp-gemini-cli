/**
 * Service for generating unique, URL-safe names from text descriptions
 */
export interface NameGenerationService {
  /**
   * Generates a unique, URL-safe name from the provided text
   *
   * @param text - The input text to convert to a unique name
   * @param existingNames - Array of already-used names to avoid conflicts
   * @returns A unique, slugified name
   */
  generateUniqueName(text: string, existingNames: string[]): string;
}

/**
 * Implementation of NameGenerationService that creates URL-safe slugs
 *
 * @remarks
 * This service converts human-readable text into lowercase, hyphen-separated slugs.
 * If a name collision occurs, it appends a numeric suffix (-2, -3, etc.).
 *
 * @example
 * ```typescript
 * const service = new NameGenerationServiceImpl();
 *
 * service.generateUniqueName("My Feature", []);
 * // => "my-feature"
 *
 * service.generateUniqueName("My Feature", ["my-feature"]);
 * // => "my-feature-2"
 *
 * service.generateUniqueName("User Auth!", []);
 * // => "user-auth"
 * ```
 */
export class NameGenerationServiceImpl implements NameGenerationService {
  /**
   * Generates a unique, URL-safe name by slugifying the input text
   *
   * @param text - The input text to convert (e.g., "User Authentication")
   * @param existingNames - Array of names already in use
   * @returns A unique slug (e.g., "user-authentication" or "user-authentication-2")
   *
   * @remarks
   * Algorithm:
   * 1. Convert to lowercase
   * 2. Replace whitespace with hyphens
   * 3. Remove all non-alphanumeric characters except hyphens
   * 4. If collision detected, append incrementing counter (-2, -3, ...)
   */
  generateUniqueName(text: string, existingNames: string[]): string {
    const slug = text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    let uniqueName = slug;
    let counter = 2;
    while (existingNames.includes(uniqueName)) {
      uniqueName = `${slug}-${counter}`;
      counter++;
    }

    return uniqueName;
  }
}
