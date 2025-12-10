import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GroupResponse {
  id: string;
  invite_code: string;
  name: string | null;
  leader_nickname: string;
  created_at: string;
  expires_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();

    // Find active group by invite code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("groups")
      .select("id, invite_code, name, leader_nickname, created_at, expires_at")
      .eq("invite_code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Group not found or expired" },
        { status: 404 }
      );
    }

    const group = data as GroupResponse;

    // Get member count separately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: memberCount } = await (supabase as any)
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", group.id)
      .is("left_at", null);

    return NextResponse.json({
      id: group.id,
      inviteCode: group.invite_code,
      name: group.name,
      leaderNickname: group.leader_nickname,
      createdAt: group.created_at,
      expiresAt: group.expires_at,
      memberCount: memberCount || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/groups/[code]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { nickname, peerId } = body;

    if (!nickname || !peerId) {
      return NextResponse.json(
        { error: "Nickname and peer ID are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated (optional)
    const { data: { user } } = await supabase.auth.getUser();

    // Find the group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: groupData, error: groupError } = await (supabase as any)
      .from("groups")
      .select("id, invite_code, name, leader_nickname")
      .eq("invite_code", code.toUpperCase())
      .eq("is_active", true)
      .single();

    if (groupError || !groupData) {
      return NextResponse.json(
        { error: "Group not found or expired" },
        { status: 404 }
      );
    }

    const group = groupData as {
      id: string;
      invite_code: string;
      name: string | null;
      leader_nickname: string;
    };

    // Add member to group (upsert to handle reconnects)
    const memberData = {
      group_id: group.id,
      peer_id: peerId as string,
      nickname: (nickname as string).trim(),
      user_id: user?.id || null,
      is_leader: false,
      left_at: null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: memberError } = await (supabase as any)
      .from("group_members")
      .upsert(memberData, { onConflict: "group_id,peer_id" });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Failed to join group" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: group.id,
      inviteCode: group.invite_code,
      name: group.name,
      leaderNickname: group.leader_nickname,
    });
  } catch (error) {
    console.error("Error in POST /api/groups/[code]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
