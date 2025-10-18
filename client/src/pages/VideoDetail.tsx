import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, Users, Video as VideoIcon } from "lucide-react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function VideoDetail() {
  const [, params] = useRoute("/videos/:id");
  const videoId = params?.id || "";
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  const utils = trpc.useUtils();
  const { data: video, isLoading } = trpc.videos.getById.useQuery({ id: videoId });
  const { data: feedback } = trpc.feedback.getByVideoId.useQuery({ videoId });
  const { data: players } = trpc.players.listActive.useQuery();
  const { data: videoPlayers } = trpc.videos.getPlayers.useQuery({ videoId });
  
  // Video analysis queries
  const { data: analysisProgress } = trpc.videoAnalysis.getProgress.useQuery(
    { videoId },
    { 
      refetchInterval: (query) => {
        // Only poll if analysis is in progress
        const data = query.state.data;
        if (data && (data.status === "processing" || data.status === "queued")) {
          return 2000; // Poll every 2 seconds
        }
        return false; // Stop polling
      },
      retry: 1, // Only retry once on error
      retryDelay: 1000,
    }
  );
  const { data: analysisResults } = trpc.videoAnalysis.getResults.useQuery(
    { videoId },
    { enabled: analysisProgress?.status === "completed" }
  );
  
  const startAnalysisMutation = trpc.videoAnalysis.start.useMutation({
    onSuccess: () => {
      utils.videoAnalysis.getProgress.invalidate({ videoId });
      toast.success("Video analysis started! This may take several minutes.");
    },
    onError: (error) => {
      toast.error("Failed to start analysis: " + error.message);
    },
  });

  const addPlayerMutation = trpc.videos.addPlayer.useMutation({
    onSuccess: () => {
      utils.videos.getPlayers.invalidate({ videoId });
      toast.success("Player added to video");
    },
  });

  const removePlayerMutation = trpc.videos.removePlayer.useMutation({
    onSuccess: () => {
      utils.videos.getPlayers.invalidate({ videoId });
      toast.success("Player removed from video");
    },
  });

  const handlePlayerToggle = (playerId: string, isChecked: boolean) => {
    if (isChecked) {
      addPlayerMutation.mutate({ videoId, playerId });
    } else {
      removePlayerMutation.mutate({ videoId, playerId });
    }
  };

  const generateTeamFeedbackMutation = trpc.feedback.generateTeamFeedback.useMutation({
    onSuccess: () => {
      utils.feedback.getByVideoId.invalidate({ videoId });
      setGeneratingFeedback(false);
      toast.success("Team feedback generated successfully!");
    },
    onError: (error) => {
      setGeneratingFeedback(false);
      toast.error("Failed to generate feedback: " + error.message);
    },
  });

  const generateIndividualFeedbackMutation = trpc.feedback.generateIndividualFeedback.useMutation({
    onSuccess: () => {
      utils.feedback.getByVideoId.invalidate({ videoId });
      setGeneratingFeedback(false);
      toast.success("Individual feedback generated successfully!");
    },
    onError: (error) => {
      setGeneratingFeedback(false);
      toast.error("Failed to generate feedback: " + error.message);
    },
  });

  const handleGenerateFeedback = async (type: "team" | "individual") => {
    setGeneratingFeedback(true);
    toast.info("Generating AI feedback... This may take a moment.");
    
    if (type === "team") {
      generateTeamFeedbackMutation.mutate({ videoId });
    } else {
      generateIndividualFeedbackMutation.mutate({ videoId });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">Loading video...</div>
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Video not found</h2>
          <Link href="/videos">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Videos
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const videoPlayerIds = videoPlayers?.map(vp => vp.playerId) || [];
  const teamFeedback = feedback?.filter(f => f.feedbackType === "team");
  const individualFeedback = feedback?.filter(f => f.feedbackType === "individual");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link href="/videos">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Videos
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{video.title}</h1>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{video.videoType}</Badge>
                <Badge className={
                  video.processingStatus === "completed" ? "bg-green-500" :
                  video.processingStatus === "processing" ? "bg-blue-500" :
                  video.processingStatus === "failed" ? "bg-red-500" :
                  "bg-yellow-500"
                }>
                  {video.processingStatus}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg">
                  <VideoIcon className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground ml-4">Video player placeholder</p>
                </div>
                <div className="p-6">
                  {video.description && (
                    <p className="text-muted-foreground">{video.description}</p>
                  )}
                  <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                    {video.recordedAt && (
                      <span>Recorded: {new Date(video.recordedAt).toLocaleDateString()}</span>
                    )}
                    <span>Uploaded: {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Analysis Section */}
            <Card>
              <CardHeader>
                <CardTitle>Computer Vision Analysis</CardTitle>
                <CardDescription>
                  AI-powered player tracking, pose estimation, and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!analysisProgress && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Analyze this video with AI to track player movements, detect poses, and generate comprehensive performance metrics.
                    </p>
                    <Button
                      onClick={() => startAnalysisMutation.mutate({ videoId })}
                      disabled={startAnalysisMutation.isPending}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {startAnalysisMutation.isPending ? "Starting Analysis..." : "Start Video Analysis"}
                    </Button>
                  </div>
                )}

                {analysisProgress && analysisProgress.status === "queued" && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Analysis queued...</p>
                  </div>
                )}

                {analysisProgress && analysisProgress.status === "processing" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Analyzing video...</span>
                      <span className="text-sm text-muted-foreground">
                        {analysisProgress.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${analysisProgress.progress}%` }}
                      />
                    </div>
                    {analysisProgress.currentFrame && analysisProgress.totalFrames && (
                      <p className="text-sm text-muted-foreground text-center">
                        Processing frame {analysisProgress.currentFrame.toLocaleString()} of {analysisProgress.totalFrames.toLocaleString()}
                      </p>
                    )}
                    {analysisProgress.message && (
                      <p className="text-sm text-muted-foreground text-center italic">
                        {analysisProgress.message}
                      </p>
                    )}
                  </div>
                )}

                {analysisProgress && analysisProgress.status === "completed" && analysisResults && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Players Detected</p>
                        <p className="text-3xl font-bold">{analysisResults.summary.totalPlayers}</p>
                      </div>
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Avg Speed</p>
                        <p className="text-3xl font-bold">{analysisResults.summary.averageSpeed} <span className="text-lg">km/h</span></p>
                      </div>
                      <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Distance</p>
                        <p className="text-3xl font-bold">{analysisResults.summary.totalDistance} <span className="text-lg">m</span></p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Player Tracking Data</h4>
                      {analysisResults.playerTracking && analysisResults.playerTracking.length > 0 ? (
                        analysisResults.playerTracking.map((player: any) => (
                          <div key={player.trackId} className="p-4 border rounded-lg space-y-2">
                            <p className="font-medium">Player Track #{player.trackId}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground block">Distance</span>
                                <span className="font-semibold">{player.metrics.totalDistance}m</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Avg Speed</span>
                                <span className="font-semibold">{player.metrics.averageSpeed} km/h</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Max Speed</span>
                                <span className="font-semibold">{player.metrics.maxSpeed} km/h</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Time on Ice</span>
                                <span className="font-semibold">{player.metrics.timeOnIce}s</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No player tracking data available</p>
                      )}
                    </div>
                  </div>
                )}

                {analysisProgress && analysisProgress.status === "failed" && (
                  <div className="text-center py-8">
                    <p className="text-destructive mb-2 font-medium">Analysis Failed</p>
                    <p className="text-muted-foreground text-sm mb-4">
                      {analysisProgress.message || "An error occurred during video analysis"}
                    </p>
                    <Button
                      onClick={() => startAnalysisMutation.mutate({ videoId })}
                      variant="outline"
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Retry Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback Section */}
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Feedback</CardTitle>
                <CardDescription>
                  Generate insights and recommendations based on video analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="team">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="team">Team Feedback</TabsTrigger>
                    <TabsTrigger value="individual">Individual Feedback</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="team" className="space-y-4">
                    <Button 
                      onClick={() => handleGenerateFeedback("team")}
                      disabled={generatingFeedback}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {generatingFeedback ? "Generating..." : "Generate Team Feedback"}
                    </Button>
                    
                    {teamFeedback && teamFeedback.length > 0 ? (
                      <div className="space-y-4">
                        {teamFeedback.map((fb) => (
                          <Card key={fb.id}>
                            <CardContent className="pt-6 space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm text-green-600 mb-1">What Went Well</h4>
                                <p className="text-sm">{fb.whatWentWell}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-orange-600 mb-1">Areas for Improvement</h4>
                                <p className="text-sm">{fb.areasForImprovement}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-blue-600 mb-1">Recommended Drills</h4>
                                <p className="text-sm">{fb.recommendedDrills}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No team feedback generated yet. Click the button above to generate AI-powered insights.
                      </p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="individual" className="space-y-4">
                    <Button 
                      onClick={() => handleGenerateFeedback("individual")}
                      disabled={generatingFeedback || videoPlayerIds.length === 0}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {generatingFeedback ? "Generating..." : "Generate Individual Feedback"}
                    </Button>
                    
                    {videoPlayerIds.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Add players to this video first to generate individual feedback
                      </p>
                    )}
                    
                    {individualFeedback && individualFeedback.length > 0 ? (
                      <div className="space-y-4">
                        {individualFeedback.map((fb) => {
                          const player = players?.find(p => p.id === fb.playerId);
                          return (
                            <Card key={fb.id}>
                              <CardHeader>
                                <CardTitle className="text-base">{player?.name || "Unknown Player"}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div>
                                  <h4 className="font-semibold text-sm text-green-600 mb-1">What Went Well</h4>
                                  <p className="text-sm">{fb.whatWentWell}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-orange-600 mb-1">Areas for Improvement</h4>
                                  <p className="text-sm">{fb.areasForImprovement}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-blue-600 mb-1">Recommended Drills</h4>
                                  <p className="text-sm">{fb.recommendedDrills}</p>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No individual feedback generated yet. Click the button above to generate AI-powered insights.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Players in Video */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players in Video
                </CardTitle>
                <CardDescription>
                  Select players featured in this video
                </CardDescription>
              </CardHeader>
              <CardContent>
                {players && players.length > 0 ? (
                  <div className="space-y-3">
                    {players.map((player) => {
                      const isChecked = videoPlayerIds.includes(player.id);
                      return (
                        <div key={player.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`player-${player.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => handlePlayerToggle(player.id, checked as boolean)}
                          />
                          <Label
                            htmlFor={`player-${player.id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {player.name} {player.jerseyNumber ? `#${player.jerseyNumber}` : ""}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No players available. Add players first.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

