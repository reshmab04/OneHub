import { Request, Response, NextFunction } from 'express';
import { modelsService } from '../services/models';

export async function getModels(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, category } = req.query;
    const data = modelsService.getModels({
      query: q as string,
      category: category as string,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getModelById(req: Request, res: Response, next: NextFunction) {
  try {
    const model = modelsService.getModelById(req.params.id);
    if (!model) {
      return res.status(404).json({ success: false, error: 'Model not found' });
    }
    res.json({ success: true, data: model });
  } catch (error) {
    next(error);
  }
}
