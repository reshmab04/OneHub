import { Request, Response, NextFunction } from 'express';
import { githubService } from '../services/github';

export async function getTrending(req: Request, res: Response, next: NextFunction) {
  try {
    const { language, sort, order, q } = req.query;
    const data = await githubService.getTrending({
      language: language as string,
      sort: (sort as string) || 'stars',
      order: (order as string) || 'desc',
      query: q as string,
    });
    res.json({ success: true, data, lastUpdated: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
}
