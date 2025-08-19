"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Upload,
  Download,
  Settings,
  Layers,
  Volume2,
  Scissors,
  Palette,
  Type,
  Image as ImageIcon,
  Crown,
  Zap,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { callApi } from "@/lib/utils/api-client";
import { API_ROUTES } from "@/lib/constants/api-routes";

// Badge component
const Badge = ({ children, variant = "secondary", className = "" }: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "secondary" | "primary" | "premium";
  className?: string;
}) => {
  const variants = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    secondary: "bg-muted text-muted-foreground border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    premium: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default function EditorContainer() {
  const [role, setRole] = useState<string>("standard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callApi<{ role: string }>(API_ROUTES.ME.ROLE, "GET", undefined, { silent: true })
      .then((res) => {
        setRole((res as any)?.role || "standard");
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const isVip = role === "vip" || role === "admin";

  const editorFeatures = [
    {
      title: "Video Trimming",
      description: "Cut and trim your videos with precision",
      icon: Scissors,
      available: true,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Audio Controls",
      description: "Adjust volume, add music and sound effects",
      icon: Volume2,
      available: true,
      color: "bg-success/10 text-success",
    },
    {
      title: "Text Overlay",
      description: "Add titles, captions and custom text",
      icon: Type,
      available: isVip,
      color: "bg-info/10 text-info",
    },
    {
      title: "Filters & Effects",
      description: "Apply stunning visual effects and filters",
      icon: Palette,
      available: isVip,
      color: "bg-warning/10 text-warning",
    },
    {
      title: "Multi-layer Editing",
      description: "Work with multiple video and audio tracks",
      icon: Layers,
      available: isVip,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      title: "Image Overlay",
      description: "Add logos, watermarks and images",
      icon: ImageIcon,
      available: isVip,
      color: "bg-pink-500/10 text-pink-600",
    },
  ];

  const quickActions = [
    {
      title: "Upload Video",
      description: "Start by uploading your video file",
      icon: Upload,
      action: () => {},
      variant: "primary" as const,
    },
    {
      title: "Load Project",
      description: "Continue working on existing project",
      icon: Play,
      action: () => {},
      variant: "outline" as const,
    },
    {
      title: "Settings",
      description: "Configure editor preferences",
      icon: Settings,
      action: () => {},
      variant: "outline" as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Play className="w-8 h-8 text-primary" />
            Video Editor
          </h1>
          <p className="text-muted-foreground mt-1">Professional video editing tools at your fingertips</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isVip ? "premium" : "secondary"}>{isVip ? "VIP User" : "Standard User"}</Badge>
          {!isVip && (
            <Link href="../plans">
              <Button variant="primary" className="gap-2">
                <Crown className="w-4 h-4" />
                Upgrade to VIP
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* VIP Upgrade Banner - only show for standard users */}
      {!isVip && (
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Unlock Premium Features</h3>
              <p className="text-muted-foreground mt-1">Upgrade to VIP to access advanced editing tools, effects, and unlimited exports</p>
            </div>
            <Link href="../plans">
              <Button variant="primary" className="gap-2">
                <Sparkles className="w-4 h-4" />
                View Plans
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                </div>
                <Button variant={action.variant} size="sm" className="w-full">
                  {action.title}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Editor Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editorFeatures.map((feature, index) => (
            <Card
              key={index}
              className={`p-6 transition-all duration-200 ${feature.available ? "hover:shadow-lg cursor-pointer" : "opacity-75 border-dashed"}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 ${feature.color} rounded-lg`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  {!feature.available && <Lock className="w-4 h-4 text-muted-foreground" />}
                </div>

                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {feature.title}
                    {!feature.available && <Badge variant="secondary">VIP Only</Badge>}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>

                {feature.available ? (
                  <Button variant="outline" size="sm" className="w-full">
                    Use Feature
                  </Button>
                ) : (
                  <Link href="../plans" className="block">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Crown className="w-3 h-3" />
                      Upgrade to Unlock
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Editor Workspace Placeholder */}
      <Card className="p-12">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Editor Workspace</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The video editing interface will be available here. Upload a video or load an existing project to get started.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="primary" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Video
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Load Project
            </Button>
          </div>
        </div>
      </Card>

      {/* Tips Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Pro Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Keyboard Shortcuts</h4>
            <p className="text-sm text-muted-foreground">Use Space to play/pause, J/K/L for timeline navigation</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">File Formats</h4>
            <p className="text-sm text-muted-foreground">Support for MP4, MOV, AVI, and more video formats</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Export Quality</h4>
            <p className="text-sm text-muted-foreground">Export in HD, Full HD, or 4K resolution (VIP only)</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Auto-Save</h4>
            <p className="text-sm text-muted-foreground">Your projects are automatically saved every 5 minutes</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
