import axios from 'axios';
import NodeCache from 'node-cache';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

interface TrendingParams {
  language?: string;
  sort?: string;
  order?: string;
  query?: string;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  ownerAvatar: string;
  description: string | null;
  language: string | null;
  stars: number;
  starsToday: number | null;
  forks: number;
  url: string;
  updatedAt: string;
  createdAt: string;
}

const cache = new NodeCache({ stdTTL: 1800 });

class GithubService {
  private readonly baseUrl = 'https://api.github.com';

  private getHeaders() {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (config.github.token) {
      headers.Authorization = `Bearer ${config.github.token}`;
    }
    return headers;
  }

  async getTrending(params: TrendingParams): Promise<Repository[]> {
    const cacheKey = `trending:${JSON.stringify(params)}`;
    const cached = cache.get<Repository[]>(cacheKey);
    if (cached) return cached;

    try {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      const since = date.toISOString().split('T')[0];

      let q = `created:>${since}`;
      if (params.language) {
        q += ` language:${params.language}`;
      }
      if (params.query) {
        q += ` ${params.query}`;
      }

      const response = await axios.get(`${this.baseUrl}/search/repositories`, {
        headers: this.getHeaders(),
        params: {
          q,
          sort: params.sort || 'stars',
          order: params.order || 'desc',
          per_page: 30,
        },
      });

      const repos: Repository[] = response.data.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        fullName: item.full_name,
        owner: item.owner.login,
        ownerAvatar: item.owner.avatar_url,
        description: item.description,
        language: item.language,
        stars: item.stargazers_count,
        starsToday: null,
        forks: item.forks_count,
        url: item.html_url,
        updatedAt: item.updated_at,
        createdAt: item.created_at,
      }));

      cache.set(cacheKey, repos);
      return repos;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new AppError(429, 'GitHub API rate limit exceeded. Try again later.');
      }
      throw new AppError(502, 'Failed to fetch trending repositories');
    }
  }
}

export const githubService = new GithubService();
