import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-external";
import type { Database } from "@/lib/db-types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Division = Database["public"]["Tables"]["divisions"]["Row"];

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDivisions() {
  return useQuery({
    queryKey: ["divisions"],
    queryFn: async (): Promise<Division[]> => {
      const { data, error } = await supabase.from("divisions").select("*").order("code");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export const BPH_ROLES = ["Ketua", "Waketu", "Supervisor"];

export function isBPH(role?: string | null) {
  return !!role && BPH_ROLES.includes(role);
}

export function isSupervisor(role?: string | null) {
  return role === "Supervisor";
}
