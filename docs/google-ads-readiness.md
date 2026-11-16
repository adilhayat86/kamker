# Kamker advertising setup

The site changes prepare landing pages and measurement. Google reviews Ads and AdSense separately; this work does not guarantee approval.

## Conversion actions

In Google Ads, open Goals → Conversions → Summary → Create conversion action. Choose **Conversions on a website**, enter https://kamker.com, and scan. Reuse the existing Google tag. Its publicly visible ID is **AW-18264211090**; confirm that this is the intended Ads account before setting up the actions.

Create one action using **Setup manually using code**:

| Action | Trigger | Suggested use |
| --- | --- | --- |
| Kamker worker registration | Successful worker signup and signed-in account landing | Primary for worker-registration campaigns |

Use event-based setup with the Google tag, not a rule matching every visit to the registration page or every form-submit attempt. Choose **One** conversion per ad interaction. Do not change campaign bidding or primary goals until this action has been verified. No Google Ads WhatsApp or call conversion tracking is included.

Open the action's tag setup/event snippet and copy the complete public `send_to` value, including both the AW number and the label after the slash. Do not paste another Google tag or event snippet into the site: this implementation already handles it. In the Kamker Vercel project's environment-variable settings, set:

    NEXT_PUBLIC_GOOGLE_ADS_ID=AW-18264211090
    NEXT_PUBLIC_GOOGLE_ADS_REGISTRATION_CONVERSION=AW-18264211090/<real registration label>

The label text in angle brackets is a placeholder: replace it with the exact Google-provided label. Leave the registration conversion variable empty until its action exists. The account ID must match the Google tag. A missing/invalid conversion setting disables the event. Use Preview settings for an isolated test first, then set Production values and redeploy, because Next.js includes public variables at build time.

The existing site-wide Google tag is reused. Successful registration gets a random transaction ID after the account and session are created; refreshes reuse that ID. Failed forms and ordinary registration-page visits do not count as successful registrations. Custom conversion payloads contain no phone, email, CNIC, password, receipt, or message text. No artificial monetary value is assigned.

Verify with Google Tag Assistant after the real value is set. Confirm a successful signup emits registration once, failed forms do not emit it, and refreshing the account does not emit it again. Test in a separate development/preview setup first so artificial test activity does not pollute production conversions.

## Public contact and policy pages

The Contact page is email-only and defaults to **adilhayatkamker@gmail.com**, as requested. The invented fallback phone number has been removed. An optional public configuration variable, NEXT_PUBLIC_KAMKER_SUPPORT_EMAIL, can override that email.

The global footer links to existing /privacy, /terms, and /contact pages. Requested aliases /privacy-policy and /terms-of-service permanently redirect to those established pages.

The privacy page discloses first-party measurement, conditional Google advertising cookies, worker-registration conversions, and advertising opt-out links. Consent requirements depend on visitor location and the Google products enabled; review them before activating AdSense or serving relevant regions. No consent-management platform or AdSense account is activated by this change.

## Display advertising readiness

Empty advertising placeholders have been removed for all visitors, including their wrapper spacing and paid-visit-only suppression code. Google Ads registration conversion tracking and first-party attribution remain unchanged. See [AdSense readiness](adsense-readiness.md) for publisher verification, policy references and the remaining account-side steps.

Empty results remain honest and offer broader city/category searches. No fake profiles, verification claims, invented prices, or charges for zero matched recipients are introduced.

## Policy corrections to the supplied draft

- Missing a particular footer URL does not automatically mean immediate suspension. Google evaluates destination experience and other applicable policies.
- Zero results alone are not automatically a “Destination not working” violation; broken/error destinations and insufficient-useful-content concerns are distinct.
- Google Ads acquisition and AdSense display monetization are separate products and approvals.

Official references:

- https://support.google.com/adspolicy/answer/16427615
- https://support.google.com/adsense/answer/1348695
- https://support.google.com/google-ads/answer/6331304
- https://support.google.com/google-ads/answer/6386790
- https://support.google.com/google-ads/answer/12718882
