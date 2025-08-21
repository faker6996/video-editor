"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Calendar, PlayCircle, Clock, CheckCircle, AlertCircle, Eye, Trash2, Edit } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { Badge, StatusBadge, NotificationBadge } from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import { Tooltip } from "@/components/ui/Tooltip";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { useLocale } from "@/lib/hooks/useLocale";
import { useTranslations } from "next-intl";
import { Combobox } from "@/components/ui/Combobox";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const locale = useLocale();
  const t = useTranslations("Common");

  // Stats calculation with enhanced progress
  const stats = {
    total: tasks.length,
    draft: tasks.filter((task) => task.status === "draft").length,
    processing: tasks.filter((task) => task.status === "processing").length,
    completed: tasks.filter((task) => task.status === "completed").length,
    completionRate: tasks.length > 0 ? (tasks.filter((task) => task.status === "completed").length / tasks.length) * 100 : 0,
  };

  const load = () => {
    callApi<VideoTask[]>(API_ROUTES.VIDEO_TASKS.LIST, "GET", undefined, { silent: true })
      .then((res) => setTasks(res || []))
      .catch(() => setTasks([]));
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await callApi(API_ROUTES.VIDEO_TASKS.LIST, "POST", { title, description });
      setTitle("");
      setDescription("");
      setShowCreateForm(false);
      load();
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "processing":
        return <Clock className="w-4 h-4 text-warning" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <PlayCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <StatusBadge status="online" size="sm">
            {t("completed")}
          </StatusBadge>
        );
      case "processing":
        return (
          <StatusBadge status="away" size="sm" pulse>
            {t("processing")}
          </StatusBadge>
        );
      case "failed":
        return (
          <StatusBadge status="busy" size="sm">
            {t("failed")}
          </StatusBadge>
        );
      default:
        return (
          <StatusBadge status="idle" size="sm">
            {t("draft")}
          </StatusBadge>
        );
    }
  };

  // Status options for Combobox
  const statusOptions = [t("allStatus"), t("draft"), t("processing"), t("completed"), t("failed")];

  const statusValues = ["all", "draft", "processing", "completed", "failed"];

  const handleStatusChange = (value: string) => {
    const index = statusOptions.indexOf(value);
    const statusValue = index >= 0 ? statusValues[index] : "all";
    setSelectedStatus(statusValue);
  };

  const getCurrentStatusLabel = () => {
    const index = statusValues.indexOf(selectedStatus);
    return index >= 0 ? statusOptions[index] : statusOptions[0];
  };

  // Filter tasks based on search and status
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header with enhanced styling */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            {t("videoProjects")}
            {tasks.length > 0 && (
              <NotificationBadge count={stats.total} variant="primary">
                <span></span>
              </NotificationBadge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">{t("manageVideoProjects")}</p>
          {stats.total > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <Progress value={stats.completionRate} variant="success" size="sm" className="w-32" />
              <Badge variant="outline" size="xs">
                {Math.round(stats.completionRate)}% {t("complete")}
              </Badge>
            </div>
          )}
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4" />
          {t("newProject")}
        </Button>
      </div>

      {/* Enhanced Stats Cards with beautiful badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <PlayCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("totalProjects")}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
            {stats.total > 10 && (
              <Badge variant="gradient" size="xs">
                {t("proUser")}!
              </Badge>
            )}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("processing")}</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
            {stats.processing > 0 && (
              <Badge variant="warning" size="xs" pulse>
                {t("active")}
              </Badge>
            )}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("completed")}</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
            {stats.completed > 0 && (
              <Badge variant="success" size="xs">
                ✓ {t("done")}
              </Badge>
            )}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <Edit className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("draft")}</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
            {stats.draft > 0 && (
              <Badge variant="outline" size="xs">
                {t("pending")}
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("createNewProject")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder={t("projectTitle")} value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder={t("projectDescription")} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button onClick={onCreate} disabled={loading || !title.trim()} variant="primary" className="gap-2">
                {loading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {loading ? t("creating") : t("createProject")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setTitle("");
                  setDescription("");
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("searchProjects")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="min-w-[150px]">
              <Combobox
                options={statusOptions}
                value={getCurrentStatusLabel()}
                onChange={handleStatusChange}
                placeholder={t("allStatus")}
                searchPlaceholder={t("search")}
                emptyText={t("noProjectsFound")}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {t("projects")}
            {filteredTasks.length !== tasks.length && (
              <Badge variant="info" size="sm">
                {filteredTasks.length} {t("of")} {tasks.length}
              </Badge>
            )}
          </h2>
          {stats.completionRate > 0 && (
            <Progress
              value={stats.completionRate}
              variant={stats.completionRate >= 80 ? "success" : stats.completionRate >= 50 ? "warning" : "primary"}
              size="sm"
              className="w-24"
            />
          )}
        </div>

        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="p-6 hover:shadow-lg transition-all duration-200 group">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip content={t("editProject")}>
                        <Button variant="ghost" size="sm" className="p-2">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content={t("deleteProject")}>
                        <Button variant="ghost" size="sm" className="p-2 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                      {task.title}
                      {task.status === "processing" && (
                        <Badge variant="warning" size="xs" pulse>
                          🔄
                        </Badge>
                      )}
                    </h3>
                    {task.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                  </div>

                  {task.created_at && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                      <Badge variant="ghost" size="xs">
                        {new Date(task.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link href={`/${locale}/video-tasks/${task.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Eye className="w-4 h-4" />
                        {t("viewDetails")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                <PlayCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">{t("noProjectsFound")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || selectedStatus !== "all" ? t("adjustFiltersOrSearch") : t("createFirstProject")}
                </p>
              </div>
              {!searchQuery && selectedStatus === "all" && (
                <Button variant="primary" className="gap-2 mt-4" onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4" />
                  {t("createFirstVideoProject")}
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
