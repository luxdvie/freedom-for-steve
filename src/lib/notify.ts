const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function notifySlack(text: string) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Slack notification is best-effort — don't break the API if it fails
  }
}
