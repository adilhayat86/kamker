# Photo completion regression check

Use the isolated PostgreSQL/PostgREST fixture on loopback ports 55432–55434.
Never point these fixtures at a hosted database or deploy the provider preload.

For browser verification, run Next on 127.0.0.1:3103 with the
`photo-feedback-fixture.mjs` Node preload and synthetic Cloudinary configuration.
The browser supplies a synthetic Cloudinary upload response and JPEG thumbnail;
the Node fixture supplies ownership metadata and the account image optimizer's
JPEG response. This checks the application journey, not live-provider availability.

Verified on a 390px-wide Chrome viewport:

- A newly registered synthetic worker reaches the optional photo step.
- Uploading disables Save and hides Skip; a deliberately paused upload stays pending.
- Successful JPEG upload shows the filename, a loaded thumbnail and Photo uploaded.
- Save photo and continue persists the checked intent and displays the account photo.
- A valid HEIC sample also gets a JPEG thumbnail from the upload response.
- Provider failure keeps the previously saved photo, disables Save, and allows retry.
- Retrying HEIC, saving, editing the profile without a new photo, and refreshing
  retain the same attached photo and render it successfully.
- The photo step and profile editor do not overflow horizontally on mobile.

Also run `media-flows.mjs` to check authenticated attachment, repeated saves,
foreign/expired/oversized rejection and preservation of the existing photo.
