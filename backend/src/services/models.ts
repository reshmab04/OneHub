import modelsData from '../data/models.json';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  useCases: string[];
  categories: string[];
  scores: {
    writing: number | null;
    coding: number | null;
    reasoning: number | null;
    textGeneration: number | null;
    imageGeneration: number | null;
  };
  scoreSource: string;
  url: string;
}

interface ModelSearchParams {
  query?: string;
  category?: string;
}

class ModelsService {
  private models: AIModel[] = modelsData as AIModel[];

  getModels(params: ModelSearchParams): AIModel[] {
    let results = [...this.models];

    if (params.category) {
      const cat = params.category.toLowerCase();
      results = results.filter(m =>
        m.categories.some(c => c.toLowerCase() === cat)
      );
    }

    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }

    return results;
  }

  getModelById(id: string): AIModel | undefined {
    return this.models.find(m => m.id === id);
  }
}

export const modelsService = new ModelsService();
