// rrc-admin.vercel.app is the staging / demo copy of the admin site for client review.
// Its admin screens use the test copy (rrc-staging, sample data only). Its public pages stay on
// the live server: members' invite links and the launch QR codes open /join and /download there.
// Every other host, including admin.reliiancerewards.com.au, is untouched by all of this.
export const IS_DEMO = typeof window !== 'undefined'
    && /^rrc-admin(-[a-z0-9-]+)?\.vercel\.app$/.test(window.location.hostname);

export const DEMO_API_URL = 'https://rrc-backend-staging.onrender.com';
export const DEMO_SUPABASE_URL = 'https://tmrpnkergltzfcwhmtay.supabase.co';
export const DEMO_SUPABASE_KEY = 'sb_publishable_zP-vJm2brjRcrbqNVcXu6Q_byO3J1ye';

// SHA-256 of the demo access code. This only keeps casual visitors out of the demo; what protects
// data is that the test copy holds sample data and the server checks every sign-in itself.
export const DEMO_CODE_HASH = '77c7eb593022d93a40f180ca9071cc8e413998cfa5e363bc750a7c711186092e';

const PUBLIC_PATHS = ['/join/', '/download', '/faq', '/support', '/privacy-policy', '/terms-of-service'];
export const isPublicPage = (path) => PUBLIC_PATHS.some((p) => path === p || path.startsWith(p));
