"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import styles from "./page.module.css";

type BlotterResident = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  phone_number: string | null;
  email: string | null;
};

type BlotterRequest = {
  id: number;
  emerg_category: string;
  status: string;
  created_at: string;
  resident: BlotterResident | BlotterResident[] | null;
};

function getResident(resident: BlotterRequest["resident"]) {
  return Array.isArray(resident) ? resident[0] ?? null : resident;
}

function getResidentName(residentValue: BlotterRequest["resident"]) {
  const resident = getResident(residentValue);
  if (!resident) return "Resident information unavailable";
  return [
    resident.first_name,
    resident.middle_name?.trim(),
    resident.last_name,
    resident.suffix?.trim(),
  ]
    .filter(Boolean)
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export default function OperatorBlotterPage() {
  const [records, setRecords] = useState<BlotterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const loadBlotters = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("tbl_emergency_req")
        .select(
          "id, emerg_category, status, created_at, resident:tbl_resident(first_name, middle_name, last_name, suffix, phone_number, email)",
        )
        .eq("emerg_category", "Schedule Blotter")
        .order("created_at", { ascending: false });

      if (queryError) {
        console.error("Error loading blotter requests:", queryError);
        setError("Could not load blotter requests. Please try again.");
      } else {
        setRecords((data ?? []) as BlotterRequest[]);
        setError(null);
      }
    } catch (loadError) {
      console.error("Unexpected error loading blotter requests:", loadError);
      setError("Could not load blotter requests. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadBlotters(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadBlotters, retryKey]);

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Operator dashboard</p>
            <h1>Blotter Reports</h1>
            <p>Review residents’ requests to schedule a barangay blotter.</p>
          </div>
          <span className={styles.count} aria-label={`${records.length} blotter reports`}>
            {records.length}
          </span>
        </header>

        {loading ? (
          <p className={styles.message} role="status">Loading blotter reports…</p>
        ) : error ? (
          <div className={styles.message} role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((key) => key + 1)}>
              Retry
            </button>
          </div>
        ) : records.length === 0 ? (
          <p className={styles.message}>No blotter reports have been submitted.</p>
        ) : (
          <div className={styles.list}>
            {records.map((record) => (
              <BlotterCard record={record} key={record.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function BlotterCard({ record }: { record: BlotterRequest }) {
  const resident = getResident(record.resident);

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.reference}>Report #{record.id}</p>
          <h2>{getResidentName(record.resident)}</h2>
        </div>
        <span className={styles.status}>{record.status}</span>
      </div>
      <dl className={styles.details}>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDate(record.created_at)}</dd>
        </div>
        {resident?.phone_number && (
          <div>
            <dt>Phone</dt>
            <dd>{resident.phone_number}</dd>
          </div>
        )}
        {resident?.email && (
          <div>
            <dt>Email</dt>
            <dd>{resident.email}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
