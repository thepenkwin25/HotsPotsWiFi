import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wifi, MapPin, Clock, Check, X, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Hotspot } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch pending hotspots for moderation
  const { data: pendingHotspots = [], isLoading: pendingLoading } = useQuery<Hotspot[]>({
    queryKey: ["/api/admin/hotspots/pending"],
    queryFn: async () => {
      const response = await fetch("/api/admin/hotspots/pending");
      if (!response.ok) throw new Error("Failed to fetch pending hotspots");
      return response.json();
    },
  });

  // Fetch all hotspots with moderation status
  const { data: allHotspots = [], isLoading: allLoading } = useQuery<Hotspot[]>({
    queryKey: ["/api/admin/hotspots/all"],
    queryFn: async () => {
      const response = await fetch("/api/admin/hotspots/all");
      if (!response.ok) throw new Error("Failed to fetch all hotspots");
      return response.json();
    },
  });

  // Approve hotspot mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/hotspots/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotspots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hotspots"] });
      toast({
        title: "Hotspot Approved",
        description: "The hotspot has been approved and is now visible to users.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve hotspot. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject hotspot mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/hotspots/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hotspots"] });
      toast({
        title: "Hotspot Rejected",
        description: "The hotspot has been rejected and will not be visible to users.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject hotspot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const HotspotCard = ({ hotspot, showActions = false }: { hotspot: Hotspot; showActions?: boolean }) => (
    <Card key={hotspot.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hotspot.isFree ? 'bg-secondary' : 'bg-accent'} text-white`}>
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{hotspot.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{hotspot.category}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hotspot.isVerified && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            <Badge className={`${getStatusColor(hotspot.moderationStatus)} text-white`}>
              {hotspot.moderationStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{hotspot.address}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Wifi className={`h-4 w-4 ${hotspot.isFree ? 'text-green-600' : 'text-orange-600'}`} />
            <span className="text-sm">
              {hotspot.isFree ? "Free WiFi" : "Paid WiFi"}
              {!hotspot.isFree && hotspot.wifiPassword && " (Password required)"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Added {hotspot.createdAt.toLocaleDateString()}</span>
          </div>

          {hotspot.description && (
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {hotspot.description}
            </p>
          )}

          {showActions && hotspot.moderationStatus === 'pending' && (
            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate(hotspot.id)}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => rejectMutation.mutate(hotspot.id)}
                disabled={rejectMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">HotsPots Admin</h1>
          <p className="text-muted-foreground">Manage WiFi hotspot submissions and moderation</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending Review ({pendingHotspots.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({allHotspots.filter(h => h.moderationStatus === 'approved').length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Hotspots ({allHotspots.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingLoading ? (
              <div className="text-center py-8">Loading pending hotspots...</div>
            ) : pendingHotspots.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-muted-foreground">No hotspots pending review</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {pendingHotspots.map(hotspot => (
                  <HotspotCard key={hotspot.id} hotspot={hotspot} showActions />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {allLoading ? (
              <div className="text-center py-8">Loading approved hotspots...</div>
            ) : (
              <div>
                {allHotspots
                  .filter(h => h.moderationStatus === 'approved')
                  .map(hotspot => (
                    <HotspotCard key={hotspot.id} hotspot={hotspot} />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {allLoading ? (
              <div className="text-center py-8">Loading all hotspots...</div>
            ) : (
              <div>
                {allHotspots.map(hotspot => (
                  <HotspotCard key={hotspot.id} hotspot={hotspot} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}