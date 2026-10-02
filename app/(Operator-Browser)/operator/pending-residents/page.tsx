"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { approveResident, rejectResident } from "./actions";
import styles from "./page.module.css";

type Resident = {
  id: number;
  first_name: string;
  last_name: string;
  suffix: string;
  phone_number: string;
  age: number;
  gender: string;
  email: string;
};

export default function PendingResidentsPage() {
  const supabase = createClient();

  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchPendingResidents = async () => {
    try {
      const { data, error } = await supabase
        .from("tbl_resident")
        .select("*")
        .eq("status", "PENDING");
      if (error) {
        console.error("Error fetching pending residents:", error);
      } else {
        setResidents(data as Resident[]);
      }
    } catch (error) {
      console.error("Error fetching pending residents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingResidents();
  }, []);

  const handleStatusChange = async (id: number, actionType: "approve" | "reject") => {
    setBusyId(id);
    try {
      if (actionType === "approve") {
        await approveResident(id);
      } else {
        await rejectResident(id);
      }
      setResidents((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(`Failed to complete action: ${err}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.title}>Pending Residents</h1>

        {loading ? (
          <p className={styles.note}>Loading pending residents...</p>
        ) : residents.length === 0 ? (
          <p className={styles.empty}>No pending residents found.</p>
        ) : (
          <section>
            <h2 className={styles.heading}>
              Pending Registrations <span className={styles.count}>{residents.length}</span>
            </h2>

            {residents.map((resident) => (
              <article key={resident.id} className={styles.card}>
                <div className={styles.avatar} aria-hidden="true">
                  {`${resident.first_name?.[0] ?? ""}${resident.last_name?.[0] ?? ""}`.toUpperCase()}
                </div>

                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <h3 className={styles.name}>
                      {resident.first_name} {resident.last_name}
                      {resident.suffix ? ` ${resident.suffix}` : ""}
                    </h3>
                    <span className={styles.pill}>Pending</span>
                  </div>

                  <dl className={styles.details}>
                    {resident.email && (
                      <div>
                        <dt>Email</dt>
                        <dd>{resident.email}</dd>
                      </div>
                    )}
                    {resident.phone_number && (
                      <div>
                        <dt>Phone</dt>
                        <dd>{resident.phone_number}</dd>
                      </div>
                    )}
                    {resident.age != null && (
                      <div>
                        <dt>Age</dt>
                        <dd>{resident.age}</dd>
                      </div>
                    )}
                    {resident.gender && (
                      <div>
                        <dt>Sex</dt>
                        <dd>
                          {resident.gender.charAt(0).toUpperCase() + resident.gender.slice(1).toLowerCase()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className={styles.actions}>
                  <button
                    className={styles.approve}
                    disabled={busyId === resident.id}
                    onClick={() => handleStatusChange(resident.id, "approve")}
                  >
                    {busyId === resident.id ? "Working…" : "Approve"}
                  </button>
                  <button
                    className={styles.reject}
                    disabled={busyId === resident.id}
                    onClick={() => handleStatusChange(resident.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}