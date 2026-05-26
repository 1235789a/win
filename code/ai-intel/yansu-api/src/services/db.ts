// Mock DB service - implement with your actual PostgreSQL/Redis

const inMemoryWorkflows = new Map();

export async function saveWorkflowResult(workflowId: string, data: any) {
  inMemoryWorkflows.set(workflowId, {
    ...data,
    updated_at: new Date().toISOString()
  });
  console.log(`Saved workflow ${workflowId} with status:`, data.status);
}

export async function getWorkflowStatus(workflowId: string) {
  return inMemoryWorkflows.get(workflowId) || null;
}
