import { AgentId, AgentProgress, WorkflowJob } from '../../types.js';
import { memory } from '../memory.js';
import { logInfo, logWarn, logError } from '../config.js';

export abstract class BaseAgent {
  public abstract readonly id: AgentId;
  public abstract readonly name: string;
  public abstract readonly role: string;

  /**
   * Main execution method to be implemented by each specialized agent
   */
  public abstract run(job: WorkflowJob): Promise<any>;

  protected updateProgress(jobId: string, progress: number, message: string, details?: Record<string, any>) {
    memory.updateAgentProgress(jobId, this.id, {
      status: 'running',
      progress,
      message,
      details,
    });
  }

  protected complete(jobId: string, message: string, details?: Record<string, any>) {
    memory.updateAgentProgress(jobId, this.id, {
      status: 'completed',
      progress: 100,
      message,
      completedAt: Date.now(),
      details,
    });
    this.log(jobId, message, 'success');
  }

  protected fail(jobId: string, error: string) {
    memory.updateAgentProgress(jobId, this.id, {
      status: 'failed',
      message: `Failed: ${error}`,
      error,
    });
    this.log(jobId, `Agent failed: ${error}`, 'error');
  }

  protected log(jobId: string, message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    memory.addLog(jobId, `[${this.name}] ${message}`, level, this.id);
    if (level === 'error') {
      logError(this.name, message);
    } else if (level === 'warn') {
      logWarn(this.name, message);
    } else {
      logInfo(this.name, message);
    }
  }

  /**
   * Safe execution wrapper with timing and error handling
   */
  public async execute(job: WorkflowJob): Promise<any> {
    memory.updateAgentProgress(job.id, this.id, {
      status: 'running',
      progress: 5,
      message: `Agent ${this.name} started...`,
      startedAt: Date.now(),
    });
    this.log(job.id, `Starting execution for topic: "${job.topic}"`, 'info');

    try {
      const result = await this.run(job);
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      this.fail(job.id, errorMessage);
      throw err;
    }
  }
}
