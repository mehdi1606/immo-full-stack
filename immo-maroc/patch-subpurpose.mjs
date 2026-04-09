/**
 * Patch existing properties to set subPurpose based on purpose + type
 * Run: node patch-subpurpose.mjs
 */
const BASE = 'http://localhost:8090';

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

// Login as admin
const auth = await req('POST', '/api/auth/login', { email: 'admin@immomaroc.ma', password: 'admin123' });
const adminToken = auth.token;
console.log('Admin logged in:', auth.name);

// Login as each agent to get their tokens
const agentCreds = [
  { email: 'ahmed.benali@immomaroc.ma', password: 'Agent@2024' },
  { email: 'sara.alaoui@immomaroc.ma',  password: 'Agent@2024' },
  { email: 'karim.tazi@immomaroc.ma',   password: 'Agent@2024' },
];
const agentTokens = {};
for (const c of agentCreds) {
  const a = await req('POST', '/api/auth/login', c);
  agentTokens[a.agentId] = a.token;
}
console.log('Agent tokens obtained:', Object.keys(agentTokens));

// Get all properties
const allProps = [];
let page = 0;
while (true) {
  const data = await req('GET', `/api/properties?page=${page}&size=50`);
  allProps.push(...(data.content || []));
  if (data.last || !data.content?.length) break;
  page++;
}
console.log(`Found ${allProps.length} properties to patch`);

let ok = 0, skip = 0, fail = 0;

for (const p of allProps) {
  // Determine subPurpose
  let subPurpose = null;
  if (p.purpose === 'VENTE') {
    // Most seeded vente properties are occasion (resale), a few neuf
    // Mark newer/modern ones as NEUF
    const neufKeywords = ['neuf', 'nouvelle', 'récent', 'récente', 'marina', 'résidence'];
    const isNeuf = neufKeywords.some(k => p.title.toLowerCase().includes(k) || (p.description || '').toLowerCase().includes(k));
    subPurpose = isNeuf ? 'NEUF' : 'OCCASION';
  } else if (p.purpose === 'LOCATION') {
    // Short-term (jour) keywords: touristique, saisonnier, vacation
    const courtTermeKeywords = ['touristique', 'saisonnier', 'vacance', 'court', 'airbnb'];
    const isCourtTerme = courtTermeKeywords.some(k =>
      p.title.toLowerCase().includes(k) || (p.description || '').toLowerCase().includes(k)
    );
    subPurpose = isCourtTerme ? 'COURT_TERME' : 'LONG_TERME';
  }

  if (!subPurpose) { skip++; continue; }

  // Find the right agent token
  const agentId = p.agent?.id;
  const token = agentTokens[agentId] || adminToken;

  try {
    await req('PUT', `/api/properties/${p.id}`, {
      title: p.title,
      type: p.type,
      purpose: p.purpose,
      subPurpose,
      city: p.city,
      price: p.price,
    }, token);
    ok++;
    process.stdout.write(`  ✓ [${p.id}] ${p.title.substring(0, 40)} → ${subPurpose}\n`);
  } catch (e) {
    fail++;
    process.stdout.write(`  ✗ [${p.id}] ${p.title.substring(0, 30)}: ${String(e).substring(0, 50)}\n`);
  }
}

console.log(`\nDone: ${ok} patched, ${skip} skipped (no purpose), ${fail} failed`);
