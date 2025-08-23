import { subtitleApp } from "@/lib/modules/video_processing/applications/subtitle_app";

interface SubtitleJob {
  taskId: number;
  videoId: number;
  priority: "high" | "normal" | "low";
  createdAt: Date;
  retries: number;
}

class SubtitleQueue {
  private queue: SubtitleJob[] = [];
  private processing = false;
  private maxRetries = 3;

  async addJob(taskId: number, videoId: number, priority: "high" | "normal" | "low" = "normal") {
    const job: SubtitleJob = {
      taskId,
      videoId,
      priority,
      createdAt: new Date(),
      retries: 0,
    };

    // Insert based on priority
    if (priority === "high") {
      this.queue.unshift(job);
    } else {
      this.queue.push(job);
    }

    console.log(`📋 Added subtitle job for task ${taskId}, queue length: ${this.queue.length}`);

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    console.log(`🔄 Starting subtitle queue processing, ${this.queue.length} jobs pending`);

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;

      try {
        console.log(`🎬 Processing subtitle job for task ${job.taskId}...`);
        const startTime = Date.now();

        await subtitleApp.generateVietnameseSubtitle(job.taskId);

        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Subtitle generation completed for task ${job.taskId} in ${duration.toFixed(2)}s`);
      } catch (error) {
        console.error(`❌ Subtitle generation failed for task ${job.taskId}:`, error);

        // Retry logic
        if (job.retries < this.maxRetries) {
          job.retries++;
          this.queue.push(job); // Add back to end of queue
          console.log(`🔄 Retrying subtitle job for task ${job.taskId} (attempt ${job.retries}/${this.maxRetries})`);
        } else {
          console.error(`💀 Subtitle job for task ${job.taskId} failed after ${this.maxRetries} retries`);
        }
      }

      // Small delay to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.processing = false;
    console.log(`✅ Subtitle queue processing completed`);
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      jobs: this.queue.map((job) => ({
        taskId: job.taskId,
        priority: job.priority,
        retries: job.retries,
        createdAt: job.createdAt,
      })),
    };
  }
}

// Singleton instance
export const subtitleQueue = new SubtitleQueue();
