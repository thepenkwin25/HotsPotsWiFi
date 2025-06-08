import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertHotspotSchema, type InsertHotspot } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";
import { Loader2, Wifi } from "lucide-react";
import { z } from "zod";

interface AddHotspotModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { latitude: number; longitude: number } | null;
}

const formSchema = insertHotspotSchema.extend({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

type FormData = z.infer<typeof formSchema>;

const categories = [
  { value: "Coffee Shop", label: "Coffee Shop" },
  { value: "Restaurant", label: "Restaurant" },
  { value: "Library", label: "Library" },
  { value: "Hotel", label: "Hotel" },
  { value: "Retail Store", label: "Retail Store" },
  { value: "Public Space", label: "Public Space" },
  { value: "Coworking Space", label: "Coworking Space" },
  { value: "Gas Station", label: "Gas Station" },
  { value: "Airport", label: "Airport" },
  { value: "Other", label: "Other" },
];

export default function AddHotspotModal({ isOpen, onClose, userLocation }: AddHotspotModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      latitude: userLocation?.latitude || 37.7749,
      longitude: userLocation?.longitude || -122.4194,
      isFree: true,
    },
  });

  const isFree = watch("isFree");

  const createHotspotMutation = useMutation({
    mutationFn: async (data: InsertHotspot) => {
      const response = await apiRequest("POST", "/api/hotspots", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotspots"] });
      toast({
        title: "Success!",
        description: "WiFi hotspot added successfully",
      });
      onClose();
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add hotspot. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating hotspot:", error);
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createHotspotMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            <span>Add WiFi Hotspot</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter business name"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Enter full address"
              className="mt-1"
            />
            {errors.address && (
              <p className="text-sm text-destructive mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={(value) => setValue("category", value)} defaultValue="">
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isFree"
              checked={isFree}
              onCheckedChange={(checked) => setValue("isFree", checked)}
            />
            <Label htmlFor="isFree">Free WiFi</Label>
          </div>

          {!isFree && (
            <div>
              <Label htmlFor="wifiPassword">WiFi Password</Label>
              <Input
                id="wifiPassword"
                {...register("wifiPassword")}
                placeholder="Enter WiFi password (optional)"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Additional details about WiFi access..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register("latitude", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.latitude && (
                <p className="text-sm text-destructive mt-1">{errors.latitude.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register("longitude", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.longitude && (
                <p className="text-sm text-destructive mt-1">{errors.longitude.message}</p>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Hotspot"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
