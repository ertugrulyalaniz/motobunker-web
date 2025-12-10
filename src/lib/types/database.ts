export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          invite_code: string;
          name: string | null;
          leader_peer_id: string;
          leader_nickname: string;
          leader_user_id: string | null;
          created_at: string;
          expires_at: string;
          is_active: boolean;
          max_riders: number;
        };
        Insert: {
          id?: string;
          invite_code?: string;
          name?: string | null;
          leader_peer_id: string;
          leader_nickname: string;
          leader_user_id?: string | null;
          created_at?: string;
          expires_at?: string;
          is_active?: boolean;
          max_riders?: number;
        };
        Update: {
          id?: string;
          invite_code?: string;
          name?: string | null;
          leader_peer_id?: string;
          leader_nickname?: string;
          leader_user_id?: string | null;
          created_at?: string;
          expires_at?: string;
          is_active?: boolean;
          max_riders?: number;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          peer_id: string;
          nickname: string;
          user_id: string | null;
          joined_at: string;
          left_at: string | null;
          is_leader: boolean;
        };
        Insert: {
          id?: string;
          group_id: string;
          peer_id: string;
          nickname: string;
          user_id?: string | null;
          joined_at?: string;
          left_at?: string | null;
          is_leader?: boolean;
        };
        Update: {
          id?: string;
          group_id?: string;
          peer_id?: string;
          nickname?: string;
          user_id?: string | null;
          joined_at?: string;
          left_at?: string | null;
          is_leader?: boolean;
        };
      };
      user_group_history: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          group_name: string | null;
          invite_code: string | null;
          role: "leader" | "rider";
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          group_name?: string | null;
          invite_code?: string | null;
          role: "leader" | "rider";
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          group_id?: string | null;
          group_name?: string | null;
          invite_code?: string | null;
          role?: "leader" | "rider";
          joined_at?: string;
          left_at?: string | null;
        };
      };
    };
    Functions: {
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      cleanup_expired_groups: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_group_by_code: {
        Args: { code: string };
        Returns: {
          id: string;
          invite_code: string;
          name: string | null;
          leader_nickname: string;
          created_at: string;
          member_count: number;
        }[];
      };
    };
  };
}

// Convenience types
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type GroupMemberInsert = Database["public"]["Tables"]["group_members"]["Insert"];
