export async function callGenerateTalismanApi(
  sajuResult: { dayMaster?: string; fiveElements?: unknown },
  wish: string,
  style: string
): Promise<{ imageUrl: string; guide: string }> {
  const res = await fetch('/api/generate-talisman', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sajuResult, wish, style }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `API error ${res.status}`)
  }
  return res.json()
}
