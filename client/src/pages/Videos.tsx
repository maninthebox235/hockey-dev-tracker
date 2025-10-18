import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { uploadFileResumable, shouldUseResumableUpload } from "@/lib/resumableUpload";
import { Plus, Video as VideoIcon, Upload, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { notify, notifications } from "@/lib/notifications";
import { Link } from "wouter";

export default function Videos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const utils = trpc.useUtils();
  const { data: videos, isLoading } = trpc.videos.list.useQuery();
  const { data: seasons } = trpc.seasons.list.useQuery();
  
  const createMutation = trpc.videos.create.useMutation({
    onSuccess: () => {
      utils.videos.list.invalidate();
      setDialogOpen(false);
      setUploading(false);
      setUploadProgress(0);
      const videoTitle = formData.get("title") as string || "Video";
      notifications.videoUploaded(videoTitle);
    },
    onError: (error) => {
      notifications.videoUploadFailed(error.message);
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const file = formData.get("video") as File;
    if (!file || file.size === 0) {
      notify.error("No file selected", "Please select a video file to upload");
      return;
    }
    
    // Check file size (1GB limit with resumable upload)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    if (file.size > maxSize) {
      notify.error("File too large", `Maximum size is 1GB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(5);

    try {
      let uploadResult;

      // Use resumable upload for large files (>50MB), direct upload for smaller
      if (shouldUseResumableUpload(file.size)) {
        console.log('Using resumable upload for large file');
        uploadResult = await uploadFileResumable(file, (progress) => {
          // Map progress to 5-75% range
          const progressPercent = 5 + Math.round(progress.percentage * 0.7);
          setUploadProgress(progressPercent);
        });
      } else {
        // Direct upload for smaller files
        console.log('Using direct upload for small file');
        const uploadFormData = new FormData();
        uploadFormData.append("video", file);

        setUploadProgress(30);
        const uploadResponse = await fetch("/api/upload/video", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Upload failed: ${errorText}`);
        }

        uploadResult = await uploadResponse.json();
      }
      
      // Check if upload was successful
      if (!uploadResult.success) {
        throw new Error(uploadResult.message || uploadResult.error || "Upload failed");
      }
      
      setUploadProgress(75);

      // Create video record with S3 URL
      const data = {
        title: formData.get("title") as string,
        description: formData.get("description") as string || undefined,
        videoUrl: uploadResult.videoUrl,
        videoType: formData.get("videoType") as "practice" | "game" | "drill",
        recordedAt: formData.get("recordedAt") ? new Date(formData.get("recordedAt") as string) : undefined,
        seasonId: formData.get("seasonId") as string || undefined,
      };

      setUploadProgress(90);
      createMutation.mutate(data);
    } catch (error) {
      toast.error("Failed to upload video: " + (error instanceof Error ? error.message : "Unknown error"));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-500 hover:bg-yellow-600" },
      processing: { label: "Processing", className: "bg-blue-500 hover:bg-blue-600" },
      completed: { label: "Completed", className: "bg-green-500 hover:bg-green-600" },
      failed: { label: "Failed", className: "bg-red-500 hover:bg-red-600" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      practice: "Practice",
      game: "Game",
      drill: "Drill",
    };
    return <Badge variant="outline">{variants[type] || type}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
            <p className="text-muted-foreground mt-2">
              Upload and analyze hockey footage with AI-powered feedback
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            if (!uploading) {
              setDialogOpen(open);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Upload Video</DialogTitle>
                  <DialogDescription>
                    Upload hockey footage for AI-powered analysis and feedback
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="video">Video File *</Label>
                    <Input
                      id="video"
                      name="video"
                      type="file"
                      accept="video/*"
                      required
                      ref={fileInputRef}
                      disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: MP4, MOV, AVI (max 1GB)
                    </p>
                  </div>
                  {uploading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading video...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      placeholder="e.g., Practice Session - October 15"
                      disabled={uploading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Additional context about this video"
                      rows={3}
                      disabled={uploading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="videoType">Type *</Label>
                      <Select name="videoType" required disabled={uploading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="practice">Practice</SelectItem>
                          <SelectItem value="game">Game</SelectItem>
                          <SelectItem value="drill">Drill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="recordedAt">Recorded Date</Label>
                      <Input
                        id="recordedAt"
                        name="recordedAt"
                        type="date"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="seasonId">Season</Label>
                    <Select name="seasonId" disabled={uploading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select season (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons?.map((season) => (
                          <SelectItem key={season.id} value={season.id}>
                            {season.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading || createMutation.isPending}>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading videos...</div>
        ) : videos && videos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <VideoIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">
                      <Link href={`/videos/${video.id}`}>
                        <a className="hover:underline">{video.title}</a>
                      </Link>
                    </CardTitle>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {getTypeBadge(video.videoType)}
                    {getStatusBadge(video.processingStatus)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {video.description && (
                      <p className="text-muted-foreground line-clamp-2">{video.description}</p>
                    )}
                    <p className="text-muted-foreground">
                      {video.recordedAt ? new Date(video.recordedAt).toLocaleDateString() : "No date"}
                    </p>
                    <Link href={`/videos/${video.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Sparkles className="h-3 w-3 mr-2" />
                        View & Analyze
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <VideoIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Upload your first video to start analyzing player performance
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload First Video
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

