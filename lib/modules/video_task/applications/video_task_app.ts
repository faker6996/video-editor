import { videoTaskRepo } from "@/lib/modules/video_task/repositories/video_task_repo";

export const videoTaskApp = {
  createTask: videoTaskRepo.createTask,
  listTasksByUser: videoTaskRepo.listTasksByUser,
  addVideoToTask: videoTaskRepo.addVideoToTask,
};

