import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface GroupRow {
  id: string;
  invite_code: string;
  name: string | null;
  leader_nickname: string;
  created_at: string;
  expires_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, leaderNickname, leaderPeerId } = body;

    if (!leaderNickname || !leaderPeerId) {
      return NextResponse.json(
        { error: "Leader nickname and peer ID are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated (optional)
    const { data: { user } } = await supabase.auth.getUser();

    // Create the group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: groupData, error: groupError } = await (supabase as any)
      .from("groups")
      .insert({
        name: name || null,
        leader_nickname: leaderNickname,
        leader_peer_id: leaderPeerId,
        leader_user_id: user?.id || null,
      })
      .select()
      .single();

    if (groupError || !groupData) {
      console.error("Error creating group:", groupError);
      return NextResponse.json(
        { error: "Failed to create group" },
        { status: 500 }
      );
    }

    const group = groupData as GroupRow;

    // Add leader as a member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: memberError } = await (supabase as any)
      .from("group_members")
      .insert({
        group_id: group.id,
        peer_id: leaderPeerId,
        nickname: leaderNickname,
        user_id: user?.id || null,
        is_leader: true,
      });

    if (memberError) {
      console.error("Error adding leader as member:", memberError);
      // Don't fail the request, group is created
    }

    return NextResponse.json({
      id: group.id,
      inviteCode: group.invite_code,
      name: group.name,
      leaderNickname: group.leader_nickname,
      createdAt: group.created_at,
      expiresAt: group.expires_at,
    });
  } catch (error) {
    console.error("Error in POST /api/groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
