import styles from "./page.module.css";

export default function UnverifiedResidentPage() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1>Account Unverified</h1>
        <p>Your account is currently unverified by the system. Please wait for an operator to verify your account.</p>
      </section>
    </main>
  )
}