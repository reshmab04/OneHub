export interface Repository {
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

export interface AIModel {
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

export interface SyncStatus {
  connected: boolean;
  lastSync: string | null;
  provider: string;
  totalFiles: number;
  totalSize: number;
}

export interface CloudFile {
  name: string;
  path: string;
  size: number;
  contentType: string;
  lastModified: string;
}

export interface SyncHistoryEntry {
  path: string;
  action: 'upload' | 'delete';
  status: 'synced' | 'failed';
  timestamp: string;
  size?: number;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  lastUpdated?: string;
}
