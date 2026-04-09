"use client";

import { useParams } from "next/navigation";
import ProfileView from "../ProfileView";

export default function ProfileByIdPage() {
  const params = useParams();
  const rawId = params?.id;
  const profileId = Array.isArray(rawId) ? rawId[0] : (rawId as string | undefined);

  return <ProfileView profileId={profileId} />;
}
