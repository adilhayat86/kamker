# Worker registration SEO release

The first release focuses on English-speaking workers creating free profiles. The homepage headline remains `Find part time workers`; customer/company registration and the existing navigation speed fixes are retained.

## URL and content changes

The homepage canonical is set on the homepage rather than inherited from the root layout. Independent public pages have their own canonical URLs. The worker form always prefers `https://kamker.com/register/professional`, including visits with tracking or validation-status parameters. Existing directory/category filter noindex rules are unchanged.

The worker form has the title `Free Worker Registration in Pakistan | Kamker`, an English introduction, practical profile-creation steps, and visible FAQs about joining. It explains free registration and no worker commission without promising work or income. The homepage worker button opens this existing form directly; the general registration chooser remains available.

The existing single sitemap deduplicates preferred public URLs and omits unsupported update dates. Active/non-banned worker, verified-company and approved-listing selection stays in place. No private account or filtered-search URLs are added. Genuine missing pages still return 404.

## Measuring completed registrations

The existing admin Analytics dashboard and CSV export include a **Worker registrations from Google** section. It reuses the existing page-view, visitor ID and server-side registration-success events. No new database tables, migrations or third-party tracking services are added.

- Each worker ID is counted once in the selected signup range. Other account roles and failed forms are excluded.
- A signup can match a recorded entry by the same visitor within 30 minutes, including an entry just before the report's start date.
- New page-view metadata identifies a document entry. Client navigation, reload and history restoration do not restart an organic entry's time window.
- Google search hosts are matched explicitly; lookalike domains and non-search Google products are excluded.
- Google click IDs and paid campaign markers classify a visit as paid, separate from organic.
- Missing visitor IDs, older views without an entry marker, expired entry windows and other unmatched signups remain **Unattributed**. This is correlation from recorded browser signals, not proof that SEO caused a signup.
- The dashboard warns when the existing event-row cap or the lookback cap is reached. Shorter report ranges can improve coverage. Storage blocking or missing events may reduce matching.

The page-view endpoint accepts optional `isEntry` and `hasPaidMarker` booleans and stores them in the existing event metadata. Existing payloads remain valid. No personal form values are added to acquisition metadata. Google Ads registration configuration stays separate and inactive until its real conversion value is set; no Google Ads call/WhatsApp conversions are introduced.

## Baseline and 28-day comparison

Search Console was reviewed on 8 November 2026: 17 clicks, 881 impressions, 1.9% CTR over 7 August–6 November; 15 clicks were mobile and 14 were from Pakistan. The indexing report (23 October) showed 307 indexed and 458 excluded URLs. These are site-wide figures, not worker registrations.

The most recent complete 28-day Search Console view, **10 October–6 November 2026**, showed **11 clicks, 280 impressions, 3.9% CTR and average position 10.9**. This is an additional recorded baseline; use the same filters and complete calendar windows when comparing later.

A read-only database check before release found 1,150 recorded events in the preceding rolling 28 days, including 511 page-view events and 10 worker-registration-success events. No entries had the new explicit marker. These raw event totals do not establish organic attribution or the total number of real workers acquired.

For the first calendar comparison, use **8 November–5 December 2026** versus **11 October–7 November 2026**. Wait until Search Console reports the complete periods. Export Google web-search clicks/impressions for Pakistan and the worker-registration page, then compare completed worker signups and their acquisition buckets in admin Analytics. Historical signups may remain unattributed; do not present improved instrumentation as proven traffic growth.

After deployment, use Search Console URL Inspection to test the live registration URL, verify its canonical, and request indexing. Submission is a request to Google, not a guarantee of indexing or rankings.

## Checks

- `node --test tests/unit/*.test.mjs`
- `npm run build` (includes TypeScript and ESLint)
- `node scripts/qa/check-worker-seo.mjs` against an isolated local build
- `BASE_URL=https://kamker.com node scripts/qa/check-worker-seo.mjs` after release
- Mobile browser checks: direct homepage button, failed form, successful local signup, marker persistence on refresh, paid-visit flag, layout and FAQ expansion

Browser signups use an isolated development store with no production database credentials. Production verification must not create fake worker accounts.
