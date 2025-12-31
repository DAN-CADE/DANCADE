import { NextResponse } from "next/server";
import { fetchUserInventory } from "@/lib/supabase/inventory";

export async function POST(req : Request) {
  try {
    const body = await req.json()
    const {userId} = body

    const inventory = await fetchUserInventory(userId);

    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    console.error("[INVENTORY_GET_ERROR]", error);

    return NextResponse.json(
      { message: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
