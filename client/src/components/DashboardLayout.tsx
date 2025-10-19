import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Calendar, Video, BarChart3, Activity } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Users, label: "Players", path: "/players" },
  { icon: Calendar, label: "Seasons", path: "/seasons" },
  { icon: Video, label: "Videos", path: "/videos" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-background/95 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full relative z-10">
          <div className="flex flex-col items-center gap-6">
            {/* Logo with glow effect */}
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all duration-500" />
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-24 w-24 rounded-2xl object-cover shadow-2xl ring-2 ring-primary/20"
                />
              </div>
            </div>
            
            {/* Title with gradient */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-bold tracking-tight gradient-text">
                {APP_TITLE}
              </h1>
              <p className="text-muted-foreground">
                AI-Powered Player Development
              </p>
            </div>
          </div>
          
          {/* Modern sign-in button */}
          <Button
            onClick={() => {
              const loginUrl = getLoginUrl();
              if (loginUrl) {
                window.location.href = loginUrl;
              } else {
                alert("OAuth is not configured. Please contact the administrator.");
              }
            }}
            size="lg"
            className="w-full shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 glow-primary"
          >
            Sign in to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <ModernSidebar width={sidebarWidth} onWidthChange={setSidebarWidth} />
      <SidebarInset className="bg-background/50">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-card/80 backdrop-blur-xl px-4">
          <SidebarTrigger className="hover:bg-accent/50 transition-colors" />
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Live</span>
            </div>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ModernSidebar({
  width,
  onWidthChange,
}: {
  width: number;
  onWidthChange: (width: number) => void;
}) {
  const [location] = useLocation();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  return (
    <Sidebar ref={sidebarRef} collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      {/* Resize handle */}
      {!isMobile && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-primary/50 cursor-col-resize transition-all z-50"
          onMouseDown={() => setIsResizing(true)}
        />
      )}

      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
            <img
              src={APP_LOGO}
              alt={APP_TITLE}
              className="relative h-10 w-10 rounded-lg object-cover ring-1 ring-primary/30"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm gradient-text">{APP_TITLE}</span>
            <span className="text-xs text-muted-foreground">Development Hub</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = location === item.path;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={`
                    transition-all duration-200 
                    ${isActive 
                      ? 'bg-primary/15 text-primary hover:bg-primary/20 shadow-sm glow-primary' 
                      : 'hover:bg-accent/50'
                    }
                  `}
                >
                  <a href={item.path} className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { open } = useSidebar();

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 hover:bg-accent/50 transition-colors"
        >
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-card">
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

