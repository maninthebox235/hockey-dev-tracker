import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, Video, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
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
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Current Season",
      value: activeSeason?.name || "None",
      icon: Calendar,
      description: activeSeason ? "Active" : "No active season",
      link: "/seasons",
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
    {
      title: "Total Videos",
      value: videos?.length || 0,
      icon: Video,
      description: "Uploaded for analysis",
      link: "/videos",
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-primary/20 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">AI-Powered Analytics</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Welcome back, <span className="gradient-text">{user?.name}</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Track player development with computer vision analysis
            </p>
          </div>
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} href={stat.link}>
                <Card className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 glass-card cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-background/50 ${stat.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {stat.description}
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions - Modern Grid */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks to manage your hockey organization
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/players">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all group"
              >
                <Users className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold">Players</div>
                  <div className="text-xs text-muted-foreground">Manage roster</div>
                </div>
              </Button>
            </Link>
            <Link href="/seasons">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-purple-400 transition-all group"
              >
                <Calendar className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold">Seasons</div>
                  <div className="text-xs text-muted-foreground">Track progress</div>
                </div>
              </Button>
            </Link>
            <Link href="/videos">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-400 transition-all group"
              >
                <Video className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold">Upload</div>
                  <div className="text-xs text-muted-foreground">Add footage</div>
                </div>
              </Button>
            </Link>
            <Link href="/videos">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-4 hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-400 transition-all group"
              >
                <TrendingUp className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold">Analytics</div>
                  <div className="text-xs text-muted-foreground">View insights</div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity - Side by Side */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-emerald-400" />
                    Recent Videos
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Latest uploaded footage
                  </CardDescription>
                </div>
                <Link href="/videos">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {videos && videos.length > 0 ? (
                <div className="space-y-2">
                  {videos.slice(0, 5).map((video) => (
                    <Link key={video.id} href={`/videos/${video.id}`}>
                      <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                            <Video className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">{video.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {video.videoType} • {video.recordedAt ? new Date(video.recordedAt).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No videos uploaded yet
                  </p>
                  <Link href="/videos">
                    <Button variant="link" className="mt-2 text-primary">
                      Upload your first video →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Player Roster
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Active players in your organization
                  </CardDescription>
                </div>
                <Link href="/players">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {players && players.length > 0 ? (
                <div className="space-y-2">
                  {players.slice(0, 5).map((player) => (
                    <Link key={player.id} href={`/players/${player.id}`}>
                      <div className="group flex items-center justify-between p-3 rounded-xl hover:bg-accent/50 border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">{player.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {player.position || 'No position'} {player.jerseyNumber ? `• #${player.jerseyNumber}` : ''}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No players added yet
                  </p>
                  <Link href="/players">
                    <Button variant="link" className="mt-2 text-primary">
                      Add your first player →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

