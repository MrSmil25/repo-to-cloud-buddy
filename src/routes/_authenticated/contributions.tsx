import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  ContributionFormDialog,
  type ContributionFormValue,
} from "@/components/hr/ContributionFormDialog";
import { useMyProfile, useProfiles } from "@/hooks/useProfile";
import { createContribution, fetchContributions, CONTRIBUTION_KIND_LABEL } from "@/lib/hr";
import { fetchLinkOptions } from "@/lib/workspace";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contributions")({
  head: () => ({
    meta: [
      { title: "Feed Kontribusi — OrgTool" },
      { name: "description", content: "Apresiasi antar anggota atas kontribusi yang sering luput." },
      { property: "og:title", content: "Feed Kontribusi — OrgTool" },
      {
        property: "og:description",
        content: "Apresiasi antar anggota atas kontribusi yang sering luput.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContributionsPage,
});

function ContributionsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const { data: profiles = [] } = useProfiles();
  const [open, setOpen] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["contribution-notes"],
    queryFn: () => fetchContributions(),
  });

  const { data: options } = useQuery({ queryKey: ["link-options"], queryFn: fetchLinkOptions });

  const candidates = useMemo(
    () => profiles.filter((p) => p.id !== profile?.id && p.status === "Active"),
    [profiles, profile],
  );

  const createMutation = useMutation({
    mutationFn: (v: ContributionFormValue) =>
      createContribution({ ...v, recorded_by: profile!.id }),
    onSuccess: () => {
      toast.success("Apresiasi tercatat. Terima kasih sudah memperhatikan rekanmu.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["contribution-notes"] });
      queryClient.invalidateQueries({ queryKey: ["contributions-week"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menyimpan apresiasi."),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feed Kontribusi</h1>
          <p className="text-sm text-muted-foreground">
            Catat hal baik yang dilakukan rekanmu — hal yang biasanya tidak masuk laporan.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Apresiasi Rekan</Button>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada kontribusi yang tercatat.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((c) => (
            <article key={c.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <UserAvatar
                  path={c.member?.photo_url}
                  name={c.member?.full_name}
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{c.member?.full_name ?? "Anggota"}</span>{" "}
                    <span className="text-muted-foreground">diapresiasi oleh</span>{" "}
                    <span className="font-medium">{c.recorder?.full_name ?? "—"}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                      {CONTRIBUTION_KIND_LABEL[c.kind] ?? c.kind}
                    </span>
                    <span className="text-muted-foreground">{relativeTime(c.created_at)}</span>
                    {c.event?.name && (
                      <span className="text-muted-foreground">· Event: {c.event.name}</span>
                    )}
                    {c.task?.title && (
                      <span className="text-muted-foreground">· Task: {c.task.title}</span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{c.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ContributionFormDialog
        open={open}
        onOpenChange={setOpen}
        submitting={createMutation.isPending}
        candidates={candidates}
        events={options?.events ?? []}
        onSubmit={(v) => createMutation.mutate(v)}
      />
    </div>
  );
}
