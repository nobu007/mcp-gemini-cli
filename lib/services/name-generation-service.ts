export interface NameGenerationService {
  generateUniqueName(text: string, existingNames: string[]): string;
}

export class NameGenerationServiceImpl implements NameGenerationService {
  generateUniqueName(text: string, existingNames: string[]): string {
    const slug = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    let uniqueName = slug;
    let counter = 2;
    while (existingNames.includes(uniqueName)) {
      uniqueName = `${slug}-${counter}`;
      counter++;
    }

    return uniqueName;
  }
}