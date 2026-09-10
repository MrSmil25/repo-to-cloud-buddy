// Permissive schema types for the external Supabase project.
// The generated types file belongs to the built-in backend, which is unused here.
export type Database = {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any }>;
    Views: Record<string, { Row: any }>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
  };
};
