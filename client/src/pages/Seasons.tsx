import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Seasons() {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: seasons, isLoading } = trpc.seasons.list.useQuery();
  
  const createMutation = trpc.seasons.create.useMutation({
    onSuccess: () => {
      utils.seasons.list.invalidate();
      utils.seasons.getActive.invalidate();
      setDialogOpen(false);
      toast.success("Season created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create season: " + error.message);
    },
  });

  const setActiveMutation = trpc.seasons.setActive.useMutation({
    onSuccess: () => {
      utils.seasons.list.invalidate();
      utils.seasons.getActive.invalidate();
      toast.success("Active season updated");
    },
    onError: (error) => {
      toast.error("Failed to set active season: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      notes: formData.get("notes") as string || undefined,
    };

    createMutation.mutate(data);
  };

  const handleSetActive = (id: string) => {
    setActiveMutation.mutate({ id });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Seasons</h1>
            <p className="text-muted-foreground mt-2">
              Manage hockey seasons and track development over time
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Season
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Season</DialogTitle>
                  <DialogDescription>
                    Create a new season to track player development
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Season Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="e.g., 2024-2025 Season"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Additional notes about this season"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Create Season
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Seasons List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading seasons...</div>
        ) : seasons && seasons.length > 0 ? (
          <div className="grid gap-4">
            {seasons.map((season) => (
              <Card key={season.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{season.name}</CardTitle>
                        {season.isActive && (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            Active
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {!season.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(season.id)}
                        disabled={setActiveMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Set Active
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {season.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{season.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No seasons yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first season to start tracking player development
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Season
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

