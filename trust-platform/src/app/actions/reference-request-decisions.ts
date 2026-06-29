"use server";

import { revalidatePath } from "next/cache";

import {
  type ReferenceRequestDecision,
  updateReferenceRequestStatus,
} from "@/data/reference-requests";

async function decideReferenceRequest({
  requestId,
  status,
}: {
  requestId: string;
  status: ReferenceRequestDecision;
}) {
  await updateReferenceRequestStatus({ requestId, status });
  revalidatePath("/dashboard");
}

export async function acceptReferenceRequest(requestId: string) {
  await decideReferenceRequest({ requestId, status: "accepted" });
}

export async function declineReferenceRequest(requestId: string) {
  await decideReferenceRequest({ requestId, status: "declined" });
}
