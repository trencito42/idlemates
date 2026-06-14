export async function sendDiscordWebhook(webhookUrl: string, content: string) {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.slice(0, 1900) })
    })
    return res.ok
  } catch {
    return false
  }
}
