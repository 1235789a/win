import express from 'express';
import { authenticate } from '../middleware/auth';
import { checkCredits, deductCredits } from '../services/billing';
import { generateWorkflow } from '../services/workflowGenerator';

const router = express.Router();

/**
 * POST /v1/workflows/generate
 * Generate workflow code from description
 */
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { description, language = 'javascript', framework = 'playwright', detailed = true } = req.body;

    if (!description) {
      return res.status(400).json({
        error: 'description is required'
      });
    }

    // Check credits - 2 credits for detailed, 1 for basic
    const creditsNeeded = detailed ? 2 : 1;
    const hasCredits = await checkCredits(req.user!.id, creditsNeeded);

    if (!hasCredits) {
      return res.status(402).json({
        error: 'insufficient_credits',
        message: 'Not enough credits. Please purchase more.',
        credit_balance: await getCreditBalance(req.user!.id)
      });
    }

    // Deduct credits
    await deductCredits(req.user!.id, creditsNeeded);

    // Generate workflow (async)
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Start async generation
    generateWorkflow({
      workflowId,
      description,
      language,
      framework,
      detailed,
      userId: req.user!.id
    }).catch(console.error);

    res.json({
      workflow_id: workflowId,
      status: 'queued',
      estimated_seconds: 15,
      status_url: `${process.env.BASE_URL || 'http://localhost:3000'}/v1/workflows/${workflowId}/status`
    });

  } catch (error) {
    console.error('Generate workflow error:', error);
    res.status(500).json({
      error: 'internal_server_error',
      message: 'An unexpected error occurred'
    });
  }
});

/**
 * GET /v1/workflows/:id/status
 * Get workflow generation status
 */
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get from Redis or DB
    const workflow = await getWorkflowStatus(id);

    if (!workflow) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Workflow not found'
      });
    }

    res.json({
      status: workflow.status,
      result: workflow.result,
      error: workflow.error,
      cost: {
        credits_used: workflow.credits_used,
        credits_remaining: await getCreditBalance(req.user!.id)
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      error: 'internal_server_error',
      message: 'An unexpected error occurred'
    });
  }
});

export default router;
