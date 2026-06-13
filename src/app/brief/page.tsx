"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Copy,
  Download,
  Loader2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useBusiness } from "@/context/business-context";

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-white mt-6 mb-3 first:mt-0">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-white mt-5 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-white mt-4 mb-1.5">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- [x] ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 pl-2">
          <CheckCircle2 className="size-4 text-[var(--success)] shrink-0 mt-0.5" />
          <span className="text-sm text-foreground">{line.slice(6)}</span>
        </div>
      );
    } else if (line.startsWith("- [ ] ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 pl-2">
          <div className="size-4 rounded-sm border border-border shrink-0 mt-0.5" />
          <span className="text-sm text-foreground">{line.slice(6)}</span>
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 pl-2">
          <span className="text-[var(--accent)] shrink-0 mt-0.5">•</span>
          <span className="text-sm text-foreground/90">{line.slice(2)}</span>
        </div>
      );
    } else if (line.startsWith("---")) {
      elements.push(
        <hr key={i} className="my-4 border-border" />
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-2 border-[var(--accent)]/50 pl-3 py-1 my-2 text-sm text-muted-foreground italic"
        >
          {line.slice(2)}
        </blockquote>
      );
    } else {
      elements.push(
        <p key={i} className="text-sm text-foreground/90 leading-relaxed">
          {line}
        </p>
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function BriefSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted/50" />
      <div className="h-4 w-3/4 rounded bg-muted/50" />
      <div className="h-5 w-32 rounded bg-muted mt-6" />
      <div className="h-4 w-full rounded bg-muted/50" />
      <div className="h-4 w-5/6 rounded bg-muted/50" />
      <div className="h-4 w-2/3 rounded bg-muted/50" />
      <div className="h-5 w-40 rounded bg-muted mt-6" />
      <div className="h-4 w-full rounded bg-muted/50" />
      <div className="h-4 w-4/5 rounded bg-muted/50" />
    </div>
  );
}

export default function BriefPage() {
  const [briefType, setBriefType] = useState<"tomorrow" | "weekly">("tomorrow");
  const [briefContent, setBriefContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { businessId } = useBusiness();

  const generateBrief = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBriefContent("");
    try {
      const recsRes = await fetch(`/api/recommendations?business_id=${businessId}`);
      const recsData = recsRes.ok ? await recsRes.json() : { recommendations: [] };
      const recs = recsData.recommendations ?? [];

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          type: briefType,
          recommendations: recs,
        }),
      });
      if (!res.ok) throw new Error(`Failed to generate brief (${res.status})`);
      const data = await res.json();
      setBriefContent(data.brief);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [businessId, briefType]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(briefContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  }, [briefContent]);

  const downloadMarkdown = useCallback(() => {
    const blob = new Blob([briefContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `skypulse-${briefType}-brief-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [briefContent, briefType]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <FileText className="size-5 text-[var(--accent)]" />
            Manager Brief
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Auto-generated operational briefing for your team.
          </p>
        </div>
      </div>

      {/* Tabs + Generate */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={briefType} onValueChange={(v) => setBriefType(v as "tomorrow" | "weekly")}>
          <TabsList>
            <TabsTrigger value="tomorrow">Tomorrow Brief</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Brief</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={generateBrief} disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Generate Brief
        </Button>
      </div>

      {error && (
        <Card className="border-[var(--destructive)]/30">
          <CardContent className="text-sm text-[var(--destructive)]">{error}</CardContent>
        </Card>
      )}

      {/* Brief Content */}
      {loading ? (
        <Card>
          <BriefSkeleton />
        </Card>
      ) : briefContent ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b border-border pb-3">
            <CardTitle className="text-sm font-semibold">
              {briefType === "tomorrow" ? "Tomorrow" : "Weekly"} Brief
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                {copied ? <CheckCircle2 className="size-3.5 text-[var(--success)]" /> : <Copy className="size-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button size="sm" variant="outline" onClick={downloadMarkdown}>
                <Download className="size-3.5" />
                Download .md
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-340px)]">
              <div className="py-2">
                <MarkdownRenderer content={briefContent} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="size-10 text-muted-foreground/40 mb-3" />
            <CardDescription className="text-base">No brief generated yet</CardDescription>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a brief type and click &quot;Generate Brief&quot; to create your operational summary.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
