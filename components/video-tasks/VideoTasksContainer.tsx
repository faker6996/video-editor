"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useTranslations } from "next-intl";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";

interface VideoTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  created_at?: string;
}

export default function VideoTasksContainer() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Common");

  const load = () => {
    callApi<VideoTask[]>(API_ROUTES.VIDEO_TASKS.LIST, "GET", undefined, { silent: true })
      .then((res) => setTasks(res || []))
      .catch(() => setTasks([]));
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await callApi(API_ROUTES.VIDEO_TASKS.LIST, "POST", { title, description });
      setTitle("");
      setDescription("");
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("videoTasksTitle")}</h1>
      <div className="rounded-lg border p-5 bg-card space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder={t("taskTitle") || "Title"} value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder={t("descriptionOptional") || "Description (optional)"} value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={onCreate} disabled={loading}>{loading ? t("creating") : t("createTask")}</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((t) => (
          <a href={`./video-tasks/${t.id}`} key={t.id} className="rounded-lg border p-5 bg-card block hover:bg-accent/40">
            <div className="font-medium text-lg">{t.title}</div>
            {t.description && <div className="text-sm text-muted-foreground mt-1">{t.description}</div>}
            <div className="text-xs text-muted-foreground mt-2">Status: {t.status}</div>
            {t.created_at && <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>}
          </a>
        ))}
        {!tasks.length && (
          <div className="text-sm text-muted-foreground">{t("noTasks")}</div>
        )}
      </div>
    </div>
  );
}
