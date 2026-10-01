"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Resident = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
};

type EmergencyRequest = {
  id: number;
  resident: Resident;
  emerg_category: string;
  status: string;
};

type EmergencyListProps = {
  onAcceptCall: (
    requestId: number
  ) => Promise<{
    success: boolean;
    roomId: string;
    livekitToken: string;
  }>;
};

export default function EmergencyList({
  onAcceptCall,
}: EmergencyListProps) {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [realtimeWarning, setRealtimeWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [retryKey, setRetryKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function fetchExistingRequests() {
      const { data, error } = await supabase
        .from("tbl_emergency_req")
        .select(
          "*, resident:tbl_resident(id, first_name, middle_name, last_name, suffix)"
        )
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading emergencies:", error);
        if (isMounted) setLoadError("Could not load emergency requests. Retrying...");
      } else {
        if (isMounted) {
          setRequests((data ?? []) as EmergencyRequest[]);
          setLoadError(null);
        }
      }

      if (isMounted) setLoading(false);
    }

    void fetchExistingRequests();

    const refreshInterval = window.setInterval(() => {
      void fetchExistingRequests();
    }, 5000);

    const channel = supabase
      .channel("operator-emergency-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tbl_emergency_req",
        },
        () => void fetchExistingRequests()
      )
      .subscribe((status, error) => {
        if (!isMounted) return;

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Emergency request realtime subscription failed:", error);
          setRealtimeWarning(
            "Live updates are unavailable. Requests will refresh automatically."
          );
        } else if (status === "SUBSCRIBED") {
          setRealtimeWarning(null);
          void fetchExistingRequests();
        }
      });

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
      void supabase.removeChannel(channel);
    };
  }, [retryKey]);

  function getFullName(resident: Resident) {
    return [
      resident.first_name,
      resident.middle_name?.trim(),
      resident.last_name,
      resident.suffix?.trim(),
    ]
      .filter(Boolean)
      .join(" ");
  }

  function handleAccept(requestId: number) {
    startTransition(async () => {
      try {
        const result = await onAcceptCall(requestId);

        if (result.success) {
          router.push(
            `/operator/call/${result.roomId}?token=${result.livekitToken}`
          );
        }
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Error taking this request"
        );
      }
    });
  }

  if (loading) {
    return <p>Loading emergency requests...</p>;
  }

  return (
    <section>
      <h2>Active Requests</h2>

      {realtimeWarning && <p role="status">{realtimeWarning}</p>}
      {loadError && (
        <p role="alert">
          {loadError}{" "}
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}>
            Retry now
          </button>
        </p>
      )}

      {requests.length === 0 ? (
        <p>{loadError ? "Requests will appear when the connection recovers." : "No pending emergency requests."}</p>
      ) : (
        requests.map((request) => (
          <article key={request.id}>
            <p>Category: {request.emerg_category}</p>
            <p>ID: {request.id}</p>
            <p>Caller: {getFullName(request.resident)}</p>

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleAccept(request.id)}
            >
              {isPending ? "Connecting..." : "Accept Call"}
            </button>
          </article>
        ))
      )}
    </section>
  );
}
