const PERMISSIONS_POLICY = [
  'camera=()',
  'geolocation=()',
  'microphone=()',
  'payment=()',
  'usb=()',
].join(', ');

export const securityHeadersMiddleware = (_req, res, next) => {
  // LexSecure does not use these browser capabilities, so deny them globally.
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);

  // API responses can contain confidential legal and account information.
  res.setHeader('Cache-Control', 'no-store');
  next();
};
