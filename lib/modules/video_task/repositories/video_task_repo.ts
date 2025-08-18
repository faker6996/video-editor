import { baseRepo } from "@/lib/modules/common/base_repo";
import { VideoTask, Video } from "@/lib/models";
import { safeQuery } from "@/lib/modules/common/safe_query";

export const videoTaskRepo = {
  async createTask(userId: number, title: string, description?: string): Promise<VideoTask> {
    const vt = new VideoTask({ user_id: userId, title, description, status: 'draft' });
    return baseRepo.insert<VideoTask>(vt);
  },

  async listTasksByUser(userId: number): Promise<VideoTask[]> {
    return baseRepo.findManyByFields<VideoTask>(VideoTask, { user_id: userId }, {
      orderBy: ['created_at'],
      allowedOrderFields: ['id', 'created_at']
    });
  },

  async addVideoToTask(taskId: number, userId: number, payload: Partial<Video>): Promise<Video> {
    const v = new Video({ ...payload, task_id: taskId, user_id: userId });
    return baseRepo.insert<Video>(v);
  },

  async listVideosForTask(taskId: number): Promise<Video[]> {
    return baseRepo.findManyByFields<Video>(Video, { task_id: taskId }, {
      orderBy: ['created_at'],
      allowedOrderFields: ['id', 'created_at']
    });
  },

  async getTaskById(taskId: number): Promise<VideoTask | null> {
    return baseRepo.getById<VideoTask>(VideoTask, taskId);
  },

  async updateTask(task: Partial<VideoTask> & { id: number }): Promise<VideoTask | null> {
    return baseRepo.update<VideoTask>(new VideoTask(task));
  },

  async getVideoById(videoId: number): Promise<Video | null> {
    return baseRepo.getById<Video>(Video, videoId);
  },

  async deleteVideo(videoId: number): Promise<void> {
    await baseRepo.deleteById<Video>(Video, videoId);
  },

  async setPrimaryVideo(videoId: number): Promise<void> {
    const video = await this.getVideoById(videoId);
    if (!video?.task_id) return;
    // Reset others
    await safeQuery(`UPDATE ${Video.table} SET is_primary = false WHERE task_id = $1`, [video.task_id]);
    // Set selected
    await safeQuery(`UPDATE ${Video.table} SET is_primary = true WHERE id = $1`, [videoId]);
  },
};
