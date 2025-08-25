import { Router } from 'express';

export const authRouter = Router();

// Placeholder auth endpoints for Phase 2
authRouter.post('/register', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Auth endpoints will be implemented in Phase 2',
    timestamp: new Date().toISOString(),
  });
});

authRouter.post('/login', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented', 
    message: 'Auth endpoints will be implemented in Phase 2',
    timestamp: new Date().toISOString(),
  });
});

authRouter.post('/refresh', (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Auth endpoints will be implemented in Phase 2', 
    timestamp: new Date().toISOString(),
  });
});
