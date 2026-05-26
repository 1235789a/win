import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - implement recording functionality later
router.post('/sessions', authenticate, (req, res) => {
  res.json({
    session_id: `ses_${Date.now()}`,
    status: 'ready_for_recording',
    expires_at: new Date(Date.now() + 3600000).toISOString()
  });
});

router.post('/sessions/:id/actions', authenticate, (req, res) => {
  res.json({ received: (req.body.actions || []).length, status: 'recording' });
});

router.post('/sessions/:id/complete', authenticate, (req, res) => {
  res.json({
    status: 'queued',
    estimated_seconds: 15,
    status_url: `${process.env.BASE_URL || 'http://localhost:3000'}/v1/recording/${req.params.id}/status`
  });
});

router.get('/sessions/:id/status', authenticate, (req, res) => {
  res.json({ status: 'queued' });
});

export default router;
