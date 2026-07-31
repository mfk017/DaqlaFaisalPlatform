import { requireApproved } from "@/lib/auth";
import { LiveBoardClient } from "@/components/dashboard/LiveBoardClient";
import { db } from "@/lib/db";

export default async function LiveBoardPage() {
  // Ensure only authenticated users can view the live board
  await requireApproved();

  // Initial data fetch for SSR, then client component will poll every 15s
  return <LiveBoardClient />;
}
