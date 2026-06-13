"use client";

import { useState, useCallback } from "react";
import {
  Settings,
  MapPin,
  Clock,
  Store,
  Check,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/context/business-context";
import type { BusinessType, OpeningHours } from "@/lib/types";

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  pharmacy: "Pharmacy",
  convenience_store: "Convenience Store",
  cafe: "Cafe",
};

const BUSINESS_TYPE_COLORS: Record<BusinessType, string> = {
  pharmacy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  convenience_store: "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30",
  cafe: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function formatHours(hours: OpeningHours): string {
  const openDays = DAYS.filter((d) => hours[d] !== null);
  if (openDays.length === 0) return "Closed";
  const first = hours[openDays[0]];
  const last = hours[openDays[openDays.length - 1]];
  if (!first) return "Closed";
  return `${openDays.length} days · ${first.open}–${last?.close ?? first.close}`;
}

export default function SettingsPage() {
  const { businesses, businessId: selectedId, setBusinessId: selectBusiness, refreshBusinesses } = useBusiness();
  const [tab, setTab] = useState("demo");
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<BusinessType>("pharmacy");
  const [customAddress, setCustomAddress] = useState("");
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");
  const [customHours, setCustomHours] = useState<OpeningHours>(() =>
    Object.fromEntries(DAYS.map((d) => [d, d === "saturday" ? null : { open: "08:00", close: "20:00" }]))
  );
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  const resolveLocation = useCallback(async () => {
    if (!customAddress.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customAddress)}&limit=1`
      );
      const results = await res.json();
      if (results.length > 0) {
        setCustomLat(parseFloat(results[0].lat).toFixed(6));
        setCustomLng(parseFloat(results[0].lon).toFixed(6));
      }
    } catch {
      // Geocoding failed silently
    } finally {
      setGeocoding(false);
    }
  }, [customAddress]);

  const updateHour = (day: string, field: "open" | "close", value: string) => {
    setCustomHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { open: "08:00", close: "20:00", [field]: value },
    }));
  };

  const toggleDayClosed = (day: string) => {
    setCustomHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: "08:00", close: "20:00" },
    }));
  };

  const saveCustomProfile = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName,
          business_type: customType,
          address: customAddress,
          lat: parseFloat(customLat) || 0,
          lng: parseFloat(customLng) || 0,
          timezone: "Asia/Jerusalem",
          opening_hours_json: customHours,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshBusinesses();
        selectBusiness(data.business.id);
        setCustomName("");
        setCustomAddress("");
        setCustomLat("");
        setCustomLng("");
      }
    } catch {
      // save failed
    } finally {
      setSaving(false);
    }
  }, [customName, customType, customAddress, customLat, customLng, customHours, refreshBusinesses, selectBusiness]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="size-5 text-[var(--accent)]" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your business profile for personalized recommendations.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="demo">Business Profiles</TabsTrigger>
          <TabsTrigger value="custom">Custom Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="demo">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {businesses.map((biz) => {
              const isActive = selectedId === biz.id;
              return (
                <Card
                  key={biz.id}
                  className={cn(
                    "cursor-pointer transition-all hover:ring-1 hover:ring-[var(--accent)]/30",
                    isActive && "ring-2 ring-[var(--accent)]"
                  )}
                  onClick={() => selectBusiness(biz.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold">{biz.name}</CardTitle>
                      {isActive && (
                        <div className="flex items-center justify-center size-5 rounded-full bg-[var(--accent)]">
                          <Check className="size-3 text-white" />
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] h-4 px-1.5 w-fit", BUSINESS_TYPE_COLORS[biz.business_type])}
                    >
                      {BUSINESS_TYPE_LABELS[biz.business_type]}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 mt-0.5" />
                      <span>{biz.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="size-3.5 shrink-0" />
                      <span>{formatHours(biz.opening_hours_json)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectBusiness(biz.id);
                      }}
                    >
                      {isActive ? "Selected" : "Select"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="size-4 text-[var(--accent)]" />
                Custom Business Profile
              </CardTitle>
              <CardDescription>
                Enter your business details for tailored recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Business Name
                  </label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="My Store"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Type
                  </label>
                  <Select value={customType} onValueChange={(v) => setCustomType(v as BusinessType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="convenience_store">Convenience Store</SelectItem>
                      <SelectItem value="cafe">Cafe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Address
                </label>
                <div className="flex gap-2">
                  <Input
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="123 Main St, Tel Aviv"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={resolveLocation} disabled={geocoding || !customAddress.trim()}>
                    {geocoding ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
                    Resolve
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Latitude</label>
                  <Input value={customLat} readOnly className="font-mono bg-muted/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Longitude</label>
                  <Input value={customLng} readOnly className="font-mono bg-muted/30" />
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  Opening Hours
                </label>
                <div className="space-y-2">
                  {DAYS.map((day) => {
                    const hours = customHours[day];
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <button
                          className={cn(
                            "w-20 text-left text-xs capitalize",
                            hours ? "text-foreground" : "text-muted-foreground line-through"
                          )}
                          onClick={() => toggleDayClosed(day)}
                        >
                          {day}
                        </button>
                        {hours ? (
                          <>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateHour(day, "open", e.target.value)}
                              className="w-28 font-mono text-xs"
                            />
                            <span className="text-xs text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateHour(day, "close", e.target.value)}
                              className="w-28 font-mono text-xs"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button onClick={saveCustomProfile} disabled={!customName.trim() || saving} className="w-full">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Store className="size-4" />}
                Save &amp; Select Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
