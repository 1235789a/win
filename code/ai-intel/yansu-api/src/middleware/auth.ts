import express from 'express';
import jwt from 'jsonwebtoken';
import { getUserByApiKey } from '../services/user';

export interface AuthRequest extends express.Request {
  user?: {
    id: string;
    apiKeyId: string;
  };
}

export const authenticate = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authorization header is required'
      });
    }

    const apiKey = authHeader.slice(7); // Remove "Bearer "

    // Verify API key
    const user = await getUserByApiKey(apiKey);

    if (!user) {
      return res.status(401).json({
        error: 'invalid_api_key',
        message: 'Invalid API key'
      });
    }

    req.user = {
      id: user.id,
      apiKeyId: apiKey
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication failed'
    });
  }
};
