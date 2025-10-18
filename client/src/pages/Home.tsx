import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, Video, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user } = useAuth();
  const { data: players } = trpc.players.listActive.useQuery();
  const { data: activeSeason } = trpc.seasons.getActive.useQuery();
  const { data: videos } = trpc.videos.list.useQuery();

  const stats = [
    {
      title: "Active Players",
      value: players?.length || 0,
      icon: Users,
      description: "Currently tracked",
      link: "/players",
    },
    {
      title: "Current Season",
      value: activeSeason?.name || "None",
      icon: Calendar,
      description: activeSeason ? "Active" : "No active season",
      link: "/seasons",
    },
    {
      title: "Total Videos",
      value: videos?.length || 0,
      icon: Video,
      description: "Uploaded for analysis",
      link: "/videos",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your hockey organization's player development and performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} href={stat.link}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to manage your hockey organization
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/players">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Players
              </Button>
            </Link>
            <Link href="/seasons">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Manage Seasons
              </Button>
            </Link>
            <Link href="/videos">
              <Button variant="outline" className="w-full justify-start">
                <Video className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </Link>
            <Link href="/videos">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Videos</CardTitle>
              <CardDescription>
                Latest uploaded footage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videos && videos.length > 0 ? (
                <div className="space-y-3">
                  {videos.slice(0, 5).map((video) => (
                    <Link key={video.id} href={`/videos/${video.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {video.videoType} • {video.recordedAt ? new Date(video.recordedAt).toLocaleDateString() : 'No date'}
                          </p>
                        </div>
                        <Video className="h-4 w-4 text-muted-foreground ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No videos uploaded yet. Upload your first video to get started!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Player Roster</CardTitle>
              <CardDescription>
                Active players in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {players && players.length > 0 ? (
                <div className="space-y-3">
                  {players.slice(0, 5).map((player) => (
                    <Link key={player.id} href={`/players/${player.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.position || 'No position'} {player.jerseyNumber ? `• #${player.jerseyNumber}` : ''}
                          </p>
                        </div>
                        <Users className="h-4 w-4 text-muted-foreground ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No players added yet. Add your first player to start tracking development!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

