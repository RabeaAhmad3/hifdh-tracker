import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface NotificationPayload {
  type: "new_assignment" | "new_message" | "meeting_booked" | "absence";
  recipient_ids: string[];
  student_name?: string;
  category?: string;
  date?: string;
  sender_name?: string;
  content_preview?: string;
  conversation_id?: string;
  parent_name?: string;
  start_time?: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound: "default";
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildNotification(
  payload: NotificationPayload
): { title: string; body: string; data: Record<string, string> } {
  switch (payload.type) {
    case "new_assignment":
      return {
        title: "New Assignment",
        body: `${payload.student_name} has a new ${formatLabel(payload.category ?? "")} assignment`,
        data: { screen: "assignments" },
      };
    case "new_message":
      return {
        title: payload.sender_name ?? "New Message",
        body: payload.content_preview ?? "You have a new message",
        data: {
          screen: "messages",
          conversationId: payload.conversation_id ?? "",
        },
      };
    case "meeting_booked":
      return {
        title: "Meeting Scheduled",
        body: `${payload.parent_name} booked on ${payload.date} at ${formatTime(payload.start_time ?? "")}`,
        data: { screen: "meetings" },
      };
    case "absence":
      return {
        title: "Attendance Alert",
        body: `${payload.student_name} was marked absent today`,
        data: { screen: "attendance" },
      };
    default:
      return {
        title: "Hifdh Tracker",
        body: "You have a new notification",
        data: {},
      };
  }
}

Deno.serve(async (req) => {
  // Verify service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: NotificationPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { recipient_ids } = payload;

  if (!recipient_ids || recipient_ids.length === 0) {
    return new Response(JSON.stringify({ error: "No recipients" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fetch push tokens for all recipients
  const { data: tokens, error: tokenError } = await supabaseAdmin
    .from("push_tokens")
    .select("id, user_id, token")
    .in("user_id", recipient_ids);

  if (tokenError || !tokens || tokens.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, reason: tokenError?.message ?? "No tokens found" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const { title, body, data } = buildNotification(payload);

  // Build Expo push messages
  const messages: ExpoPushMessage[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data,
    sound: "default" as const,
  }));

  // Send via Expo Push API
  const pushResponse = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!pushResponse.ok) {
    const errorText = await pushResponse.text();
    return new Response(
      JSON.stringify({ error: "Expo Push API error", status: pushResponse.status, detail: errorText }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const pushResult = await pushResponse.json();

  // Clean up expired/invalid tokens
  if (pushResult.data) {
    const tokensToDelete: string[] = [];
    for (let i = 0; i < pushResult.data.length; i++) {
      const ticket = pushResult.data[i];
      if (
        ticket.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        tokensToDelete.push(tokens[i].id);
      }
    }

    if (tokensToDelete.length > 0) {
      await supabaseAdmin
        .from("push_tokens")
        .delete()
        .in("id", tokensToDelete);
    }
  }

  return new Response(
    JSON.stringify({ sent: messages.length, tickets: pushResult.data }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
