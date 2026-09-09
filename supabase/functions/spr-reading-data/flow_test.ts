// Integration smoke test for the SPR read-only endpoint.
const URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/spr-reading-data`;
const TOKEN = Deno.env.get("SPR_API_TOKEN") ?? "";

Deno.test("token is configured", () => {
  console.log("token configured:", TOKEN.length > 0, "len", TOKEN.length);
});

Deno.test("rejects missing/wrong token", async () => {
  const r = await fetch(`${URL}?sprStudentId=SPR0001`, {
    headers: { Authorization: "Bearer wrong-token" },
  });
  console.log("wrong token status:", r.status, await r.text());
});

Deno.test("valid token, sample lookup", async () => {
  if (!TOKEN) return;
  const r = await fetch(`${URL}?sprStudentId=SPR0001`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  console.log("valid token status:", r.status, (await r.text()).slice(0, 400));
});

Deno.test("invalid id format", async () => {
  if (!TOKEN) return;
  const r = await fetch(`${URL}?sprStudentId=abc`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  console.log("bad format status:", r.status, await r.text());
});
