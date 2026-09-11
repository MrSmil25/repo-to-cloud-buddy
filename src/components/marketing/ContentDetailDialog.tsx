import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Palette } from "lucide-react";
import { useMyProfile, useProfiles } from "@/hooks/useProfile";
import {
  CAPTION_LIMITS,
  CONTENT_STATUSES,
  canManageContent,
  canReviewContent,
  fetchContentPlan,
  fetchDesignRequestsByContent,
  fetchPillars,
  isImageUrl,
  label,
  updateContentPlan,
  type ContentPlan,
  type ContentStatus,
} from "@/lib/marketing";
import { formatDateID } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArchivedInfoBanner } from "@/components/archive/ArchivedInfoBanner";
import { ContentStatusBadge, DesignStatusBadge, PillarDot } from "./MarketingBadges";
import { DesignRequestWizard } from "./DesignRequestWizard";

export function ContentDetailDialog({
  contentId,
  onOpenChange,
}: {
  contentId: string | null;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const { data: pillars = [] } = useQuery({ queryKey: ["content-pillars"], queryFn: fetchPillars });
  const { data: plan } = useQuery({
    queryKey: ["content-plan", contentId],
    queryFn: () => fetchContentPlan(contentId!),
    enabled: !!contentId,
  });
  const { data: designs = [] } = useQuery({
    queryKey: ["content-designs", contentId],
    queryFn: () => fetchDesignRequestsByContent(contentId!),
    enabled: !!contentId,
  });

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setCaption(plan.caption_draft ?? "");
    setHashtags(plan.hashtags ?? "");
    setAssetUrl(plan.asset_url ?? "");
    setPublishedUrl(plan.published_url ?? "");
    setReviewNotes(plan.review_notes ?? "");
  }, [plan?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameOf = useMemo(() => {
    const map = new Map(profiles.map((p) => [p.id, p.full_name as string]));
    return (id?: string | null) => (id ? (map.get(id) ?? "-") : "-");
  }, [profiles]);

  const pillar = pillars.find((p) => p.id === plan?.pillar_id) ?? null;
  const canEdit = canManageContent(profile?.role, profile?.division);
  const canReview = canReviewContent(profile?.role, profile?.division, plan?.owner_division);
  const limit = CAPTION_LIMITS[plan?.platform ?? "Lainnya"] ?? 2200;

  const save = useMutation({
    mutationFn: (patch: Partial<ContentPlan>) => updateContentPlan(plan!.id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-plan", contentId] });
      queryClient.invalidateQueries({ queryKey: ["content-plans"] });
      queryClient.invalidateQueries({ queryKey: ["event-content-plans"] });
      toast.success("Perubahan disimpan.");
    },
    onError: (e: Error) => toast.error("Gagal: " + e.message),
  });

  if (!contentId) return null;

  return (
    <>
      <Dialog open={!!contentId} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 pr-6">
              <PillarDot pillar={pillar} />
              <span className={plan?.is_archived ? "line-through opacity-60" : ""}>
                {plan?.title ?? "Memuat…"}
              </span>
              {plan && <ContentStatusBadge status={plan.status} />}
            </DialogTitle>
          </DialogHeader>

          {plan && (
            <div className="space-y-5">
              {plan.is_archived && (
                <ArchivedInfoBanner item={plan} nameResolver={nameOf} />
              )}

              <div className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-xs sm:grid-cols-2">
                <p>Platform: <b>{plan.platform}</b> · Format: <b>{label(plan.format)}</b></p>
                <p>Pilar: <b>{pillar?.name ?? "-"}</b></p>
                <p>Divisi: <b>{plan.owner_division ?? "-"}</b></p>
                <p>Copywriter: <b>{nameOf(plan.copywriter_id)}</b></p>
                <p>
                  Tayang: <b>{formatDateID(plan.scheduled_date)}</b>
                  {plan.scheduled_time ? ` ${plan.scheduled_time.slice(0, 5)}` : ""}
                </p>
                <p>Terakhir diubah: <b>{formatDateID(plan.updated_at)}</b></p>
              </div>

              {plan.brief && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Brief</p>
                  <p className="whitespace-pre-wrap rounded-lg border bg-card p-3 text-sm">{plan.brief}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cd-caption">Draf Caption</Label>
                  <span
                    className={`text-[11px] ${caption.length > limit ? "font-semibold text-destructive" : "text-muted-foreground"}`}
                  >
                    {caption.length} / {limit}
                  </span>
                </div>
                <Textarea
                  id="cd-caption"
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cd-tags">Hashtag</Label>
                <Textarea
                  id="cd-tags"
                  rows={2}
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#himpunan #edukasi"
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cd-asset">Link Aset Final</Label>
                <Input
                  id="cd-asset"
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  placeholder="https://…"
                  disabled={!canEdit}
                />
                {isImageUrl(assetUrl) && (
                  <img
                    src={assetUrl}
                    alt="Pratinjau aset konten"
                    loading="lazy"
                    className="mt-2 max-h-56 rounded-lg border object-contain"
                  />
                )}
              </div>

              {/* Permintaan desain terkait */}
              <div className="rounded-lg border">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <p className="text-xs font-semibold">Permintaan Desain Terkait</p>
                  <Button size="sm" variant="outline" onClick={() => setWizardOpen(true)}>
                    <Palette className="size-4" /> Minta Desain
                  </Button>
                </div>
                {designs.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-muted-foreground">Belum ada permintaan desain.</p>
                ) : (
                  <ul className="divide-y">
                    {designs.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                        <span className="min-w-0 truncate">{d.title}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-muted-foreground">{nameOf(d.designer_id)}</span>
                          <DesignStatusBadge status={d.status} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Publikasi */}
              <div className="space-y-1.5">
                <Label htmlFor="cd-url">Link Publikasi</Label>
                <div className="flex gap-2">
                  <Input
                    id="cd-url"
                    value={publishedUrl}
                    onChange={(e) => setPublishedUrl(e.target.value)}
                    placeholder="https://instagram.com/p/…"
                    disabled={!canEdit}
                  />
                  {plan.published_url && (
                    <Button asChild variant="outline" size="icon">
                      <a href={plan.published_url} target="_blank" rel="noreferrer" aria-label="Buka publikasi">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Status & review */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={plan.status}
                    onValueChange={(v) => {
                      const next = v as ContentStatus;
                      const patch: Partial<ContentPlan> = { status: next };
                      if (next === "Tayang") patch.published_at = new Date().toISOString();
                      save.mutate(patch);
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{label(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cd-review">Catatan Review</Label>
                  <Textarea
                    id="cd-review"
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    disabled={!canReview}
                  />
                </div>
              </div>

              {canReview && plan.status === "Review" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      save.mutate({
                        status: "Disetujui",
                        reviewer_id: profile?.id ?? null,
                        reviewed_at: new Date().toISOString(),
                        review_notes: reviewNotes.trim() || null,
                      })
                    }
                  >
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!reviewNotes.trim()) {
                        toast.error("Tulis catatan revisi dulu.");
                        return;
                      }
                      save.mutate({
                        status: "Draf",
                        reviewer_id: profile?.id ?? null,
                        reviewed_at: new Date().toISOString(),
                        review_notes: reviewNotes.trim(),
                      });
                    }}
                  >
                    Minta Revisi
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
            {canEdit && plan && (
              <Button
                disabled={save.isPending}
                onClick={() =>
                  save.mutate({
                    caption_draft: caption.trim() || null,
                    hashtags: hashtags.trim() || null,
                    asset_url: assetUrl.trim() || null,
                    published_url: publishedUrl.trim() || null,
                    review_notes: reviewNotes.trim() || null,
                  })
                }
              >
                Simpan Perubahan
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {plan && (
        <DesignRequestWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          fromContent={plan}
        />
      )}
    </>
  );
}
