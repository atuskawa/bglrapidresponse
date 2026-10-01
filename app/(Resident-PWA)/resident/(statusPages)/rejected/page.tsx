import styles from "./page.module.css";

export default function UnverifiedResidentPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1>Account Rejected</h1>
        <p>Your account has been rejected by the system. Please contact the barangay for further assistance.</p>
        <p>Submit another request</p>
      </section>
    </main>
  )
}