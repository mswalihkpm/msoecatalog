// SPR Integration — READ ONLY reading-performance endpoint.
// Never performs INSERT/UPDATE/DELETE. Server-to-server auth via SPR_API_TOKEN.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-spr-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SPR_API_TOKEN = Deno.env.get("SPR_API_TOKEN") ?? "";

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Tier = "b50" | "b100" | "b150" | "b200" | "b250" | "b300" | "a300";

const DEFAULT_SCORING_TABLE: Record<string, Record<Tier, number>> = {
  Islamic: { b50: 10, b100: 15, b150: 20, b200: 25, b250: 30, b300: 35, a300: 50 },
  General: { b50: 8, b100: 13, b150: 18, b200: 23, b250: 28, b300: 33, a300: 48 },
  Science: { b50: 8, b100: 13, b150: 17, b200: 22, b250: 27, b300: 32, a300: 47 },
  History: { b50: 8, b100: 13, b150: 17, b200: 22, b250: 27, b300: 32, a300: 47 },
  English: { b50: 7, b100: 12, b150: 17, b200: 22, b250: 27, b300: 32, a300: 47 },
  Autobiography: { b50: 7, b100: 12, b150: 17, b200: 23, b250: 28, b300: 33, a300: 48 },
  Biography: { b50: 7, b100: 12, b150: 17, b200: 23, b250: 28, b300: 33, a300: 48 },
  Travelogue: { b50: 6, b100: 11, b150: 16, b200: 21, b250: 26, b300: 31, a300: 46 },
  Arabic: { b50: 6, b100: 11, b150: 16, b200: 22, b250: 27, b300: 32, a300: 47 },
  Poem: { b50: 5, b100: 10, b150: 15, b200: 20, b250: 25, b300: 30, a300: 45 },
  "English Novel": { b50: 5, b100: 10, b150: 15, b200: 20, b250: 26, b300: 33, a300: 48 },
  Story: { b50: 4, b100: 9, b150: 14, b200: 22, b250: 25, b300: 31, a300: 46 },
  Novel: { b50: 4, b100: 9, b150: 14, b200: 22, b250: 25, b300: 32, a300: 47 },
  "English Story": { b50: 3, b100: 6, b150: 10, b200: 15, b250: 24, b300: 35, a300: 40 },
  Language: { b50: 6, b100: 11, b150: 16, b200: 22, b250: 27, b300: 32, a300: 47 },
  Others: { b50: 3, b100: 6, b150: 10, b200: 15, b250: 20, b300: 25, a300: 35 },
};

const pointsForBook = (
  table: Record<string, Record<string, number>>,
  category?: string,
  pages?: string | number,
): number => {
  const row = table[category || "Others"] || table.Others || {};
  const n =
    typeof pages === "number"
      ? pages
      : parseInt(String(pages || "0").replace(/[^\d]/g, ""), 10) || 0;
  let tier: Tier;
  if (n < 50) tier = "b50";
  else if (n < 100) tier = "b100";
  else if (n < 150) tier = "b150";
  else if (n < 200) tier = "b200";
  else if (n < 250) tier = "b250";
  else if (n <= 300) tier = "b300";
  else tier = "a300";
  return row[tier] ?? 0;
};

const normalizeSpr = (v: string) => v.trim().toUpperCase();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST")
    return json({ error: "method_not_allowed" }, 405);

  // --- Server-to-server auth ---
  if (!SPR_API_TOKEN) return json({ error: "server_not_configured" }, 503);
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const token = bearer || req.headers.get("x-spr-token")?.trim() || "";
  if (token !== SPR_API_TOKEN) return json({ error: "unauthorized" }, 401);

  try {
    const url = new URL(req.url);
    let sprId = url.searchParams.get("sprStudentId") || "";
    let fromDate = url.searchParams.get("fromDate") || "";
    let toDate = url.searchParams.get("toDate") || "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      sprId = body.sprStudentId || sprId;
      fromDate = body.fromDate || fromDate;
      toDate = body.toDate || toDate;
    }
    sprId = normalizeSpr(sprId);
    if (!/^SPR\d{4,}$/.test(sprId))
      return json({ error: "invalid_spr_student_id", message: "Expected format SPR0001" }, 400);

    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1) Resolve SPR ID -> library student account
    const { data: student, error: sErr } = await supa
      .from("students")
      .select("id,name,class,spr_student_id")
      .eq("spr_student_id", sprId)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!student) return json({ error: "student_not_found", sprStudentId: sprId }, 404);

    // 2) Settings (scoring table + review points default)
    const { data: settings } = await supa
      .from("admin_settings")
      .select("scoring_table,review_points_default")
      .eq("username", "msoelib")
      .maybeSingle();
    const table =
      settings?.scoring_table && Object.keys(settings.scoring_table as object).length > 0
        ? (settings.scoring_table as Record<string, Record<string, number>>)
        : DEFAULT_SCORING_TABLE;
    const reviewPointsDefault = settings?.review_points_default ?? 10;

    // 3) Borrow records for this student (linked by student_id, legacy fallback by name+class)
    let q = supa
      .from("borrow_records")
      .select(
        "id,book_id,book_title,borrowed_date,return_date,is_returned,read_status,review_conducted,review_points",
      )
      .or(
        `student_id.eq.${student.id},and(student_id.is.null,borrower_name.eq.${student.name})`,
      );
    if (fromDate) q = q.gte("borrowed_date", fromDate);
    if (toDate) q = q.lte("borrowed_date", toDate);
    const { data: records, error: rErr } = await q;
    if (rErr) throw rErr;
    const rows = records ?? [];

    // 4) Book metadata for category/pages
    const bookIds = [...new Set(rows.map((r) => r.book_id).filter(Boolean))];
    let bookMap = new Map<string, any>();
    if (bookIds.length > 0) {
      const { data: books } = await supa
        .from("books")
        .select("id,title,category,pages")
        .in("id", bookIds);
      bookMap = new Map((books ?? []).map((b) => [b.id, b]));
    }

    // 5) Compute reading performance (same rules as the library leaderboard)
    let earnedPoints = 0;
    let maxPossiblePoints = 0;
    let fullRead = 0;
    let halfRead = 0;
    let notRead = 0;
    let reviewCount = 0;
    let reviewPoints = 0;
    let returnedBooks = 0;

    const books = rows.map((r) => {
      const bk = bookMap.get(r.book_id);
      const fullPts = pointsForBook(table, bk?.category, bk?.pages);
      let pts = 0;
      if (r.read_status === "full_read") {
        fullRead += 1;
        pts += fullPts;
      } else if (r.read_status === "half_read") {
        halfRead += 1;
        pts += Math.round(fullPts / 2);
      } else {
        notRead += 1;
      }
      if (r.review_conducted) {
        reviewCount += 1;
        const rp = r.review_points ?? reviewPointsDefault;
        reviewPoints += rp;
        pts += rp;
      }
      if (r.is_returned) returnedBooks += 1;
      earnedPoints += pts;
      maxPossiblePoints += fullPts;
      return {
        bookTitle: bk?.title ?? r.book_title,
        category: bk?.category ?? null,
        pages: bk?.pages ?? null,
        borrowedDate: r.borrowed_date,
        dueDate: r.return_date,
        returned: !!r.is_returned,
        readStatus: r.read_status,
        reviewConducted: !!r.review_conducted,
        pointsEarned: pts,
        maxPoints: fullPts,
      };
    });

    const readingPercentage =
      maxPossiblePoints > 0
        ? Math.round((earnedPoints / maxPossiblePoints) * 1000) / 10
        : 0;

    return json({
      sprStudentId: student.spr_student_id,
      studentName: student.name,
      className: student.class,
      period: { fromDate: fromDate || null, toDate: toDate || null },
      totalBorrows: rows.length,
      countedBorrows: rows.length,
      returnedBooks,
      completedBooks: fullRead,
      partiallyReadBooks: halfRead,
      notReadBooks: notRead,
      reviewsConducted: reviewCount,
      reviewPoints,
      earnedPoints,
      maxPossiblePoints,
      readingPercentage,
      calculation:
        "earnedPoints = sum(full_read => categoryPagePoints, half_read => round(categoryPagePoints/2), not_read => 0) + sum(review_points when review_conducted). maxPossiblePoints = sum(categoryPagePoints of every counted borrow). readingPercentage = earnedPoints / maxPossiblePoints * 100 (1 decimal).",
      books,
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    console.error("spr-reading-data error", e);
    return json({ error: "internal_error" }, 500);
  }
});
