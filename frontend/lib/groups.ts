"use client";

import { API_URL } from "@/lib/api";

export interface GroupSummary {
  id: number;
  userId: number;
  title: string;
  description: string;
  createdAt: string;
  requestId: number;
}

export interface GroupAuthor {
  id: string;
  nickname: string;
  firstname: string;
  lastname: string;
  avatar: string;
}

export interface GroupDetails {
  group: GroupSummary;
  author: GroupAuthor;
  totalMembers: number;
}

export interface GroupEvent {
  id: number;
  groupId: number;
  title: string;
  description: string;
  eventDate: string;
  createdAt: string;
  totalGoing: number;
  totalNotGoing: number;
  vote: string;
  author: GroupAuthor;
}

export interface GroupMember {
  id: string;
  nickname: string;
  firstname: string;
  lastname: string;
  avatar: string;
}

export interface GroupPost {
  id: string;
  title: string;
  description: string;
  createDate: string;
  totalComments: number;
  mediaLink: string;
  image: string;
  author: GroupAuthor;
}

type RequestOptions = RequestInit & {
  allowFallbackStatuses?: number[];
};

class ApiRequestError extends Error {
  status?: number;
  payload?: any;
}

function toNumber(value: any, fallback = 0) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function toString(value: any, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function pick<T = any>(source: any, keys: string[], fallback?: T): T {
  for (const key of keys) {
    if (source && source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return fallback as T;
}

async function requestJson(endpoint: string, options: RequestInit = {}) {
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new ApiRequestError(
      payload?.error || payload?.errors || payload?.message || response.statusText
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function requestWithFallback<T>(endpoints: string[], options: RequestOptions = {}): Promise<T> {
  let lastError: any;
  const fallbackStatuses = options.allowFallbackStatuses || [404, 405];

  for (const endpoint of endpoints) {
    try {
      return await requestJson(endpoint, options);
    } catch (error: any) {
      lastError = error;
      if (!fallbackStatuses.includes(error?.status)) {
        throw error;
      }
    }
  }

  throw lastError;
}

function normalizeAuthor(raw: any): GroupAuthor {
  return {
    id: toString(pick(raw, ["id", "ID"], "")),
    nickname: toString(pick(raw, ["nickname", "Nickname"], "")),
    firstname: toString(pick(raw, ["firstname", "Firstname", "first_name"], "")),
    lastname: toString(pick(raw, ["lastname", "Lastname", "last_name"], "")),
    avatar: toString(pick(raw, ["avatar", "Avatar", "avatar_url", "AvatarURL"], "")),
  };
}

function normalizeGroup(raw: any): GroupSummary {
  return {
    id: toNumber(pick(raw, ["id", "ID"], 0)),
    userId: toNumber(pick(raw, ["user_id", "userId", "UserID"], 0)),
    title: toString(pick(raw, ["title", "Title"], "")),
    description: toString(pick(raw, ["description", "Description"], "")),
    createdAt: toString(pick(raw, ["created_at", "createdAt", "CreateDate"], "")),
    requestId: toNumber(pick(raw, ["request_id", "requestId", "RequestID"], 0)),
  };
}

function normalizeEvent(raw: any): GroupEvent {
  return {
    id: toNumber(pick(raw, ["id", "ID"], 0)),
    groupId: toNumber(pick(raw, ["group_id", "groupId", "GroupId"], 0)),
    title: toString(pick(raw, ["title", "Title"], "")),
    description: toString(pick(raw, ["description", "Description", "descreption"], "")),
    eventDate: toString(pick(raw, ["event_date", "eventDate", "EventDate"], "")),
    createdAt: toString(pick(raw, ["created_at", "createdAt", "CreateDate"], "")),
    totalGoing: toNumber(pick(raw, ["total_going", "totalGoing", "TotalGoing"], 0)),
    totalNotGoing: toNumber(pick(raw, ["total_not_going", "totalNotGoing", "TotalNotGoing"], 0)),
    vote: toString(pick(raw, ["vote", "Vote", "user_vote"], "")),
    author: normalizeAuthor(pick(raw, ["author", "Author"], {})),
  };
}

function normalizeMember(raw: any): GroupMember {
  return normalizeAuthor(raw);
}

function normalizePost(raw: any): GroupPost {
  return {
    id: toString(pick(raw, ["id", "ID"], "")),
    title: toString(pick(raw, ["title", "Title"], "")),
    description: toString(pick(raw, ["description", "Description", "content"], "")),
    createDate: toString(pick(raw, ["createDate", "created_at", "createdAt"], "")),
    totalComments: toNumber(pick(raw, ["total_comments", "totalComments", "comments"], 0)),
    mediaLink: toString(pick(raw, ["media_link", "mediaLink", "MediaLink"], "")),
    image: toString(pick(raw, ["image", "ImageURL"], "")),
    author: normalizeAuthor(pick(raw, ["author", "Author"], raw.author || raw.Author || raw)),
  };
}

export async function fetchJoinedGroups() {
  const response = await requestWithFallback<any>([
    "/api/v1/groups/joined",
    "/groups/joined",
  ]);

  const groups = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  return groups.map(normalizeGroup);
}

export async function fetchSuggestedGroups() {
  const response = await requestWithFallback<any>([
    "/api/v1/groups/suggested",
    "/groups/suggested",
  ]);

  const groups = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  return groups.map(normalizeGroup);
}

export async function createGroup(payload: { title: string; description: string }) {
  const response = await requestWithFallback<any>(
    ["/api/groups/create", "/groups"],
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  console.log("that is the response from our backend ",response)
  if(response==null){
    return
  }
  return normalizeGroup(response?.data || response);
}

export async function createJoinRequest(groupId: number, ownerId: number) {
  return requestWithFallback<any>(
    ["/api/v1/groups/request", "/api/v1/groups/requests", "/groups/request"],
    {
      method: "POST",
      body: JSON.stringify({
        group_id: groupId,
        requested_id: [ownerId],
        type: "demande",
      }),
    }
  );
}

export async function fetchGroupDetails(groupId: string | number) {
  const response = await requestWithFallback<any>([
    `/api/v1/groups/joined/${groupId}`,
    `/groups/joined/${groupId}`,
    `/api/v1/groups/${groupId}`,
  ]);

  const raw = response?.data || response;
  return {
    group: normalizeGroup(raw?.group || raw),
    author: normalizeAuthor(raw?.author || {}),
    totalMembers: toNumber(pick(raw, ["total_members", "totalMembers"], 0)),
  } as GroupDetails;
}

export async function fetchGroupEvents(groupId: string | number) {
  const response = await requestWithFallback<any>([
    `/api/v1/groups/joined/${groupId}/events`,
    `/groups/joined/${groupId}/events`,
  ]);

  const events = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  return events.map(normalizeEvent);
}

export async function createGroupEvent(
  groupId: string | number,
  payload: { title: string; description: string; event_date: string }
) {
  return requestWithFallback<any>(
    [
      `/api/v1/groups/joined/${groupId}/events`,
      `/groups/joined/${groupId}/events`,
    ],
    {
      method: "POST",
      body: JSON.stringify({
        group_id: toNumber(groupId),
        title: payload.title,
        description: payload.description,
        event_date: payload.event_date,
      }),
    }
  );
}

export async function voteOnGroupEvent(groupId: string | number, eventId: number, vote: string) {
  return requestWithFallback<any>(
    [
      `/api/v1/groups/joined/${groupId}/events/vote`,
      `/api/v1/groups/events/vote`,
      `/groups/joined/${groupId}/events/vote`,
    ],
    {
      method: "POST",
      body: JSON.stringify({
        id: eventId,
        vote,
      }),
    }
  );
}

export async function fetchGroupMembers(groupId: string | number) {
  const response = await requestWithFallback<any>([
    `/api/v1/groups/joined/${groupId}/members`,
    `/groups/joined/${groupId}/members`,
  ]);

  const members = Array.isArray(response?.data?.members)
    ? response.data.members
    : Array.isArray(response?.members)
      ? response.members
      : [];

  return members.map(normalizeMember);
}

export async function fetchGroupPosts(groupId: string | number) {
  const response = await requestWithFallback<any>(
    [
      `/api/v1/groups/joined/${groupId}/post`,
      `/api/v1/groups/joined/${groupId}/posts`,
      `/groups/joined/${groupId}/post`,
    ],
    {
      method: "POST",
      body: JSON.stringify({
        offset: 0,
        limit: 20,
      }),
    }
  );

  const posts = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  return posts.map(normalizePost);
}

export async function createGroupPost(groupId: string | number, formData: FormData) {
  return requestWithFallback<any>(
    [
      `/api/v1/groups/joined/${groupId}/post`,
      `/api/v1/groups/joined/${groupId}/posts`,
      `/groups/joined/${groupId}/post`,
    ],
    {
      method: "POST",
      body: formData,
    }
  );
}
