// Supabase generated types placeholder.
// Regenerate with: `npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts`
// Until then, use a permissive type so queries compile without fighting generics.

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
