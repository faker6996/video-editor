"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Form, FormSubmitButton } from "@/components/ui/Form";
import { useTranslations } from "next-intl";
import VideoPlayer from "@/components/video/VideoPlayer";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { Combobox } from "@/components/ui/Combobox";

interface Video {
  id: number;
  source_url?: string;
  filename?: string;
  format?: string;
  duration_seconds?: number;
  is_primary?: boolean;
  created_at?: string;
}

export default function VideoTaskDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const t = useTranslations("Common");
  const [meta, setMeta] = useState<{ title?: string; description?: string; status?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [subtitleUrl, setSubtitleUrl] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [videos, setVideos] = useState<Video[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    // Load videos
    callApi<any[]>(API_ROUTES.VIDEO_TASKS.VIDEOS(id as string), "GET", undefined, { silent: true })
      .then((arr) => {
        setVideos(arr);
        const primary = arr.find((v: any) => v.is_primary) || arr[0];
        if (primary) {
          setVideoUrl(primary.storage_path ? `/api/uploads${primary.storage_path}` : primary.source_url);
        }
      })
      .catch(() => setVideos([]));

    // Load task metadata
    callApi(API_ROUTES.VIDEO_TASKS.DETAIL(id as string), "GET", undefined, { silent: true })
      .then((res) => setMeta((res as any) || null))
      .catch(() => setMeta(null));
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const onAdd = async () => {
    if (!id || !sourceUrl.trim()) return;
    setLoading(true);
    try {
      await callApi(API_ROUTES.VIDEO_TASKS.VIDEOS(id as string), "POST", { source_url: sourceUrl, filename });
      setSourceUrl("");
      setFilename("");
      load();
    } finally {
      setLoading(false);
    }
  };

  const handleFileSubmit = async (values: { file: File }) => {
    if (!values.file || !id) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("file", values.file);
      const up: any = await callApi(API_ROUTES.UPLOAD.VIDEO, "POST", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { storage_path, filename: fn } = up || {};
      if (storage_path) {
        await callApi(API_ROUTES.VIDEO_TASKS.VIDEOS(id as string), "POST", {
          storage_path: storage_path,
          filename: fn,
        });
        load();
      }
    } finally {
      setLoading(false);
    }
  };

  // Status options for Combobox
  const statusOptions = [t("draft"), t("processing"), t("completed"), t("failed")];

  const statusValues = ["draft", "processing", "completed", "failed"];

  const handleStatusChange = (value: string) => {
    const index = statusOptions.indexOf(value);
    const statusValue = index >= 0 ? statusValues[index] : "draft";
    setMeta({ ...(meta || {}), status: statusValue });
  };

  const getCurrentStatusLabel = () => {
    const currentStatus = meta?.status || "draft";
    const index = statusValues.indexOf(currentStatus);
    return index >= 0 ? statusOptions[index] : statusOptions[0];
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Task #{id}</h1>

      {/* Task Meta */}
      <div className="rounded-lg border p-5 bg-card space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder={t("taskTitle") || "Title"}
            value={meta?.title || ""}
            onChange={(e) => setMeta({ ...(meta || {}), title: e.target.value })}
          />
          <Input
            placeholder={t("descriptionOptional") || "Description (optional)"}
            value={meta?.description || ""}
            onChange={(e) => setMeta({ ...(meta || {}), description: e.target.value })}
          />
          <Combobox
            options={statusOptions}
            value={getCurrentStatusLabel()}
            onChange={handleStatusChange}
            placeholder={t("status")}
            searchPlaceholder={t("search")}
            emptyText={t("noProjectsFound")}
          />
          <Button
            disabled={saving}
            onClick={async () => {
              if (!id || !meta) return;
              setSaving(true);
              try {
                await callApi(API_ROUTES.VIDEO_TASKS.DETAIL(id as string), "PUT", {
                  title: meta.title,
                  description: meta.description,
                  status: meta.status,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? t("processing") : t("confirm")}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-5 bg-card space-y-3">
        {videoUrl && <VideoPlayer src={videoUrl} subtitleUrl={subtitleUrl} language="vi" />}
        <div className="flex gap-3">
          <Button
            onClick={async () => {
              const res: any = await callApi(API_ROUTES.VIDEO_TASKS.SUBTITLES_VI(id as string), "POST");
              const sp = res?.storage_path;
              if (sp) setSubtitleUrl(`/api/uploads${sp}`);
              load();
            }}
          >
            {t("generateSubtitlesVi") || "Generate Subtitles (VI)"}
          </Button>
          {subtitleUrl && (
            <a href={subtitleUrl} target="_blank" rel="noopener" className="inline-flex">
              <Button variant="outline">.vtt</Button>
            </a>
          )}
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const res: any = await callApi(API_ROUTES.VIDEO_TASKS.EXPORT_VI(id as string), "POST");
                const sp = res?.storage_path;
                if (sp && typeof window !== 'undefined') {
                  window.open(`/api/uploads${sp}`, '_blank');
                }
              } catch (e) {}
            }}
          >
            Export MP4 (VI)
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder={t("videoUrl") || "Video URL"} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          <Input placeholder={t("fileNameOptional") || "Filename (optional)"} value={filename} onChange={(e) => setFilename(e.target.value)} />
          <Button onClick={onAdd} disabled={loading}>
            {loading ? t("processing") : t("addVideo")}
          </Button>
        </div>

        {/* Replace HTML form with Form component */}
        <div className="mt-3">
          <Form onSubmit={handleFileSubmit} className="flex items-center gap-3">
            <input type="file" name="file" accept="video/*" className="text-sm" />
            <FormSubmitButton disabled={loading}>{loading ? t("processing") : t("addVideo")}</FormSubmitButton>
          </Form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((v) => (
          <div key={v.id} className="rounded-lg border p-5 bg-card">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm break-words">{v.source_url || v.filename}</div>
              {v.is_primary && <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">{t("primary")}</span>}
            </div>
            {v.format && <div className="text-xs text-muted-foreground mt-1">{v.format}</div>}
            {v.duration_seconds && <div className="text-xs text-muted-foreground">{v.duration_seconds}s</div>}
            {v.created_at && (
              <div className="text-[11px] text-muted-foreground mt-2">{new Date(v.created_at).toLocaleString()}</div>
            )}
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                disabled={!!v.is_primary}
                onClick={async () => {
                  await callApi(API_ROUTES.VIDEOS.PRIMARY(v.id), "POST");
                  load();
                }}
              >
                {t("setPrimary")}
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (!confirm(t("deleteConfirm") || "Delete this video?")) return;
                  await callApi(API_ROUTES.VIDEOS.ITEM(v.id), "DELETE");
                  load();
                }}
              >
                {t("delete")}
              </Button>
            </div>
          </div>
        ))}
        {!videos.length && <div className="text-sm text-muted-foreground">{t("noVideos")}</div>}
      </div>
    </div>
  );
}
