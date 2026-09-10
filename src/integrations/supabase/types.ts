export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          created_at: string | null
          expires_at: string | null
          granted_by: string | null
          grantee_id: string
          id: string
          is_active: boolean | null
          reason: string | null
          scope_division: string | null
          scope_event_id: string | null
          scope_type: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          grantee_id: string
          id?: string
          is_active?: boolean | null
          reason?: string | null
          scope_division?: string | null
          scope_event_id?: string | null
          scope_type: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          granted_by?: string | null
          grantee_id?: string
          id?: string
          is_active?: boolean | null
          reason?: string | null
          scope_division?: string | null
          scope_event_id?: string | null
          scope_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "access_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "access_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "access_grants_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "access_grants_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "access_grants_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_grants_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "access_grants_scope_division_fkey"
            columns: ["scope_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "access_grants_scope_event_id_fkey"
            columns: ["scope_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string | null
          id: string
          read_at: string | null
          reader_id: string | null
        }
        Insert: {
          announcement_id?: string | null
          id?: string
          read_at?: string | null
          reader_id?: string | null
        }
        Update: {
          announcement_id?: string | null
          id?: string
          read_at?: string | null
          reader_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcement_read_status"
            referencedColumns: ["announcement_id"]
          },
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_reader_id_fkey"
            columns: ["reader_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "announcement_reads_reader_id_fkey"
            columns: ["reader_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "announcement_reads_reader_id_fkey"
            columns: ["reader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_reader_id_fkey"
            columns: ["reader_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_id: string | null
          body: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          level: Database["public"]["Enums"]["announcement_level"]
          published_at: string | null
          related_event_id: string | null
          requires_ack: boolean
          scope: Database["public"]["Enums"]["announcement_scope"]
          target_division: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["announcement_level"]
          published_at?: string | null
          related_event_id?: string | null
          requires_ack?: boolean
          scope?: Database["public"]["Enums"]["announcement_scope"]
          target_division?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["announcement_level"]
          published_at?: string | null
          related_event_id?: string | null
          requires_ack?: boolean
          scope?: Database["public"]["Enums"]["announcement_scope"]
          target_division?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "announcements_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_target_division_fkey"
            columns: ["target_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string | null
          commented_at: string | null
          commented_by: string | null
          content: string | null
          file_url: string | null
          id: string
          member_id: string | null
          submitted_at: string | null
          supervisor_comment: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          commented_at?: string | null
          commented_by?: string | null
          content?: string | null
          file_url?: string | null
          id?: string
          member_id?: string | null
          submitted_at?: string | null
          supervisor_comment?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          commented_at?: string | null
          commented_by?: string | null
          content?: string | null
          file_url?: string | null
          id?: string
          member_id?: string | null
          submitted_at?: string | null
          supervisor_comment?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignment_progress"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_commented_by_fkey"
            columns: ["commented_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignment_submissions_commented_by_fkey"
            columns: ["commented_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignment_submissions_commented_by_fkey"
            columns: ["commented_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_commented_by_fkey"
            columns: ["commented_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignment_submissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignment_submissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignment_submissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      assignment_targets: {
        Row: {
          assignment_id: string | null
          id: string
          member_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          id?: string
          member_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          id?: string
          member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_targets_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignment_progress"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "assignment_targets_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_targets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignment_targets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignment_targets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_targets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_file: boolean | null
          allow_text: boolean | null
          category: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          scope: Database["public"]["Enums"]["assignment_scope"]
          target_division: string | null
          title: string
          updated_at: string | null
          visibility: Database["public"]["Enums"]["submission_visibility"]
        }
        Insert: {
          allow_file?: boolean | null
          allow_text?: boolean | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          scope?: Database["public"]["Enums"]["assignment_scope"]
          target_division?: string | null
          title: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["submission_visibility"]
        }
        Update: {
          allow_file?: boolean | null
          allow_text?: boolean | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          scope?: Database["public"]["Enums"]["assignment_scope"]
          target_division?: string | null
          title?: string
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["submission_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "assignments_target_division_fkey"
            columns: ["target_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changed_by: string | null
          changed_by_name: string | null
          changed_fields: string[] | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changed_by_name?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changed_by_name?: string | null
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      budgets: {
        Row: {
          allocated_idr: number
          category: string
          created_at: string | null
          created_by: string | null
          division: string | null
          event_id: string | null
          id: string
          notes: string | null
          parent_budget_id: string | null
          period: string
          spent_idr: number | null
          status: Database["public"]["Enums"]["budget_status"]
          updated_at: string | null
        }
        Insert: {
          allocated_idr: number
          category: string
          created_at?: string | null
          created_by?: string | null
          division?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          parent_budget_id?: string | null
          period: string
          spent_idr?: number | null
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string | null
        }
        Update: {
          allocated_idr?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          division?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          parent_budget_id?: string | null
          period?: string
          spent_idr?: number | null
          status?: Database["public"]["Enums"]["budget_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "budgets_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "budgets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_parent_budget_id_fkey"
            columns: ["parent_budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_expenses: {
        Row: {
          amount_idr: number
          created_at: string | null
          description: string
          expense_date: string
          id: string
          proof_url: string | null
          recorded_by: string | null
        }
        Insert: {
          amount_idr: number
          created_at?: string | null
          description: string
          expense_date?: string
          id?: string
          proof_url?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount_idr?: number
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          proof_url?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "cash_expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "cash_expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      coaching_notes: {
        Row: {
          acknowledged_at: string | null
          agreements: string | null
          coach_id: string
          created_at: string | null
          discussion: string
          id: string
          member_acknowledged: boolean | null
          member_id: string
          next_checkin: string | null
          topic: Database["public"]["Enums"]["coaching_topic"]
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          agreements?: string | null
          coach_id: string
          created_at?: string | null
          discussion: string
          id?: string
          member_acknowledged?: boolean | null
          member_id: string
          next_checkin?: string | null
          topic?: Database["public"]["Enums"]["coaching_topic"]
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          agreements?: string | null
          coach_id?: string
          created_at?: string | null
          discussion?: string
          id?: string
          member_acknowledged?: boolean | null
          member_id?: string
          next_checkin?: string | null
          topic?: Database["public"]["Enums"]["coaching_topic"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coaching_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "coaching_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "coaching_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "coaching_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "coaching_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "coaching_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      collection_payments: {
        Row: {
          amount_paid: number | null
          claimed_at: string | null
          collection_id: string | null
          created_at: string | null
          id: string
          member_id: string | null
          proof_url: string | null
          reject_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_paid?: number | null
          claimed_at?: string | null
          collection_id?: string | null
          created_at?: string | null
          id?: string
          member_id?: string | null
          proof_url?: string | null
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_paid?: number | null
          claimed_at?: string | null
          collection_id?: string | null
          created_at?: string | null
          id?: string
          member_id?: string | null
          proof_url?: string | null
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_payments_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_progress"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_payments_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "collection_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "collection_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "collection_payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "collection_payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "collection_payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      collections: {
        Row: {
          amount_per_person: number
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          kind: Database["public"]["Enums"]["collection_kind"]
          status: Database["public"]["Enums"]["collection_status"]
          target_division: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount_per_person: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          kind: Database["public"]["Enums"]["collection_kind"]
          status?: Database["public"]["Enums"]["collection_status"]
          target_division?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount_per_person?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["collection_kind"]
          status?: Database["public"]["Enums"]["collection_status"]
          target_division?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "collections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "collections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "collections_target_division_fkey"
            columns: ["target_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      companies: {
        Row: {
          city: string | null
          created_at: string | null
          created_by: string | null
          first_contact_date: string | null
          id: string
          industry: string | null
          last_touch_date: string | null
          logo_url: string | null
          name: string
          notes: string | null
          overall_status: Database["public"]["Enums"]["company_status"]
          owner_division: string | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          first_contact_date?: string | null
          id?: string
          industry?: string | null
          last_touch_date?: string | null
          logo_url?: string | null
          name: string
          notes?: string | null
          overall_status?: Database["public"]["Enums"]["company_status"]
          owner_division?: string | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          first_contact_date?: string | null
          id?: string
          industry?: string | null
          last_touch_date?: string | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          overall_status?: Database["public"]["Enums"]["company_status"]
          owner_division?: string | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "companies_owner_division_fkey"
            columns: ["owner_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      contribution_notes: {
        Row: {
          created_at: string | null
          description: string
          id: string
          kind: Database["public"]["Enums"]["contribution_kind"]
          member_id: string
          recorded_by: string
          related_event_id: string | null
          related_task_id: string | null
          visible_to_member: boolean | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          kind?: Database["public"]["Enums"]["contribution_kind"]
          member_id: string
          recorded_by: string
          related_event_id?: string | null
          related_task_id?: string | null
          visible_to_member?: boolean | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["contribution_kind"]
          member_id?: string
          recorded_by?: string
          related_event_id?: string | null
          related_task_id?: string | null
          visible_to_member?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contribution_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "contribution_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "contribution_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "contribution_notes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "contribution_notes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "contribution_notes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_notes_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "contribution_notes_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_notes_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company_id: string | null
          created_at: string | null
          deadline: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          deliverables: string | null
          event_id: string | null
          id: string
          name: string
          notes: string | null
          owner_division: string | null
          owner_person_id: string | null
          primary_contact_id: string | null
          related_surat_number: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string | null
          value_idr: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          deadline?: string | null
          deal_type: Database["public"]["Enums"]["deal_type"]
          deliverables?: string | null
          event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          owner_division?: string | null
          owner_person_id?: string | null
          primary_contact_id?: string | null
          related_surat_number?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string | null
          value_idr?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          deadline?: string | null
          deal_type?: Database["public"]["Enums"]["deal_type"]
          deliverables?: string | null
          event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          owner_division?: string | null
          owner_person_id?: string | null
          primary_contact_id?: string | null
          related_surat_number?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string | null
          value_idr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_division_fkey"
            columns: ["owner_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "deals_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "deals_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "deals_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          code: string
          color_hex: string | null
          created_at: string | null
          description: string | null
          name: string
        }
        Insert: {
          code: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          name: string
        }
        Update: {
          code?: string
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          name?: string
        }
        Relationships: []
      }
      event_rundowns: {
        Row: {
          activity: string
          created_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          pic_id: string | null
          sort_order: number | null
          time_end: string | null
          time_start: string | null
        }
        Insert: {
          activity: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          pic_id?: string | null
          sort_order?: number | null
          time_end?: string | null
          time_start?: string | null
        }
        Update: {
          activity?: string
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          pic_id?: string | null
          sort_order?: number | null
          time_end?: string | null
          time_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_rundowns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rundowns_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "event_rundowns_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "event_rundowns_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rundowns_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          confirmation_status: Database["public"]["Enums"]["speaker_confirmation"]
          created_at: string | null
          event_id: string | null
          fee_idr: number | null
          fee_status: Database["public"]["Enums"]["fee_status"]
          id: string
          notes: string | null
          session_time_end: string | null
          session_time_start: string | null
          session_title: string | null
          speaker_id: string | null
          tor_url: string | null
          updated_at: string | null
        }
        Insert: {
          confirmation_status?: Database["public"]["Enums"]["speaker_confirmation"]
          created_at?: string | null
          event_id?: string | null
          fee_idr?: number | null
          fee_status?: Database["public"]["Enums"]["fee_status"]
          id?: string
          notes?: string | null
          session_time_end?: string | null
          session_time_start?: string | null
          session_title?: string | null
          speaker_id?: string | null
          tor_url?: string | null
          updated_at?: string | null
        }
        Update: {
          confirmation_status?: Database["public"]["Enums"]["speaker_confirmation"]
          created_at?: string | null
          event_id?: string | null
          fee_idr?: number | null
          fee_status?: Database["public"]["Enums"]["fee_status"]
          id?: string
          notes?: string | null
          session_time_end?: string | null
          session_time_start?: string | null
          session_title?: string | null
          speaker_id?: string | null
          tor_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_speaker_id_fkey"
            columns: ["speaker_id"]
            isOneToOne: false
            referencedRelation: "speakers"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_attendees: number | null
          actual_spend_idr: number | null
          budget_idr: number | null
          created_at: string | null
          date_end: string | null
          date_start: string | null
          description: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          name: string
          notes: string | null
          pic_id: string | null
          poster_url: string | null
          slug: string | null
          status: Database["public"]["Enums"]["event_status"]
          target_attendees: number | null
          updated_at: string | null
          venue: string | null
          venue_address: string | null
        }
        Insert: {
          actual_attendees?: number | null
          actual_spend_idr?: number | null
          budget_idr?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          name: string
          notes?: string | null
          pic_id?: string | null
          poster_url?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          target_attendees?: number | null
          updated_at?: string | null
          venue?: string | null
          venue_address?: string | null
        }
        Update: {
          actual_attendees?: number | null
          actual_spend_idr?: number | null
          budget_idr?: number | null
          created_at?: string | null
          date_end?: string | null
          date_start?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          name?: string
          notes?: string | null
          pic_id?: string | null
          poster_url?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          target_attendees?: number | null
          updated_at?: string | null
          venue?: string | null
          venue_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "events_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "events_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      fund_requests: {
        Row: {
          amount_idr: number
          approval_notes: string | null
          approved_at: string | null
          approver_id: string | null
          breakdown: Json | null
          created_at: string | null
          disbursed_at: string | null
          disbursement_proof_url: string | null
          event_id: string | null
          expense_date: string | null
          id: string
          notes: string | null
          purpose: string
          receipt_url: string | null
          report_submitted_at: string | null
          report_url: string | null
          request_kind: string
          request_number: string | null
          requester_division: string | null
          requester_id: string
          status: Database["public"]["Enums"]["fund_status"]
          updated_at: string | null
          urgency: Database["public"]["Enums"]["fund_urgency"]
        }
        Insert: {
          amount_idr: number
          approval_notes?: string | null
          approved_at?: string | null
          approver_id?: string | null
          breakdown?: Json | null
          created_at?: string | null
          disbursed_at?: string | null
          disbursement_proof_url?: string | null
          event_id?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          purpose: string
          receipt_url?: string | null
          report_submitted_at?: string | null
          report_url?: string | null
          request_kind?: string
          request_number?: string | null
          requester_division?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["fund_status"]
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["fund_urgency"]
        }
        Update: {
          amount_idr?: number
          approval_notes?: string | null
          approved_at?: string | null
          approver_id?: string | null
          breakdown?: Json | null
          created_at?: string | null
          disbursed_at?: string | null
          disbursement_proof_url?: string | null
          event_id?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          purpose?: string
          receipt_url?: string | null
          report_submitted_at?: string | null
          report_url?: string | null
          request_kind?: string
          request_number?: string | null
          requester_division?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["fund_status"]
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["fund_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "fund_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_requests_requester_division_fkey"
            columns: ["requester_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      fund_transactions: {
        Row: {
          amount_idr: number
          category: string
          created_at: string | null
          description: string
          id: string
          proof_url: string | null
          recorded_by: string | null
          related_deal_id: string | null
          related_event_id: string | null
          related_fund_request_id: string | null
          transaction_date: string
          type: Database["public"]["Enums"]["transaction_type"]
          visibility: Database["public"]["Enums"]["transaction_visibility"]
        }
        Insert: {
          amount_idr: number
          category: string
          created_at?: string | null
          description: string
          id?: string
          proof_url?: string | null
          recorded_by?: string | null
          related_deal_id?: string | null
          related_event_id?: string | null
          related_fund_request_id?: string | null
          transaction_date?: string
          type: Database["public"]["Enums"]["transaction_type"]
          visibility?: Database["public"]["Enums"]["transaction_visibility"]
        }
        Update: {
          amount_idr?: number
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          proof_url?: string | null
          recorded_by?: string | null
          related_deal_id?: string | null
          related_event_id?: string | null
          related_fund_request_id?: string | null
          transaction_date?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          visibility?: Database["public"]["Enums"]["transaction_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "fund_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_transactions_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transactions_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transactions_related_fund_request_id_fkey"
            columns: ["related_fund_request_id"]
            isOneToOne: false
            referencedRelation: "fund_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transactions_related_fund_request_id_fkey"
            columns: ["related_fund_request_id"]
            isOneToOne: false
            referencedRelation: "reimbursement_aging"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          approver_id: string | null
          approver_response: string | null
          created_at: string | null
          decided_at: string | null
          due_date: string | null
          expires_at: string
          final_assignee_id: string | null
          generated_task_id: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          related_deal_id: string | null
          related_event_id: string | null
          requested_by: string
          requester_division: string | null
          status: Database["public"]["Enums"]["help_request_status"]
          suggested_assignee_id: string | null
          target_division: string
          task_description: string | null
          task_title: string
          updated_at: string | null
        }
        Insert: {
          approver_id?: string | null
          approver_response?: string | null
          created_at?: string | null
          decided_at?: string | null
          due_date?: string | null
          expires_at?: string
          final_assignee_id?: string | null
          generated_task_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_deal_id?: string | null
          related_event_id?: string | null
          requested_by: string
          requester_division?: string | null
          status?: Database["public"]["Enums"]["help_request_status"]
          suggested_assignee_id?: string | null
          target_division: string
          task_description?: string | null
          task_title: string
          updated_at?: string | null
        }
        Update: {
          approver_id?: string | null
          approver_response?: string | null
          created_at?: string | null
          decided_at?: string | null
          due_date?: string | null
          expires_at?: string
          final_assignee_id?: string | null
          generated_task_id?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          related_deal_id?: string | null
          related_event_id?: string | null
          requested_by?: string
          requester_division?: string | null
          status?: Database["public"]["Enums"]["help_request_status"]
          suggested_assignee_id?: string | null
          target_division?: string
          task_description?: string | null
          task_title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_final_assignee_id_fkey"
            columns: ["final_assignee_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_final_assignee_id_fkey"
            columns: ["final_assignee_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_final_assignee_id_fkey"
            columns: ["final_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_final_assignee_id_fkey"
            columns: ["final_assignee_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_generated_task_id_fkey"
            columns: ["generated_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_requester_division_fkey"
            columns: ["requester_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "help_requests_suggested_assignee_id_fkey"
            columns: ["suggested_assignee_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_suggested_assignee_id_fkey"
            columns: ["suggested_assignee_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_suggested_assignee_id_fkey"
            columns: ["suggested_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_suggested_assignee_id_fkey"
            columns: ["suggested_assignee_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "help_requests_target_division_fkey"
            columns: ["target_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      invitations: {
        Row: {
          assigned_division: string | null
          assigned_role: Database["public"]["Enums"]["user_role"] | null
          code: string
          created_at: string | null
          created_by: string | null
          default_role: Database["public"]["Enums"]["user_role"] | null
          division: string | null
          expires_at: string | null
          id: string
          intended_email: string | null
          intended_name: string | null
          is_active: boolean | null
          kind: Database["public"]["Enums"]["invite_kind"]
          max_uses: number | null
          used_count: number | null
        }
        Insert: {
          assigned_division?: string | null
          assigned_role?: Database["public"]["Enums"]["user_role"] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          default_role?: Database["public"]["Enums"]["user_role"] | null
          division?: string | null
          expires_at?: string | null
          id?: string
          intended_email?: string | null
          intended_name?: string | null
          is_active?: boolean | null
          kind: Database["public"]["Enums"]["invite_kind"]
          max_uses?: number | null
          used_count?: number | null
        }
        Update: {
          assigned_division?: string | null
          assigned_role?: Database["public"]["Enums"]["user_role"] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          default_role?: Database["public"]["Enums"]["user_role"] | null
          division?: string | null
          expires_at?: string | null
          id?: string
          intended_email?: string | null
          intended_name?: string | null
          is_active?: boolean | null
          kind?: Database["public"]["Enums"]["invite_kind"]
          max_uses?: number | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_assigned_division_fkey"
            columns: ["assigned_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "invitations_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      key_results: {
        Row: {
          baseline_value: number | null
          created_at: string | null
          current_value: number | null
          due_date: string | null
          id: string
          metric_type: Database["public"]["Enums"]["metric_type"]
          notes: string | null
          objective_id: string | null
          owner_division: string | null
          owner_person_id: string | null
          progress_percent: number | null
          status: Database["public"]["Enums"]["okr_status"]
          target_value: number
          title: string
          updated_at: string | null
        }
        Insert: {
          baseline_value?: number | null
          created_at?: string | null
          current_value?: number | null
          due_date?: string | null
          id?: string
          metric_type?: Database["public"]["Enums"]["metric_type"]
          notes?: string | null
          objective_id?: string | null
          owner_division?: string | null
          owner_person_id?: string | null
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["okr_status"]
          target_value: number
          title: string
          updated_at?: string | null
        }
        Update: {
          baseline_value?: number | null
          created_at?: string | null
          current_value?: number | null
          due_date?: string | null
          id?: string
          metric_type?: Database["public"]["Enums"]["metric_type"]
          notes?: string | null
          objective_id?: string | null
          owner_division?: string | null
          owner_person_id?: string | null
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["okr_status"]
          target_value?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_owner_division_fkey"
            columns: ["owner_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "key_results_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "key_results_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "key_results_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      letters: {
        Row: {
          approval_status: Database["public"]["Enums"]["letter_approval"]
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          letter_number: string | null
          notes: string | null
          output_type: string | null
          pdf_url: string | null
          purpose: string
          recipient_name: string | null
          recipient_organization: string | null
          requester_division: string | null
          requester_id: string
          template_type: Database["public"]["Enums"]["letter_template"]
          updated_at: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["letter_approval"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          letter_number?: string | null
          notes?: string | null
          output_type?: string | null
          pdf_url?: string | null
          purpose: string
          recipient_name?: string | null
          recipient_organization?: string | null
          requester_division?: string | null
          requester_id: string
          template_type: Database["public"]["Enums"]["letter_template"]
          updated_at?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["letter_approval"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          letter_number?: string | null
          notes?: string | null
          output_type?: string | null
          pdf_url?: string | null
          purpose?: string
          recipient_name?: string | null
          recipient_organization?: string | null
          requester_division?: string | null
          requester_id?: string
          template_type?: Database["public"]["Enums"]["letter_template"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "letters_requester_division_fkey"
            columns: ["requester_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "letters_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "letters_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "letters_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      meeting_attendance: {
        Row: {
          created_at: string | null
          id: string
          meeting_id: string | null
          member_id: string | null
          note: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          member_id?: string | null
          note?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          member_id?: string | null
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meeting_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meeting_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      meeting_decisions: {
        Row: {
          created_at: string | null
          decision: string
          due_date: string | null
          generated_task_id: string | null
          id: string
          meeting_id: string | null
          pic_id: string | null
        }
        Insert: {
          created_at?: string | null
          decision: string
          due_date?: string | null
          generated_task_id?: string | null
          id?: string
          meeting_id?: string | null
          pic_id?: string | null
        }
        Update: {
          created_at?: string | null
          decision?: string
          due_date?: string | null
          generated_task_id?: string | null
          id?: string
          meeting_id?: string | null
          pic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_decisions_generated_task_id_fkey"
            columns: ["generated_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_decisions_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meeting_decisions_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meeting_decisions_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_decisions_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      meetings: {
        Row: {
          agenda: string | null
          created_at: string | null
          division: string | null
          id: string
          led_by: string | null
          location: string | null
          meeting_date: string
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes: string | null
          recorded_by: string | null
          related_event_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agenda?: string | null
          created_at?: string | null
          division?: string | null
          id?: string
          led_by?: string | null
          location?: string | null
          meeting_date: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          recorded_by?: string | null
          related_event_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agenda?: string | null
          created_at?: string | null
          division?: string | null
          id?: string
          led_by?: string | null
          location?: string | null
          meeting_date?: string
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          recorded_by?: string | null
          related_event_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "meetings_led_by_fkey"
            columns: ["led_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meetings_led_by_fkey"
            columns: ["led_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meetings_led_by_fkey"
            columns: ["led_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_led_by_fkey"
            columns: ["led_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meetings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meetings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meetings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "meetings_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      mous: {
        Row: {
          company_id: string | null
          created_at: string | null
          deal_id: string | null
          expiry_date: string | null
          id: string
          notes: string | null
          pdf_url: string | null
          renewal_reminder_days: number | null
          signatory_our_side_id: string | null
          signatory_their_name: string | null
          signatory_their_title: string | null
          signed_date: string | null
          status: Database["public"]["Enums"]["mou_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          renewal_reminder_days?: number | null
          signatory_our_side_id?: string | null
          signatory_their_name?: string | null
          signatory_their_title?: string | null
          signed_date?: string | null
          status?: Database["public"]["Enums"]["mou_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          renewal_reminder_days?: number | null
          signatory_our_side_id?: string | null
          signatory_their_name?: string | null
          signatory_their_title?: string | null
          signed_date?: string | null
          status?: Database["public"]["Enums"]["mou_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mous_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mous_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mous_signatory_our_side_id_fkey"
            columns: ["signatory_our_side_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "mous_signatory_our_side_id_fkey"
            columns: ["signatory_our_side_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "mous_signatory_our_side_id_fkey"
            columns: ["signatory_our_side_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mous_signatory_our_side_id_fkey"
            columns: ["signatory_our_side_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          recipient_id: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          recipient_id: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          recipient_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      number_counters: {
        Row: {
          counter_key: string
          current_value: number
          current_year: number
        }
        Insert: {
          counter_key: string
          current_value?: number
          current_year: number
        }
        Update: {
          counter_key?: string
          current_value?: number
          current_year?: number
        }
        Relationships: []
      }
      objectives: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          notes: string | null
          owner_id: string | null
          period: Database["public"]["Enums"]["okr_period"]
          priority: Database["public"]["Enums"]["priority_level"]
          progress_percent: number | null
          status: Database["public"]["Enums"]["okr_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          period: Database["public"]["Enums"]["okr_period"]
          priority?: Database["public"]["Enums"]["priority_level"]
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["okr_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          period?: Database["public"]["Enums"]["okr_period"]
          priority?: Database["public"]["Enums"]["priority_level"]
          progress_percent?: number | null
          status?: Database["public"]["Enums"]["okr_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objectives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "objectives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "objectives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      okr_snapshots: {
        Row: {
          created_at: string | null
          division_progress: Json | null
          id: string
          objectives_achieved: number | null
          objectives_at_risk: number | null
          objectives_avg_progress: number | null
          objectives_off_track: number | null
          objectives_on_track: number | null
          objectives_total: number | null
          period: Database["public"]["Enums"]["okr_period"]
          snapshot_date: string
        }
        Insert: {
          created_at?: string | null
          division_progress?: Json | null
          id?: string
          objectives_achieved?: number | null
          objectives_at_risk?: number | null
          objectives_avg_progress?: number | null
          objectives_off_track?: number | null
          objectives_on_track?: number | null
          objectives_total?: number | null
          period: Database["public"]["Enums"]["okr_period"]
          snapshot_date?: string
        }
        Update: {
          created_at?: string | null
          division_progress?: Json | null
          id?: string
          objectives_achieved?: number | null
          objectives_at_risk?: number | null
          objectives_avg_progress?: number | null
          objectives_off_track?: number | null
          objectives_on_track?: number | null
          objectives_total?: number | null
          period?: Database["public"]["Enums"]["okr_period"]
          snapshot_date?: string
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          active_period: string | null
          created_at: string | null
          id: number
          logo_url: string | null
          org_address: string | null
          org_code: string
          org_email: string | null
          org_name: string
          org_phone: string | null
          updated_at: string | null
        }
        Insert: {
          active_period?: string | null
          created_at?: string | null
          id?: number
          logo_url?: string | null
          org_address?: string | null
          org_code?: string
          org_email?: string | null
          org_name?: string
          org_phone?: string | null
          updated_at?: string | null
        }
        Update: {
          active_period?: string | null
          created_at?: string | null
          id?: number
          logo_url?: string | null
          org_address?: string | null
          org_code?: string
          org_email?: string | null
          org_name?: string
          org_phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      people: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          preferred_channel:
            | Database["public"]["Enums"]["contact_channel"]
            | null
          role_in_relation: Database["public"]["Enums"]["contact_role"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          preferred_channel?:
            | Database["public"]["Enums"]["contact_channel"]
            | null
          role_in_relation?: Database["public"]["Enums"]["contact_role"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          preferred_channel?:
            | Database["public"]["Enums"]["contact_channel"]
            | null
          role_in_relation?: Database["public"]["Enums"]["contact_role"] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          division: string | null
          email: string | null
          full_name: string
          id: string
          joined_at: string | null
          nickname: string | null
          phone: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          division?: string | null
          email?: string | null
          full_name: string
          id: string
          joined_at?: string | null
          nickname?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          division?: string | null
          email?: string | null
          full_name?: string
          id?: string
          joined_at?: string | null
          nickname?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      proposal_votes: {
        Row: {
          cast_at: string | null
          choice: Database["public"]["Enums"]["vote_choice"]
          id: string
          proposal_id: string | null
          voter_id: string | null
        }
        Insert: {
          cast_at?: string | null
          choice: Database["public"]["Enums"]["vote_choice"]
          id?: string
          proposal_id?: string | null
          voter_id?: string | null
        }
        Update: {
          cast_at?: string | null
          choice?: Database["public"]["Enums"]["vote_choice"]
          id?: string
          proposal_id?: string | null
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "warning_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "proposal_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "proposal_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      speakers: {
        Row: {
          bio_short: string | null
          company_id: string | null
          contact_person_id: string | null
          created_at: string | null
          cv_url: string | null
          default_rate_idr: number | null
          direct_email: string | null
          direct_phone: string | null
          expertise: string | null
          full_name: string
          id: string
          notes: string | null
          photo_url: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          bio_short?: string | null
          company_id?: string | null
          contact_person_id?: string | null
          created_at?: string | null
          cv_url?: string | null
          default_rate_idr?: number | null
          direct_email?: string | null
          direct_phone?: string | null
          expertise?: string | null
          full_name: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          bio_short?: string | null
          company_id?: string | null
          contact_person_id?: string | null
          created_at?: string | null
          cv_url?: string | null
          default_rate_idr?: number | null
          direct_email?: string | null
          direct_phone?: string | null
          expertise?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speakers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speakers_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      task_cancel_requests: {
        Row: {
          approver_id: string | null
          approver_response: string | null
          created_at: string | null
          decided_at: string | null
          expires_at: string
          id: string
          reason: string
          requested_by: string
          status: Database["public"]["Enums"]["cancel_request_status"]
          task_id: string
          updated_at: string | null
        }
        Insert: {
          approver_id?: string | null
          approver_response?: string | null
          created_at?: string | null
          decided_at?: string | null
          expires_at?: string
          id?: string
          reason: string
          requested_by: string
          status?: Database["public"]["Enums"]["cancel_request_status"]
          task_id: string
          updated_at?: string | null
        }
        Update: {
          approver_id?: string | null
          approver_response?: string | null
          created_at?: string | null
          decided_at?: string | null
          expires_at?: string
          id?: string
          reason?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["cancel_request_status"]
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_cancel_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "task_cancel_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "task_cancel_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_cancel_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "task_cancel_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "task_cancel_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "task_cancel_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_cancel_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "task_cancel_requests_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          blocked_by_person_id: string | null
          blocked_reason: string | null
          blocked_since: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          division: string | null
          due_date: string | null
          id: string
          is_private: boolean
          key_result_id: string | null
          origin_note: string | null
          origin_type: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          related_deal_id: string | null
          related_event_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          blocked_by_person_id?: string | null
          blocked_reason?: string | null
          blocked_since?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          division?: string | null
          due_date?: string | null
          id?: string
          is_private?: boolean
          key_result_id?: string | null
          origin_note?: string | null
          origin_type?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          related_deal_id?: string | null
          related_event_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          blocked_by_person_id?: string | null
          blocked_reason?: string | null
          blocked_since?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          division?: string | null
          due_date?: string | null
          id?: string
          is_private?: boolean
          key_result_id?: string | null
          origin_note?: string | null
          origin_type?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          related_deal_id?: string | null
          related_event_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_person_id_fkey"
            columns: ["blocked_by_person_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_person_id_fkey"
            columns: ["blocked_by_person_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_person_id_fkey"
            columns: ["blocked_by_person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_person_id_fkey"
            columns: ["blocked_by_person_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tasks_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_deal_id_fkey"
            columns: ["related_deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_categories: {
        Row: {
          color_hex: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          type: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          type: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      warning_proposals: {
        Row: {
          created_at: string | null
          eligible_voters_count: number | null
          id: string
          linked_coaching_ids: string[] | null
          linked_meeting_ids: string[] | null
          linked_task_ids: string[] | null
          outcome_recorded_at: string | null
          proposed_by: string
          proposed_level: Database["public"]["Enums"]["warning_level"]
          reason: string
          response_submitted_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          target_member_id: string
          target_response: string | null
          updated_at: string | null
          voter_scope: string
          voting_ends_at: string
          voting_starts_at: string | null
        }
        Insert: {
          created_at?: string | null
          eligible_voters_count?: number | null
          id?: string
          linked_coaching_ids?: string[] | null
          linked_meeting_ids?: string[] | null
          linked_task_ids?: string[] | null
          outcome_recorded_at?: string | null
          proposed_by: string
          proposed_level: Database["public"]["Enums"]["warning_level"]
          reason: string
          response_submitted_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          target_member_id: string
          target_response?: string | null
          updated_at?: string | null
          voter_scope: string
          voting_ends_at: string
          voting_starts_at?: string | null
        }
        Update: {
          created_at?: string | null
          eligible_voters_count?: number | null
          id?: string
          linked_coaching_ids?: string[] | null
          linked_meeting_ids?: string[] | null
          linked_task_ids?: string[] | null
          outcome_recorded_at?: string | null
          proposed_by?: string
          proposed_level?: Database["public"]["Enums"]["warning_level"]
          reason?: string
          response_submitted_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          target_member_id?: string
          target_response?: string | null
          updated_at?: string | null
          voter_scope?: string
          voting_ends_at?: string
          voting_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warning_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warning_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warning_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warning_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warning_proposals_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warning_proposals_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warning_proposals_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warning_proposals_target_member_id_fkey"
            columns: ["target_member_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      warnings: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          effective_until: string | null
          id: string
          issued_at: string | null
          issued_by: string
          level: Database["public"]["Enums"]["warning_level"]
          linked_coaching_ids: string[] | null
          linked_meeting_ids: string[] | null
          linked_proposal_id: string | null
          linked_task_ids: string[] | null
          member_acknowledged: boolean | null
          member_id: string
          member_response: string | null
          reason: string
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          source: Database["public"]["Enums"]["warning_source"]
          status: Database["public"]["Enums"]["warning_status"]
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          effective_until?: string | null
          id?: string
          issued_at?: string | null
          issued_by: string
          level: Database["public"]["Enums"]["warning_level"]
          linked_coaching_ids?: string[] | null
          linked_meeting_ids?: string[] | null
          linked_proposal_id?: string | null
          linked_task_ids?: string[] | null
          member_acknowledged?: boolean | null
          member_id: string
          member_response?: string | null
          reason: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          source?: Database["public"]["Enums"]["warning_source"]
          status?: Database["public"]["Enums"]["warning_status"]
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          effective_until?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string
          level?: Database["public"]["Enums"]["warning_level"]
          linked_coaching_ids?: string[] | null
          linked_meeting_ids?: string[] | null
          linked_proposal_id?: string | null
          linked_task_ids?: string[] | null
          member_acknowledged?: boolean | null
          member_id?: string
          member_response?: string | null
          reason?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          source?: Database["public"]["Enums"]["warning_source"]
          status?: Database["public"]["Enums"]["warning_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warnings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warnings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warnings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warnings_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warnings_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "warnings_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
    }
    Views: {
      announcement_read_status: {
        Row: {
          announcement_id: string | null
          requires_ack: boolean | null
          scope: Database["public"]["Enums"]["announcement_scope"] | null
          target_division: string | null
          title: string | null
          total_read: number | null
          total_target: number | null
        }
        Insert: {
          announcement_id?: string | null
          requires_ack?: boolean | null
          scope?: Database["public"]["Enums"]["announcement_scope"] | null
          target_division?: string | null
          title?: string | null
          total_read?: never
          total_target?: never
        }
        Update: {
          announcement_id?: string | null
          requires_ack?: boolean | null
          scope?: Database["public"]["Enums"]["announcement_scope"] | null
          target_division?: string | null
          title?: string | null
          total_read?: never
          total_target?: never
        }
        Relationships: [
          {
            foreignKeyName: "announcements_target_division_fkey"
            columns: ["target_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      assignment_progress: {
        Row: {
          assignment_id: string | null
          due_date: string | null
          scope: Database["public"]["Enums"]["assignment_scope"] | null
          target_division: string | null
          title: string | null
          total_submitted: number | null
          total_target: number | null
        }
        Insert: {
          assignment_id?: string | null
          due_date?: string | null
          scope?: Database["public"]["Enums"]["assignment_scope"] | null
          target_division?: string | null
          title?: string | null
          total_submitted?: never
          total_target?: never
        }
        Update: {
          assignment_id?: string | null
          due_date?: string | null
          scope?: Database["public"]["Enums"]["assignment_scope"] | null
          target_division?: string | null
          title?: string | null
          total_submitted?: never
          total_target?: never
        }
        Relationships: [
          {
            foreignKeyName: "assignments_target_division_fkey"
            columns: ["target_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      blocker_summary: {
        Row: {
          hari_terlama: number | null
          jumlah_task_macet: number | null
          macet_sejak_terlama: string | null
          penyumbat_divisi: string | null
          penyumbat_id: string | null
          penyumbat_nama: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_division_fkey"
            columns: ["penyumbat_divisi"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "tasks_blocked_by_person_id_fkey"
            columns: ["penyumbat_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_person_id_fkey"
            columns: ["penyumbat_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_person_id_fkey"
            columns: ["penyumbat_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_blocked_by_person_id_fkey"
            columns: ["penyumbat_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      cash_balance: {
        Row: {
          saldo_kas: number | null
          total_keluar: number | null
          total_masuk: number | null
        }
        Relationships: []
      }
      cashflow_projection: {
        Row: {
          pemasukan_perkiraan_30h: number | null
          pemasukan_perkiraan_60h: number | null
          pemasukan_perkiraan_90h: number | null
          pengeluaran_rata2_bulanan: number | null
          proyeksi_30h: number | null
          proyeksi_60h: number | null
          proyeksi_90h: number | null
          saldo_sekarang: number | null
        }
        Relationships: []
      }
      collection_progress: {
        Row: {
          amount_per_person: number | null
          collection_id: string | null
          due_date: string | null
          kind: Database["public"]["Enums"]["collection_kind"] | null
          status: Database["public"]["Enums"]["collection_status"] | null
          target_division: string | null
          title: string | null
          total_lunas: number | null
          total_nunggu: number | null
          total_tagihan: number | null
          total_terkumpul: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_target_division_fkey"
            columns: ["target_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      financial_wallets: {
        Row: {
          kas_keluar_total: number | null
          kas_masuk_total: number | null
          kas_saldo: number | null
          ops_keluar_total: number | null
          ops_masuk_total: number | null
          ops_saldo: number | null
          total_saldo: number | null
        }
        Relationships: []
      }
      member_holdings: {
        Row: {
          deal_aktif: number | null
          divisi_dipimpin: number | null
          division: string | null
          event_dipic: number | null
          full_name: string | null
          kr_ditanggung: number | null
          member_id: string | null
          mou_ditandatangani: number | null
          task_aktif: number | null
        }
        Insert: {
          deal_aktif?: never
          divisi_dipimpin?: never
          division?: string | null
          event_dipic?: never
          full_name?: string | null
          kr_ditanggung?: never
          member_id?: string | null
          mou_ditandatangani?: never
          task_aktif?: never
        }
        Update: {
          deal_aktif?: never
          divisi_dipimpin?: never
          division?: string | null
          event_dipic?: never
          full_name?: string | null
          kr_ditanggung?: never
          member_id?: string | null
          mou_ditandatangani?: never
          task_aktif?: never
        }
        Relationships: [
          {
            foreignKeyName: "profiles_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      member_progress: {
        Row: {
          deals_active: number | null
          deals_closed: number | null
          deals_value_closed: number | null
          division: string | null
          full_name: string | null
          kr_active: number | null
          kr_avg_progress: number | null
          member_id: string | null
          nickname: string | null
          photo_url: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          tasks_active: number | null
          tasks_done: number | null
          tasks_overdue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
      monthly_cashflow: {
        Row: {
          arah: string | null
          bulan: string | null
          category: string | null
          dompet: string | null
          total: number | null
        }
        Relationships: []
      }
      reimbursement_aging: {
        Row: {
          amount_idr: number | null
          days_outstanding: number | null
          expense_date: string | null
          id: string | null
          purpose: string | null
          request_number: string | null
          requester_division: string | null
          requester_id: string | null
          requester_name: string | null
          status: Database["public"]["Enums"]["fund_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fund_requests_requester_division_fkey"
            columns: ["requester_division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "member_holdings"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "member_progress"
            referencedColumns: ["member_id"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "workload_distribution"
            referencedColumns: ["member_id"]
          },
        ]
      }
      workload_distribution: {
        Row: {
          beban_aktif: number | null
          beban_prioritas_tinggi: number | null
          division: string | null
          full_name: string | null
          macet: number | null
          member_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          tunggakan: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_division_fkey"
            columns: ["division"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      auto_approve_cancel_requests: { Args: never; Returns: undefined }
      auto_reject_help_requests: { Args: never; Returns: undefined }
      can_access_division: { Args: { target_div: string }; Returns: boolean }
      can_access_event: { Args: { target_event: string }; Returns: boolean }
      claim_invite: { Args: { p_code: string }; Returns: string }
      close_expired_proposals: { Args: never; Returns: undefined }
      create_task_from_decision: {
        Args: { p_decision_id: string }
        Returns: string
      }
      financial_category_breakdown: {
        Args: { p_arah: string; p_end: string; p_start: string }
        Returns: {
          category: string
          dompet: string
          total: number
        }[]
      }
      financial_period_summary: {
        Args: { p_end: string; p_start: string }
        Returns: {
          kas_keluar: number
          kas_masuk: number
          kas_net: number
          ops_keluar: number
          ops_masuk: number
          ops_net: number
          total_keluar: number
          total_masuk: number
          total_net: number
        }[]
      }
      generate_collection_bills: {
        Args: { p_collection: string }
        Returns: number
      }
      generate_fund_request_number: { Args: never; Returns: string }
      generate_letter_number: {
        Args: {
          div: string
          tmpl: Database["public"]["Enums"]["letter_template"]
        }
        Returns: string
      }
      get_my_division: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_voted: { Args: { p_proposal: string }; Returns: boolean }
      is_event_pic: { Args: { target_event: string }; Returns: boolean }
      is_my_assignment: { Args: { p_assignment: string }; Returns: boolean }
      member_report: {
        Args: { p_end: string; p_member: string; p_start: string }
        Returns: {
          assignments_submitted: number
          assignments_total: number
          attendance_rate: number
          avg_days_late: number
          completion_rate: number
          deals_closed: number
          deals_owned: number
          deals_value: number
          division: string
          full_name: string
          kas_lunas: number
          kas_rate: number
          kas_total: number
          kr_avg_progress: number
          kr_owned: number
          meetings_alpa: number
          meetings_hadir: number
          meetings_total: number
          member_id: string
          role: Database["public"]["Enums"]["user_role"]
          submission_rate: number
          tasks_blocked: number
          tasks_done: number
          tasks_overdue: number
          tasks_total: number
        }[]
      }
      next_counter: { Args: { p_key: string }; Returns: number }
      notify_by_role: {
        Args: {
          p_body: string
          p_link: string
          p_roles: Database["public"]["Enums"]["user_role"][]
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          p_body: string
          p_link: string
          p_title: string
          p_type: string
          p_user: string
        }
        Returns: undefined
      }
      proposal_vote_summary: {
        Args: { p_proposal: string }
        Returns: {
          abstain: number
          agree: number
          disagree: number
          eligible: number
          finished: boolean
          votes_cast: number
        }[]
      }
      remind_stale_tasks: { Args: never; Returns: undefined }
      run_daily_reminders: { Args: never; Returns: undefined }
      take_okr_snapshot: {
        Args: { p_period: Database["public"]["Enums"]["okr_period"] }
        Returns: undefined
      }
      validate_invite: {
        Args: { p_code: string }
        Returns: {
          division: string
          intended_email: string
          message: string
          role: Database["public"]["Enums"]["user_role"]
          valid: boolean
        }[]
      }
    }
    Enums: {
      announcement_level: "Mendesak" | "Penting" | "Info"
      announcement_scope: "Organisasi" | "Divisi"
      assignment_scope: "Semua" | "Divisi" | "Individu"
      budget_status: "On_Budget" | "Warning" | "Over_Budget"
      cancel_request_status:
        | "Pending"
        | "Approved"
        | "Rejected"
        | "Auto_Approved"
      coaching_topic:
        | "Reguler"
        | "Beban_Kerja"
        | "Kinerja"
        | "Kesejahteraan"
        | "Konflik"
        | "Pengembangan"
        | "Lainnya"
      collection_kind: "Kas_Rutin" | "Pengumpulan"
      collection_status: "Aktif" | "Selesai" | "Dibatalkan"
      company_status: "Cold" | "Warm" | "Active" | "Dormant" | "Blacklist"
      company_type:
        | "Sponsor"
        | "Media"
        | "Speaker_Source"
        | "Institutional"
        | "Vendor"
      contact_channel: "WA" | "Email" | "Phone"
      contact_role: "Decision_Maker" | "Influencer" | "Executor" | "Gatekeeper"
      contribution_kind:
        | "Membantu_Rekan"
        | "Inisiatif"
        | "Melebihi_Ekspektasi"
        | "Menutup_Kekosongan"
        | "Ide_Berdampak"
        | "Lainnya"
      deal_stage:
        | "Prospect"
        | "Contacted"
        | "Pitched"
        | "Negotiating"
        | "Deal"
        | "Rejected"
        | "Ghosted"
      deal_type:
        | "Sponsorship"
        | "Media_Partnership"
        | "Speaker"
        | "Institutional_MoU"
        | "In_kind"
      event_status: "Planning" | "Preparation" | "Live" | "Done" | "Cancelled"
      event_type:
        | "Flagship"
        | "Workshop"
        | "Talkshow"
        | "Internal"
        | "Competition"
        | "Other"
      fee_status: "Not_Applicable" | "Pending" | "Paid"
      fund_status:
        | "Draft"
        | "Submitted"
        | "Under_Review"
        | "Approved"
        | "Rejected"
        | "Disbursed"
        | "Reported"
      fund_urgency: "Normal" | "Urgent" | "Emergency"
      help_request_status:
        | "Pending"
        | "Approved"
        | "Rejected"
        | "Cancelled_By_Requester"
      invite_kind: "Kode_Divisi" | "Link_Personal"
      letter_approval:
        | "Auto_Approved"
        | "Pending_Review"
        | "Approved"
        | "Rejected"
        | "Cancelled"
      letter_template:
        | "Sponsor_Outreach"
        | "Media_Outreach"
        | "Speaker_Invitation"
        | "Institutional"
        | "Internal_Task"
        | "Custom"
      meeting_type:
        | "Rapat_Besar"
        | "Rapat_Divisi"
        | "Rapat_Event"
        | "Rapat_BPH"
        | "Lainnya"
      member_status: "Active" | "Alumni" | "Inactive"
      metric_type: "Number" | "Percentage" | "Currency_IDR" | "Boolean"
      mou_status: "Draft" | "Under_Review" | "Signed" | "Expired" | "Terminated"
      okr_period:
        | "Kepengurusan_2026"
        | "Semester_1_2026"
        | "Semester_2_2026"
        | "Kuartal_1_2026"
        | "Kuartal_2_2026"
        | "Kuartal_3_2026"
        | "Kuartal_4_2026"
      okr_status:
        | "Not_Started"
        | "On_Track"
        | "At_Risk"
        | "Off_Track"
        | "Achieved"
        | "Cancelled"
      payment_status:
        | "Belum_Bayar"
        | "Menunggu_Verifikasi"
        | "Lunas"
        | "Ditolak"
      priority_level: "P0" | "P1" | "P2"
      proposal_status: "Voting" | "Lolos" | "Gagal" | "Dibatalkan"
      speaker_confirmation: "Invited" | "Confirmed" | "Declined" | "Cancelled"
      submission_visibility: "Supervisor_Saja" | "Supervisor_Ketua_Kadiv"
      task_priority: "Low" | "Medium" | "High" | "Critical"
      task_status: "Todo" | "In_Progress" | "Blocked" | "Done" | "Cancelled"
      transaction_type: "Income" | "Expense"
      transaction_visibility:
        | "Public_Org"
        | "Kadiv_And_Above"
        | "Controller_Only"
      user_role:
        | "Anggota"
        | "Kadiv"
        | "Waketu"
        | "Ketua"
        | "Sekretaris"
        | "Controller"
        | "Supervisor"
      vote_choice: "Setuju" | "Tidak_Setuju" | "Abstain"
      warning_level: "Teguran_Lisan" | "SP1" | "SP2" | "SP3" | "Pemberhentian"
      warning_source: "Langsung" | "Usulan_Vote"
      warning_status: "Berlaku" | "Dicabut" | "Selesai"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      announcement_level: ["Mendesak", "Penting", "Info"],
      announcement_scope: ["Organisasi", "Divisi"],
      assignment_scope: ["Semua", "Divisi", "Individu"],
      budget_status: ["On_Budget", "Warning", "Over_Budget"],
      cancel_request_status: [
        "Pending",
        "Approved",
        "Rejected",
        "Auto_Approved",
      ],
      coaching_topic: [
        "Reguler",
        "Beban_Kerja",
        "Kinerja",
        "Kesejahteraan",
        "Konflik",
        "Pengembangan",
        "Lainnya",
      ],
      collection_kind: ["Kas_Rutin", "Pengumpulan"],
      collection_status: ["Aktif", "Selesai", "Dibatalkan"],
      company_status: ["Cold", "Warm", "Active", "Dormant", "Blacklist"],
      company_type: [
        "Sponsor",
        "Media",
        "Speaker_Source",
        "Institutional",
        "Vendor",
      ],
      contact_channel: ["WA", "Email", "Phone"],
      contact_role: ["Decision_Maker", "Influencer", "Executor", "Gatekeeper"],
      contribution_kind: [
        "Membantu_Rekan",
        "Inisiatif",
        "Melebihi_Ekspektasi",
        "Menutup_Kekosongan",
        "Ide_Berdampak",
        "Lainnya",
      ],
      deal_stage: [
        "Prospect",
        "Contacted",
        "Pitched",
        "Negotiating",
        "Deal",
        "Rejected",
        "Ghosted",
      ],
      deal_type: [
        "Sponsorship",
        "Media_Partnership",
        "Speaker",
        "Institutional_MoU",
        "In_kind",
      ],
      event_status: ["Planning", "Preparation", "Live", "Done", "Cancelled"],
      event_type: [
        "Flagship",
        "Workshop",
        "Talkshow",
        "Internal",
        "Competition",
        "Other",
      ],
      fee_status: ["Not_Applicable", "Pending", "Paid"],
      fund_status: [
        "Draft",
        "Submitted",
        "Under_Review",
        "Approved",
        "Rejected",
        "Disbursed",
        "Reported",
      ],
      fund_urgency: ["Normal", "Urgent", "Emergency"],
      help_request_status: [
        "Pending",
        "Approved",
        "Rejected",
        "Cancelled_By_Requester",
      ],
      invite_kind: ["Kode_Divisi", "Link_Personal"],
      letter_approval: [
        "Auto_Approved",
        "Pending_Review",
        "Approved",
        "Rejected",
        "Cancelled",
      ],
      letter_template: [
        "Sponsor_Outreach",
        "Media_Outreach",
        "Speaker_Invitation",
        "Institutional",
        "Internal_Task",
        "Custom",
      ],
      meeting_type: [
        "Rapat_Besar",
        "Rapat_Divisi",
        "Rapat_Event",
        "Rapat_BPH",
        "Lainnya",
      ],
      member_status: ["Active", "Alumni", "Inactive"],
      metric_type: ["Number", "Percentage", "Currency_IDR", "Boolean"],
      mou_status: ["Draft", "Under_Review", "Signed", "Expired", "Terminated"],
      okr_period: [
        "Kepengurusan_2026",
        "Semester_1_2026",
        "Semester_2_2026",
        "Kuartal_1_2026",
        "Kuartal_2_2026",
        "Kuartal_3_2026",
        "Kuartal_4_2026",
      ],
      okr_status: [
        "Not_Started",
        "On_Track",
        "At_Risk",
        "Off_Track",
        "Achieved",
        "Cancelled",
      ],
      payment_status: [
        "Belum_Bayar",
        "Menunggu_Verifikasi",
        "Lunas",
        "Ditolak",
      ],
      priority_level: ["P0", "P1", "P2"],
      proposal_status: ["Voting", "Lolos", "Gagal", "Dibatalkan"],
      speaker_confirmation: ["Invited", "Confirmed", "Declined", "Cancelled"],
      submission_visibility: ["Supervisor_Saja", "Supervisor_Ketua_Kadiv"],
      task_priority: ["Low", "Medium", "High", "Critical"],
      task_status: ["Todo", "In_Progress", "Blocked", "Done", "Cancelled"],
      transaction_type: ["Income", "Expense"],
      transaction_visibility: [
        "Public_Org",
        "Kadiv_And_Above",
        "Controller_Only",
      ],
      user_role: [
        "Anggota",
        "Kadiv",
        "Waketu",
        "Ketua",
        "Sekretaris",
        "Controller",
        "Supervisor",
      ],
      vote_choice: ["Setuju", "Tidak_Setuju", "Abstain"],
      warning_level: ["Teguran_Lisan", "SP1", "SP2", "SP3", "Pemberhentian"],
      warning_source: ["Langsung", "Usulan_Vote"],
      warning_status: ["Berlaku", "Dicabut", "Selesai"],
    },
  },
} as const
