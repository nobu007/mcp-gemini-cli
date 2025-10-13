export class NameGenerationService {
  generateUniqueName(text: string, existingNames: string[]): string {
    // 1. Create a URL-friendly slug
    const slug = text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // 2. Check for uniqueness and append suffix if necessary
    if (!existingNames.includes(slug)) {
      return slug;
    }

    let counter = 2;
    let uniqueSlug = `${slug}-${counter}`;
    while (existingNames.includes(uniqueSlug)) {
      counter++;
      uniqueSlug = `${slug}-${counter}`;
    }

    return uniqueSlug;
  }
}
