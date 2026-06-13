"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Store,
  Building2,
  Coffee,
  Hospital,
  Landmark,
  Train,
  Hotel,
  ParkingCircle,
  Home,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/context/business-context";
import type { Place } from "@/lib/types/places";
import type { MapMarker } from "@/components/map/leaflet-map";

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="h-[500px] rounded-lg bg-card border border-border animate-pulse" /> },
);

function PlaceIcon({ type }: { type: string }) {
  const cls = "size-4";
  switch (type) {
    case "pharmacy": return <Hospital className={cn(cls, "text-emerald-400")} />;
    case "hospital": return <Hospital className={cn(cls, "text-red-400")} />;
    case "shopping_mall": return <Building2 className={cn(cls, "text-[var(--accent)]")} />;
    case "cafe": return <Coffee className={cn(cls, "text-amber-400")} />;
    case "performing_arts": return <Landmark className={cn(cls, "text-purple-400")} />;
    case "supermarket": return <Store className={cn(cls, "text-cyan-400")} />;
    case "market": return <ShoppingBag className={cn(cls, "text-orange-400")} />;
    case "transit": return <Train className={cn(cls, "text-gray-400")} />;
    case "hotel": return <Hotel className={cn(cls, "text-indigo-400")} />;
    case "parking": return <ParkingCircle className={cn(cls, "text-slate-400")} />;
    case "residential": return <Home className={cn(cls, "text-teal-400")} />;
    case "beach": return <MapPin className={cn(cls, "text-sky-400")} />;
    case "landmark": return <Landmark className={cn(cls, "text-yellow-400")} />;
    default: return <MapPin className={cn(cls, "text-muted-foreground")} />;
  }
}

function placeColor(p: Place): MapMarker["color"] {
  if (p.category === "competitor") return "red";
  if (p.type === "transit") return "gray";
  if (p.type === "performing_arts") return "purple";
  return "green";
}

export default function MapContextPage() {
  const { business } = useBusiness();
  const [nearbyPlaces, setNearbyPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!business.id) return;
    let cancelled = false;
    setLoading(true);
    setNearbyPlaces([]);

    fetch(`/api/places?business_id=${business.id}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data: Place[]) => {
        if (!cancelled) setNearbyPlaces(data);
      })
      .catch(() => {
        if (!cancelled) setNearbyPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [business.id]);

  const markers: MapMarker[] = useMemo(() => [
    { lat: business.lat, lng: business.lng, label: business.name, color: "blue" as const, popup: `${business.address}<br/>Your business` },
    ...nearbyPlaces.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      label: p.name,
      color: placeColor(p),
      popup: `${p.description || p.type}<br/>${p.distance_m}m away`,
    })),
  ], [business, nearbyPlaces]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Navigation className="size-5 text-[var(--accent)]" />
          Map Context
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Location context and nearby places for {business.name}.
        </p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <LeafletMap
            center={[business.lat, business.lng]}
            zoom={15}
            markers={markers}
            radiusMeters={1000}
            className="h-[500px]"
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3d71d9]" /> Your Business</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#d10e5c]" /> Competitor</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1a7f4b]" /> Demand Anchor</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8f3bb8]" /> Event Venue</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#666]" /> Transit</span>
      </div>

      {/* Nearby Places */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Store className="size-4 text-[var(--accent)]" />
            Nearby Places
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
              {loading ? "..." : nearbyPlaces.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="size-6 mx-auto mb-2 animate-spin text-[var(--accent)]" />
              <p>Discovering nearby places via Gemini...</p>
            </div>
          )}
          {!loading && nearbyPlaces.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              <MapPin className="size-6 mx-auto mb-2 text-muted-foreground/40" />
              <p>No nearby places found.</p>
              <p className="text-xs mt-1">Try refreshing — place discovery depends on Gemini search grounding.</p>
            </div>
          )}
          {nearbyPlaces.map((place, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 py-2">
                <PlaceIcon type={place.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{place.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-4 px-1.5 shrink-0",
                        place.category === "competitor"
                          ? "bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20"
                          : "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20",
                      )}
                    >
                      {place.category === "competitor" ? "Competitor" : "Demand Anchor"}
                    </Badge>
                  </div>
                  {place.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{place.description}</p>
                  )}
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {place.distance_m}m
                </span>
              </div>
              {i < nearbyPlaces.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
