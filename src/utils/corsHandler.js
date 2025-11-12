export function corsHandler(req, res, next) {
  // Whitelist of allowed origins for development and production (can add env var)
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const origin = req.headers.origin || req.header('origin');

  // Allow FRONTEND_URL from environment if provided
  if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

  if (origin && allowedOrigins.includes(origin)) {
    // Must not use '*' when credentials are allowed
    res.header('Access-Control-Allow-Origin', origin);
  }

  // Allow common headers and credentials
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  // Expose some useful headers to the client
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Request-Id');

  if (req.method === 'OPTIONS') {
    // Preflight response
    res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
    );
    // Cache preflight for 24 hours
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  next();
}
