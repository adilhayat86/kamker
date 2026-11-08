// Preload only into a loopback synthetic test server. No application test hooks
// or production credentials are used. Providers are checked independently.
const upstream = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw);
  if (url.hostname === 'api.cloudinary.com') {
    if (!url.pathname.startsWith('/v1_1/kamker-synthetic-local/resources/image/upload/')) throw new Error('Refusing non-synthetic provider request.');
    const id = decodeURIComponent(url.pathname.split('/resources/image/upload/')[1]);
    return Response.json({public_id:id,resource_type:'image',type:'upload',format:'heic',bytes:id.endsWith('ffffffff-ffff-4fff-8fff-ffffffffffff')?10485761:35233,width:800,height:600,version:12345,created_at:new Date().toISOString()});
  }
  if (url.origin === 'http://127.0.0.1:55434' && url.pathname.startsWith('/storage/v1/object/sign/proof-images/')) {
    return Response.json({signedURL:url.pathname.replace('/storage/v1','')+'?token=synthetic-test-token'});
  }
  return upstream(input,init);
};
