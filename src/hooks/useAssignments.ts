import { useQuery } from "@tanstack/react-query";
import { fetchMyAssignments, fetchMySubmissions } from "@/lib/assignments";
import { useMyProfile } from "@/hooks/useProfile";

export function useMyAssignments() {
  return useQuery({ queryKey: ["my-assignments"], queryFn: fetchMyAssignments });
}

export function useMySubmissions() {
  const { data: profile } = useMyProfile();
  return useQuery({
    queryKey: ["my-submissions", profile?.id],
    queryFn: () => fetchMySubmissions(profile!.id),
    enabled: !!profile?.id,
  });
}

/** Jumlah tugas dari Pembina yang belum dikumpulkan. */
export function usePendingAssignmentCount() {
  const { data: assignments = [] } = useMyAssignments();
  const { data: submissions = [] } = useMySubmissions();
  const done = new Set(submissions.map((s) => s.assignment_id));
  return assignments.filter((a) => !done.has(a.id)).length;
}
