import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { useState } from "react";
import { notify, notifications } from "@/lib/notifications";
import { Link } from "wouter";

export default function Players() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  
  const utils = trpc.useUtils();
  const { data: players, isLoading } = trpc.players.list.useQuery();
  
  const createMutation = trpc.players.create.useMutation({
    onSuccess: () => {
      utils.players.list.invalidate();
      utils.players.listActive.invalidate();
      setDialogOpen(false);
      const playerName = players?.find(p => p.id)?.name || "Player";
      notifications.playerAdded(playerName);
    },
    onError: (error) => {
      notify.error("Failed to create player", error.message);
    },
  });

  const updateMutation = trpc.players.update.useMutation({
    onSuccess: () => {
      utils.players.list.invalidate();
      utils.players.listActive.invalidate();
      setDialogOpen(false);
      setEditingPlayer(null);
      notifications.playerUpdated(editingPlayer?.name || "Player");
    },
    onError: (error) => {
      notify.error("Failed to update player", error.message);
    },
  });

  const deleteMutation = trpc.players.delete.useMutation({
    onSuccess: () => {
      utils.players.list.invalidate();
      utils.players.listActive.invalidate();
      notify.success("Player deleted", "Player has been removed from the roster");
    },
    onError: (error) => {
      notify.error("Failed to delete player", error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      jerseyNumber: formData.get("jerseyNumber") ? parseInt(formData.get("jerseyNumber") as string) : undefined,
      position: formData.get("position") as string || undefined,
      dateOfBirth: formData.get("dateOfBirth") ? new Date(formData.get("dateOfBirth") as string) : undefined,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      notes: formData.get("notes") as string || undefined,
      isActive: formData.get("isActive") === "true",
    };

    if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (player: any) => {
    setEditingPlayer(player);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this player?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Players</h1>
            <p className="text-muted-foreground mt-2">
              Manage your hockey organization's player roster
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingPlayer(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
                  <DialogDescription>
                    {editingPlayer ? "Update player information" : "Add a new player to your roster"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingPlayer?.name}
                      required
                      placeholder="Player's full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="jerseyNumber">Jersey Number</Label>
                      <Input
                        id="jerseyNumber"
                        name="jerseyNumber"
                        type="number"
                        defaultValue={editingPlayer?.jerseyNumber}
                        placeholder="00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="position">Position</Label>
                      <Select name="position" defaultValue={editingPlayer?.position || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Forward">Forward</SelectItem>
                          <SelectItem value="Defense">Defense</SelectItem>
                          <SelectItem value="Goalie">Goalie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      defaultValue={editingPlayer?.dateOfBirth ? new Date(editingPlayer.dateOfBirth).toISOString().split('T')[0] : ""}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={editingPlayer?.email}
                      placeholder="player@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={editingPlayer?.phone}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      defaultValue={editingPlayer?.notes}
                      placeholder="Additional notes about the player"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="isActive">Status</Label>
                    <Select name="isActive" defaultValue={editingPlayer?.isActive !== false ? "true" : "false"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingPlayer ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Players Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading players...</div>
        ) : players && players.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <Card key={player.id} className={!player.isActive ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          <Link href={`/players/${player.id}`}>
                            <a className="hover:underline">{player.name}</a>
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          {player.position || "No position"} {player.jerseyNumber ? `• #${player.jerseyNumber}` : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {player.email && (
                      <p className="text-muted-foreground truncate">{player.email}</p>
                    )}
                    {player.phone && (
                      <p className="text-muted-foreground">{player.phone}</p>
                    )}
                    {player.dateOfBirth && (
                      <p className="text-muted-foreground">
                        Born: {new Date(player.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(player)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(player.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No players yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by adding your first player to the roster
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Player
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

