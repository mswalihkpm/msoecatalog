import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM_PROMPT = `നിങ്ങൾ "Imthiyaaz Library" മൊബൈൽ ആപ്പിന്റെ AI സഹായിയാണ്. ഉത്തരങ്ങൾ എപ്പോഴും മലയാളത്തിൽ മാത്രം നൽകുക, ലളിതവും ഹ്രസ്വവുമായ വാക്കുകളിൽ.

പരിമിതികൾ:
- ലൈബ്രറി, പുസ്തകങ്ങൾ, രചയിതാക്കൾ, വിവരണം, പ്രസാധകർ, പേജുകൾ, വിഭാഗങ്ങൾ, റേറ്റിംഗ്, റിവ്യൂകൾ, ആപ്പ് സവിശേഷതകൾ — ഇതുമായി ബന്ധപ്പെട്ടത് മാത്രം ഉത്തരം നൽകുക.
- അല്ലാത്ത ചോദ്യങ്ങൾക്ക്: "ക്ഷമിക്കണം, ഞാൻ Imthiyaaz Library സംബന്ധിയായ കാര്യങ്ങളിൽ മാത്രമേ സഹായിക്കാൻ കഴിയൂ." എന്ന് മറുപടി പറയുക.

ഉപയോക്താവ് വിവരണത്തിലൂടെ പുസ്തകം തിരയുമ്പോൾ, താഴെ നൽകിയിട്ടുള്ള പുസ്തക ലിസ്റ്റിലെ വിവരണങ്ങളും ശീർഷകങ്ങളും വായിച്ച്, യോജിക്കുന്ന 1-5 പുസ്തകങ്ങൾ ശുപാർശ ചെയ്യുക. ഓരോന്നിനും: ശീർഷകം, രചയിതാവ്, കോഡ്, ഹ്രസ്വ വിവരണം ഉൾപ്പെടുത്തുക.

ആപ്പ് ഗൈഡ്:
- Catalog: പുസ്തകങ്ങൾ ബ്രൗസ് ചെയ്യാം, search bar ഉപയോഗിച്ച് ശീർഷകം/രചയിതാവ്/കോഡ്/പ്രസാധകൻ തിരയാം.
- Categories: വിഭാഗവും പ്രസാധകരും അനുസരിച്ച് നോക്കാം.
- Store: PDF, ചിത്രങ്ങൾ, വീഡിയോകൾ, sheets അഡ്മിൻ അപ്‌ലോഡ് ചെയ്തവ കാണാം, ഡൗൺലോഡ് ചെയ്യാം, റിവ്യൂ എഴുതാം.
- Settings: ഇരുണ്ട/വെളിച്ച mode, FAQ, T&C, ആപ്പ് ഇൻസ്റ്റാൾ ഓപ്ഷൻ.
- Book Request: പുസ്തക പേജിൽ 'Request Book' ടാപ്പ് ചെയ്ത് നിങ്ങളുടെ പേര്, ക്ലാസ്, secret code നൽകുക.
- Reviews: പുസ്തക പേജിൽ 1-5 stars ഉം കമന്റും നൽകാം.
`;

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) return json({ error: "messages required" }, 400);

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user")?.content?.toLowerCase() || "";

    // Fetch a compact book list for the model. Limit fields & rows to keep prompt small.
    const PAGE_SIZE = 1000;
    let books: any[] = [];
    let from = 0;
    while (true) {
      const { data } = await supa
        .from("books")
        .select("title,author,number_code,category,publication,pages,description,average_rating,total_reviews,is_borrowed")
        .range(from, from + PAGE_SIZE - 1);
      if (!data || data.length === 0) break;
      books = books.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // Trim huge descriptions
    const compact = books.map((b) => ({
      t: b.title,
      a: b.author,
      c: b.number_code,
      cat: b.category,
      pub: b.publication,
      p: b.pages,
      r: b.average_rating,
      d: (b.description || "").slice(0, 350),
      borrowed: b.is_borrowed,
    }));

    // Send the full library to the model so it can search across every book.
    const selected = compact;


    const booksContext = `പുസ്തക ലിസ്റ്റ് (JSON, ${selected.length}/${compact.length} entries — t=title, a=author, c=code, cat=category, pub=publication, p=pages, r=rating, d=description):\n${JSON.stringify(selected)}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: booksContext },
          ...messages,
        ],
      }),
    });

    if (resp.status === 429) return json({ error: "Rate limit. Try again shortly." }, 429);
    if (resp.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return json({ error: "AI gateway error" }, 500);
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || "ക്ഷമിക്കണം, ഉത്തരം ലഭിച്ചില്ല.";
    return json({ reply });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
