/**
 * ImmoMaroc — Full Data Seeder
 * Run: node seed.mjs
 * Backend must be running on http://localhost:8090
 */

const BASE = 'http://localhost:8090';

// ─── Helpers ────────────────────────────────────────────────────────────────
async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}
const post  = (p, b, t) => req('POST',  p, b, t);
const patch = (p, b, t) => req('PATCH', p, b, t);
const put   = (p, b, t) => req('PUT',   p, b, t);

function log(msg)    { console.log(`  ✓ ${msg}`); }
function info(msg)   { console.log(`\n━━ ${msg} ━━`); }
function warn(msg)   { console.log(`  ⚠ ${msg}`); }

// ─── Images by property type ─────────────────────────────────────────────────
const IMGS = {
  APPARTEMENT: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=85',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=85',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=85',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=85',
  ],
  VILLA: [
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&q=85',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=85',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=85',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=85',
  ],
  RIAD: [
    'https://images.unsplash.com/photo-1548013146-72479768bada?w=900&q=85',
    'https://images.unsplash.com/photo-1590059939880-7e7abe4e0b33?w=900&q=85',
    'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?w=900&q=85',
  ],
  BUREAU: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=85',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=85',
    'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=900&q=85',
  ],
  TERRAIN: [
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=85',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85',
    'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=900&q=85',
  ],
  STUDIO: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=85',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=900&q=85',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=85',
  ],
  MAISON: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=85',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=85',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=900&q=85',
  ],
  COMMERCE: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=85',
    'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=900&q=85',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=900&q=85',
  ],
  DUPLEX: [
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&q=85',
    'https://images.unsplash.com/photo-1556909114-44e3e9cf30a6?w=900&q=85',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&q=85',
  ],
};

function makeImages(type) {
  const list = IMGS[type] || IMGS.APPARTEMENT;
  return list.slice(0, 3).map((url, i) => ({ url, isMain: i === 0, displayOrder: i }));
}

// ─── Agents ──────────────────────────────────────────────────────────────────
const AGENTS_DATA = [
  {
    name: 'Ahmed Benali',
    email: 'ahmed.benali@immomaroc.ma',
    password: 'Agent@2024',
    phone: '+212661234567',
    whatsapp: '+212661234567',
    agency: 'ImmoVision Maroc',
    city: 'Casablanca',
    bio: 'Expert en immobilier résidentiel et commercial à Casablanca depuis plus de 10 ans. Spécialisé dans les appartements de luxe, villas et investissements. Votre satisfaction est ma priorité.',
    specialties: ['Appartements', 'Villas', 'Investissement', 'Bureaux'],
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80',
  },
  {
    name: 'Sara Alaoui',
    email: 'sara.alaoui@immomaroc.ma',
    password: 'Agent@2024',
    phone: '+212677890123',
    whatsapp: '+212677890123',
    agency: 'Marrakech Premium Realty',
    city: 'Marrakech',
    bio: 'Spécialiste des riads et propriétés de charme à Marrakech. Passionnée par le patrimoine architectural marocain, je vous aide à trouver votre havre de paix dans la ville rouge.',
    specialties: ['Riads', 'Villas', 'Maisons', 'Location saisonnière'],
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80',
  },
  {
    name: 'Karim Tazi',
    email: 'karim.tazi@immomaroc.ma',
    password: 'Agent@2024',
    phone: '+212655445566',
    whatsapp: '+212655445566',
    agency: 'Nord Immo Tanger',
    city: 'Tanger',
    bio: 'Agent immobilier basé à Tanger, expert en biens de standing avec vue mer. Je couvre Tanger, Tétouan, Chefchaouen et toute la région nord du Maroc.',
    specialties: ['Villas vue mer', 'Appartements', 'Terrains', 'Commercial'],
    verified: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
  },
];

// ─── 50 Properties (agentIndex: 0=Ahmed, 1=Sara, 2=Karim) ──────────────────
const PROPS = [
  // ── CASABLANCA – Ahmed (0) ──────────────────────────────────────────────
  {
    title: 'Appartement moderne au cœur de Maarif', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'Casablanca', neighborhood: 'Maarif', price: 1850000, area: 95, rooms: 3, bathrooms: 2,
    parking: true, elevator: true, furnished: false, featured: true, status: 'DISPONIBLE',
    description: 'Magnifique appartement de 95m² au cœur du quartier Maarif. Lumineux, moderne avec finitions haut de gamme. Cuisine équipée, double vitrage, sécurité 24h/24. Proche écoles, commerces et transport.',
    features: ['Cuisine équipée', 'Double vitrage', 'Sécurité 24h', 'Balcon', 'Parking en sous-sol'],
    agentIndex: 0,
  },
  {
    title: 'Villa de prestige avec piscine — Ain Diab', type: 'VILLA', purpose: 'VENTE',
    city: 'Casablanca', neighborhood: 'Ain Diab', price: 9500000, area: 450, rooms: 6, bathrooms: 4,
    parking: true, elevator: false, furnished: true, featured: true, status: 'DISPONIBLE',
    description: 'Splendide villa de standing à Ain Diab. Piscine privée chauffée, jardin paysager, terrasse panoramique. Architecture contemporaine, matériaux nobles, domotique intégrée. Quartier résidentiel sécurisé.',
    features: ['Piscine chauffée', 'Jardin paysager', 'Terrasse panoramique', 'Domotique', 'Garage double', 'Salle de sport'],
    agentIndex: 0,
  },
  {
    title: 'Studio meublé tout équipé — Gauthier', type: 'STUDIO', purpose: 'LOCATION',
    city: 'Casablanca', neighborhood: 'Gauthier', price: 6500, area: 42, rooms: 1, bathrooms: 1,
    parking: false, elevator: true, furnished: true, featured: false, status: 'DISPONIBLE',
    description: 'Studio entièrement meublé et équipé à Gauthier. Idéal pour cadres et professionnels. Proche transports, commerces, restaurants. Internet fibre inclus.',
    features: ['Meublé', 'Climatisation', 'Internet fibre', 'Sécurité'],
    agentIndex: 0,
  },
  {
    title: 'Bureaux premium — Casablanca Finance City', type: 'BUREAU', purpose: 'LOCATION',
    city: 'Casablanca', neighborhood: 'CFC', price: 35000, area: 280, rooms: null, bathrooms: 3,
    parking: true, elevator: true, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Espace bureaux premium dans le Casablanca Finance City. Open space modulable, salles de réunion, lounge. Certification LEED Green. Vue sur la mer.',
    features: ['Open space', 'Salles de réunion', 'Parking VIP', 'LEED certifié', 'Vue mer', 'Réception'],
    agentIndex: 0,
  },
  {
    title: 'Appartement lumineux 3 ch — Racine', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'Casablanca', neighborhood: 'Racine', price: 2200000, area: 110, rooms: 3, bathrooms: 2,
    parking: true, elevator: true, furnished: false, featured: false, status: 'VENDU',
    description: 'Bel appartement dans résidence sécurisée du quartier Racine. Vue dégagée, grande terrasse, cave. Quartier résidentiel calme et prisé.',
    features: ['Terrasse', 'Cave', 'Gardien 24h', 'Balcon', 'Proche tramway'],
    agentIndex: 0,
  },
  {
    title: 'Terrain constructible 800m² — Bouskoura Golf City', type: 'TERRAIN', purpose: 'VENTE',
    city: 'Casablanca', neighborhood: 'Bouskoura', price: 3200000, area: 800, rooms: null, bathrooms: null,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Terrain viabilisé de 800m² dans la zone résidentielle de Bouskoura Golf City. Titre foncier propre. Accès direct goudronné. R+2 autorisé.',
    features: ['Titre foncier', 'Viabilisé', 'Accès goudronné', 'R+2 autorisé', 'Proche golf'],
    agentIndex: 0,
  },
  {
    title: 'Duplex luxueux avec terrasse — Anfa', type: 'DUPLEX', purpose: 'VENTE',
    city: 'Casablanca', neighborhood: 'Anfa', price: 5800000, area: 250, rooms: 5, bathrooms: 3,
    parking: true, elevator: false, furnished: true, featured: true, status: 'DISPONIBLE',
    description: 'Exceptionnel duplex meublé dans l\'Anfa résidentiel. Deux niveaux, grand séjour double hauteur, cuisine américaine, terrasse privative avec vue mer imprenable.',
    features: ['Vue mer', 'Terrasse privative', 'Double hauteur', 'Cuisine américaine', 'Meublé haut de gamme'],
    agentIndex: 0,
  },
  {
    title: 'Maison familiale R+1 avec jardin — Mohammedia', type: 'MAISON', purpose: 'VENTE',
    city: 'Casablanca', neighborhood: 'Mohammedia', price: 2800000, area: 200, rooms: 5, bathrooms: 3,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Belle maison familiale R+1 avec jardin privatif. Quartier résidentiel calme. Salon marocain traditionnel, chambres spacieuses, terrasse.',
    features: ['Jardin privé', 'Salon marocain', 'Terrasse', 'Garage', 'Quartier calme'],
    agentIndex: 0,
  },
  {
    title: 'Local commercial angle Derb Omar', type: 'COMMERCE', purpose: 'LOCATION',
    city: 'Casablanca', neighborhood: 'Derb Omar', price: 18000, area: 160, rooms: null, bathrooms: 1,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Local commercial bien situé au cœur de la zone commerciale de Derb Omar. Fort passage piéton, vitrine double, réserve, bureau. Accès livraison.',
    features: ['Grande vitrine', 'Réserve', 'Accès livraison', 'Fort passage'],
    agentIndex: 0,
  },
  {
    title: 'Grand appartement F4 — Hay Riad', type: 'APPARTEMENT', purpose: 'LOCATION',
    city: 'Casablanca', neighborhood: 'Hay Riad', price: 12000, area: 130, rooms: 4, bathrooms: 2,
    parking: true, elevator: true, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Grand appartement F4 dans résidence sécurisée. Quartier calme et résidentiel, proche écoles internationales et centres commerciaux.',
    features: ['Gardien 24h', 'Ascenseur', 'Parking', 'Sécurité'],
    agentIndex: 0,
  },

  // ── MARRAKECH – Sara (1) ─────────────────────────────────────────────────
  {
    title: 'Riad authentique restauré — Médina de Marrakech', type: 'RIAD', purpose: 'VENTE',
    city: 'Marrakech', neighborhood: 'Médina', price: 4200000, area: 320, rooms: 5, bathrooms: 4,
    parking: false, elevator: false, furnished: true, featured: true, status: 'DISPONIBLE',
    description: 'Magnifique riad traditionnel entièrement restauré au cœur de la Médina. Patio avec fontaine en zellige, salon marocain, terrasse avec vue sur les toits. Investissement locatif ou résidence de charme.',
    features: ['Patio fontaine', 'Zellige authentique', 'Salon marocain', 'Terrasse panoramique', 'Hammam', 'Cuisine équipée'],
    agentIndex: 1,
  },
  {
    title: 'Villa de luxe jardin tropical — Hivernage', type: 'VILLA', purpose: 'VENTE',
    city: 'Marrakech', neighborhood: 'Hivernage', price: 12000000, area: 600, rooms: 7, bathrooms: 5,
    parking: true, elevator: false, furnished: true, featured: true, status: 'DISPONIBLE',
    description: 'Villa de luxe dans le quartier huppé de l\'Hivernage. Jardin tropical, piscine chauffée, staff quarters. Prestige et raffinement à Marrakech.',
    features: ['Piscine chauffée', 'Jardin tropical', 'Staff quarters', 'Conciergerie', 'Sécurité privée'],
    agentIndex: 1,
  },
  {
    title: 'Appartement vue Atlas — Guéliz', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'Marrakech', neighborhood: 'Guéliz', price: 1650000, area: 85, rooms: 3, bathrooms: 2,
    parking: true, elevator: true, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Appartement avec vue imprenable sur l\'Atlas dans la résidence Le Jardin de Guéliz. Finitions soignées, terrasse, piscine commune.',
    features: ['Vue Atlas', 'Terrasse', 'Piscine commune', 'Parking souterrain'],
    agentIndex: 1,
  },
  {
    title: 'Riad contemporain en location — Bab Doukkala', type: 'RIAD', purpose: 'LOCATION',
    city: 'Marrakech', neighborhood: 'Bab Doukkala', price: 25000, area: 280, rooms: 4, bathrooms: 3,
    parking: false, elevator: false, furnished: true, featured: false, status: 'DISPONIBLE',
    description: 'Riad contemporain à la décoration soignée mêlant modernité et tradition. 4 suites, salon, terrasse soleil, piscine. Location mensuelle possible.',
    features: ['Piscine', 'Salon marocain', 'Cuisine équipée', 'Wifi haut débit', '4 suites'],
    agentIndex: 1,
  },
  {
    title: 'Riad hôtel 6 suites — Derb Dabachi', type: 'RIAD', purpose: 'VENTE',
    city: 'Marrakech', neighborhood: 'Médina', price: 7800000, area: 520, rooms: 6, bathrooms: 6,
    parking: false, elevator: false, furnished: true, featured: true, status: 'DISPONIBLE',
    description: 'Exceptionnel riad à 6 suites en exploitation hôtelière rentable. Classement Tripadvisor excellent. Restaurant, spa, piscine intérieure. Excellent retour sur investissement.',
    features: ['6 suites', 'Restaurant', 'Spa', 'Piscine intérieure', 'Réception', 'Hammam'],
    agentIndex: 1,
  },
  {
    title: 'Villa Palmeraie bord de golf', type: 'VILLA', purpose: 'LOCATION',
    city: 'Marrakech', neighborhood: 'Palmeraie', price: 85000, area: 500, rooms: 6, bathrooms: 5,
    parking: true, elevator: false, furnished: true, featured: false, status: 'LOUE',
    description: 'Superbe villa dans domaine sécurisé de la Palmeraie, en bordure de golf. Personnel inclus. Spa, piscine, salle de cinéma.',
    features: ['Bord de golf', 'Piscine', 'Personnel inclus', 'Sécurité 24h', 'Spa', 'Cinéma'],
    agentIndex: 1,
  },
  {
    title: 'Studio cosy meublé — Guéliz centre', type: 'STUDIO', purpose: 'LOCATION',
    city: 'Marrakech', neighborhood: 'Guéliz', price: 5500, area: 38, rooms: 1, bathrooms: 1,
    parking: false, elevator: false, furnished: true, featured: false, status: 'DISPONIBLE',
    description: 'Studio cosy entièrement meublé au cœur de Guéliz. Idéal pour étudiant ou jeune actif. Proche tram, université et commerces.',
    features: ['Meublé', 'Climatisation', 'Toit terrasse', 'Proche université'],
    agentIndex: 1,
  },
  {
    title: 'Appartement 3ch meublé — Majorelle', type: 'APPARTEMENT', purpose: 'LOCATION',
    city: 'Marrakech', neighborhood: 'Majorelle', price: 18000, area: 120, rooms: 4, bathrooms: 2,
    parking: true, elevator: true, furnished: true, featured: false, status: 'DISPONIBLE',
    description: 'Bel appartement meublé avec goût dans le secteur Majorelle. Lumineux, calme, piscine commune. Proche du Jardin Majorelle.',
    features: ['Piscine commune', 'Parking', 'Meublé', 'Terrasse', 'Proche Jardin Majorelle'],
    agentIndex: 1,
  },
  {
    title: 'Maison traditionnelle — Mellah', type: 'MAISON', purpose: 'VENTE',
    city: 'Marrakech', neighborhood: 'Mellah', price: 980000, area: 150, rooms: 4, bathrooms: 2,
    parking: false, elevator: false, furnished: false, featured: false, status: 'VENDU',
    description: 'Maison traditionnelle dans le quartier historique du Mellah. Potentiel de transformation en riad d\'hôtes. À deux pas des souks.',
    features: ['Patio', 'Terrasse', 'Zellige', 'Potentiel riad'],
    agentIndex: 1,
  },
  {
    title: 'Bureau meublé tout équipé — Hivernage', type: 'BUREAU', purpose: 'LOCATION',
    city: 'Marrakech', neighborhood: 'Hivernage', price: 12000, area: 80, rooms: null, bathrooms: 1,
    parking: true, elevator: true, furnished: true, featured: false, status: 'DISPONIBLE',
    description: 'Bureau meublé et équipé dans immeuble de standing de l\'Hivernage. Idéal pour profession libérale ou société de services. Salle de réunion partagée.',
    features: ['Meublé', 'Internet fibre', 'Salle réunion', 'Réception', 'Parking'],
    agentIndex: 1,
  },
  {
    title: 'Terrain constructible 500m² — Route de Fès', type: 'TERRAIN', purpose: 'VENTE',
    city: 'Marrakech', neighborhood: 'Route de Fès', price: 1800000, area: 500, rooms: null, bathrooms: null,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Terrain de 500m² avec titre foncier propre sur la Route de Fès. Zone résidentielle R+2 autorisé. Eau et électricité disponibles.',
    features: ['Titre foncier', 'R+2 autorisé', 'Eau/Électricité'],
    agentIndex: 1,
  },

  // ── TANGER – Karim (2) ───────────────────────────────────────────────────
  {
    title: 'Appartement vue mer panoramique — Cap Spartel', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'Tanger', neighborhood: 'Cap Spartel', price: 2400000, area: 110, rooms: 3, bathrooms: 2,
    parking: true, elevator: true, furnished: false, featured: true, status: 'DISPONIBLE',
    description: 'Appartement avec vue panoramique sur l\'Atlantique et le Détroit de Gibraltar. Résidence sécurisée, piscine, spa, plage privée à 200m.',
    features: ['Vue mer panoramique', 'Plage privée', 'Piscine', 'Spa', 'Sécurité 24h', 'Terrasse'],
    agentIndex: 2,
  },
  {
    title: 'Villa moderne avec vue Détroit — Malabata', type: 'VILLA', purpose: 'VENTE',
    city: 'Tanger', neighborhood: 'Malabata', price: 6500000, area: 350, rooms: 5, bathrooms: 4,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Villa contemporaine avec piscine sur les hauteurs de Malabata. Vue mer imprenable sur le Détroit, jardin paysager, domotique intégrée.',
    features: ['Vue Détroit', 'Piscine', 'Domotique', 'Jardin paysager', 'Terrasse panoramique'],
    agentIndex: 2,
  },
  {
    title: 'Studio meublé centre-ville Tanger', type: 'STUDIO', purpose: 'LOCATION',
    city: 'Tanger', neighborhood: 'Centre-ville', price: 4500, area: 35, rooms: 1, bathrooms: 1,
    parking: false, elevator: false, furnished: true, featured: false, status: 'DISPONIBLE',
    description: 'Studio entièrement équipé en plein centre de Tanger. Accès facile aux plages, port et commerces.',
    features: ['Meublé', 'Climatisation', 'Proche plage', 'Proche port'],
    agentIndex: 2,
  },
  {
    title: 'Appartement neuf vue mer — Achakar', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'Tanger', neighborhood: 'Achakar', price: 1950000, area: 120, rooms: 4, bathrooms: 2,
    parking: true, elevator: true, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Appartement neuf dans résidence Achakar Beach. À 200m de la plage. Finitions haut de gamme, terrasse vue mer partielle.',
    features: ['Neuf', 'Vue mer partielle', 'Terrasse', 'Proche plage', 'Ascenseur'],
    agentIndex: 2,
  },
  {
    title: 'Terrain zone franche Tanger Med', type: 'TERRAIN', purpose: 'VENTE',
    city: 'Tanger', neighborhood: 'Zone Franche', price: 5500000, area: 2000, rooms: null, bathrooms: null,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Grand terrain de 2000m² dans la zone franche de Tanger Med. Idéal pour entrepôt ou unité industrielle. Exonération fiscale.',
    features: ['Zone franche', 'Accès TIR', 'Exonération fiscale', 'Clôturé'],
    agentIndex: 2,
  },
  {
    title: 'Maison vue Détroit — Charf', type: 'MAISON', purpose: 'VENTE',
    city: 'Tanger', neighborhood: 'Charf', price: 3200000, area: 220, rooms: 5, bathrooms: 3,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Maison individuelle R+1 avec vue sur le Détroit de Gibraltar. Grande terrasse, jardin, garage double. Quartier résidentiel calme.',
    features: ['Vue Détroit', 'Terrasse panoramique', 'Jardin', 'Garage double'],
    agentIndex: 2,
  },
  {
    title: 'Maison bleue — Médina de Chefchaouen', type: 'MAISON', purpose: 'VENTE',
    city: 'Chefchaouen', neighborhood: 'Médina', price: 1200000, area: 180, rooms: 5, bathrooms: 3,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Maison typique dans la médina bleue de Chefchaouen. Architecture rifaine préservée, terrasse avec vue montagne. Potentiel maison d\'hôtes.',
    features: ['Vue montagne', 'Architecture rifaine', 'Terrasse', 'Patio', 'Potentiel hôte'],
    agentIndex: 2,
  },
  {
    title: 'Villa bord de mer — Martil Tétouan', type: 'VILLA', purpose: 'VENTE',
    city: 'Tétouan', neighborhood: 'Martil', price: 2800000, area: 220, rooms: 5, bathrooms: 3,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Villa avec accès direct à la plage de Martil. Jardin, terrasse vue mer, garage. Quartier balnéaire prisé.',
    features: ['Accès plage direct', 'Vue mer', 'Jardin', 'Terrasse', 'Garage'],
    agentIndex: 2,
  },

  // ── RABAT ─── Ahmed (0) ──────────────────────────────────────────────────
  {
    title: 'Appartement standing — Agdal Rabat', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'Rabat', neighborhood: 'Agdal', price: 2100000, area: 100, rooms: 3, bathrooms: 2,
    parking: true, elevator: true, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Appartement dans la résidence Agdal Park. Quartier résidentiel prisé, proche ministères et ambassades. Piscine et salle de sport en commun.',
    features: ['Résidence sécurisée', 'Piscine', 'Salle de sport', 'Proche ministères'],
    agentIndex: 0,
  },
  {
    title: 'Somptueuse villa — Souissi diplomatique', type: 'VILLA', purpose: 'VENTE',
    city: 'Rabat', neighborhood: 'Souissi', price: 14000000, area: 700, rooms: 8, bathrooms: 6,
    parking: true, elevator: true, furnished: true, featured: true, status: 'DISPONIBLE',
    description: 'Somptueuse villa dans le quartier diplomatique de Souissi. Parc arboré, piscine olympique, salle de cinéma, hammam. Personnel de maison inclus.',
    features: ['Parc arboré', 'Piscine olympique', 'Cinéma privé', 'Hammam', 'Studio gardien', 'Personnel'],
    agentIndex: 0,
  },
  {
    title: 'Appartement quartier Hassan — Rabat', type: 'APPARTEMENT', purpose: 'LOCATION',
    city: 'Rabat', neighborhood: 'Hassan', price: 14000, area: 90, rooms: 3, bathrooms: 2,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Appartement spacieux quartier Hassan, à deux pas de la Tour Hassan et du Mausolée Mohammed V. Vue sur les monuments.',
    features: ['Vue monuments', 'Quartier historique', 'Parking', 'Calme'],
    agentIndex: 0,
  },

  // ── AGADIR – Sara (1) ────────────────────────────────────────────────────
  {
    title: 'Appartement front de mer — Corniche Agadir', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'Agadir', neighborhood: 'Corniche', price: 1750000, area: 90, rooms: 3, bathrooms: 2,
    parking: true, elevator: true, furnished: false, featured: true, status: 'DISPONIBLE',
    description: 'Appartement face à la plage d\'Agadir. La mer à portée de main! Résidence avec accès direct à la plage, piscine commune.',
    features: ['Face à la plage', 'Accès plage privé', 'Piscine', 'Terrasse', 'Vue mer'],
    agentIndex: 1,
  },
  {
    title: 'Villa moderne avec piscine — Founty Agadir', type: 'VILLA', purpose: 'VENTE',
    city: 'Agadir', neighborhood: 'Founty', price: 4800000, area: 300, rooms: 5, bathrooms: 4,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Villa récente dans le quartier résidentiel de Founty. Piscine, jardin, proche golfs et commerces. Quartier calme et sécurisé.',
    features: ['Piscine', 'Jardin', 'Proche golf', 'Sécurité'],
    agentIndex: 1,
  },
  {
    title: 'Studio touristique meublé — Agadir plage', type: 'STUDIO', purpose: 'LOCATION',
    city: 'Agadir', neighborhood: 'Talborjt', price: 4000, area: 35, rooms: 1, bathrooms: 1,
    parking: false, elevator: false, furnished: true, featured: false, status: 'DISPONIBLE',
    description: 'Studio touristique meublé et équipé. 5 minutes à pied de la plage. Idéal court séjour ou location saisonnière.',
    features: ['Meublé', 'Climatisation', 'WiFi', 'Proche plage'],
    agentIndex: 1,
  },

  // ── FÈS ──────────────────────────────────────────────────────────────────
  {
    title: 'Riad exceptionnel — Fès el-Bali UNESCO', type: 'RIAD', purpose: 'VENTE',
    city: 'Fès', neighborhood: 'Fès el-Bali', price: 2800000, area: 280, rooms: 5, bathrooms: 4,
    parking: false, elevator: false, furnished: true, featured: true, status: 'DISPONIBLE',
    description: 'Authentique riad dans la Médina de Fès, classée UNESCO. Entièrement restauré, déco en zellige, stuc et cèdre sculpté. Patio avec fontaine, terrasse vue minarets.',
    features: ['Site classé UNESCO', 'Patio fontaine', 'Zellige/Stuc/Cèdre', 'Vue minarets', 'Hammam privé'],
    agentIndex: 1,
  },
  {
    title: 'Villa familiale — Fès Ville Nouvelle', type: 'VILLA', purpose: 'VENTE',
    city: 'Fès', neighborhood: 'Ville Nouvelle', price: 3500000, area: 280, rooms: 6, bathrooms: 4,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Belle villa R+1 dans la ville nouvelle de Fès. Jardin, garage, salon marocain traditionnel. Quartier calme et résidentiel.',
    features: ['Jardin', 'Garage', 'Salon marocain', 'Terrasse'],
    agentIndex: 2,
  },
  {
    title: 'Appartement neuf — Résidence Narjiss Fès', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'Fès', neighborhood: 'Narjiss', price: 980000, area: 80, rooms: 3, bathrooms: 1,
    parking: true, elevator: true, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Appartement neuf dans la résidence Narjiss. Finitions modernes de qualité. Proche université et hôpitaux. Bon investissement locatif.',
    features: ['Neuf', 'Ascenseur', 'Parking', 'Proche université'],
    agentIndex: 0,
  },
  {
    title: 'Maison à rénover — Médina de Fès', type: 'MAISON', purpose: 'VENTE',
    city: 'Fès', neighborhood: 'Médina', price: 650000, area: 120, rooms: 4, bathrooms: 2,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Maison traditionnelle dans la médina historique. Potentiel de réhabilitation en riad ou maison d\'hôtes. Très bien située, vue sur monuments.',
    features: ['Médina historique', 'Potentiel riad', 'Terrasse', 'Vue monuments'],
    agentIndex: 1,
  },

  // ── ESSAOUIRA / DAKHLA / EL JADIDA – Sara (1) & Karim (2) ───────────────
  {
    title: 'Riad enchanteur — Médina d\'Essaouira', type: 'RIAD', purpose: 'VENTE',
    city: 'Essaouira', neighborhood: 'Médina', price: 1900000, area: 200, rooms: 4, bathrooms: 3,
    parking: false, elevator: false, furnished: true, featured: true, status: 'DISPONIBLE',
    description: 'Riad enchanteur dans la médina classée d\'Essaouira. Vue sur les remparts historiques, déco bohème-chic, terrasse avec vue mer.',
    features: ['Vue remparts', 'Vue mer', 'Terrasse', 'Patio', 'Meublé', 'Style bohème'],
    agentIndex: 1,
  },
  {
    title: 'Villa bord de lagon — Dakhla', type: 'VILLA', purpose: 'VENTE',
    city: 'Dakhla', neighborhood: 'Lagon', price: 2200000, area: 250, rooms: 4, bathrooms: 3,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Villa exclusive sur le lagon de Dakhla, paradis du kitesurf et windsurf. Accès direct au lagon, vue 360°, terrain de 500m².',
    features: ['Accès lagon direct', 'Vue 360°', 'Terrain 500m²', 'Kitesurf'],
    agentIndex: 2,
  },
  {
    title: 'Appartement neuf El Jadida Marina', type: 'APPARTEMENT', purpose: 'VENTE',
    city: 'El Jadida', neighborhood: 'Centre', price: 890000, area: 75, rooms: 2, bathrooms: 1,
    parking: true, elevator: true, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Appartement neuf dans résidence El Jadida Marina. Proche de la cité portugaise classée et des plages de l\'Atlantique.',
    features: ['Neuf', 'Proche mer', 'Ascenseur', 'Proche cité portugaise'],
    agentIndex: 1,
  },
  {
    title: 'Commerce angle de rue — Maarif Casa', type: 'COMMERCE', purpose: 'VENTE',
    city: 'Casablanca', neighborhood: 'Maarif', price: 3500000, area: 120, rooms: null, bathrooms: 1,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Local commercial en angle avec deux façades sur rue passante. Emplacement n°1 de Maarif. Fond de commerce possible.',
    features: ['2 façades sur rue', 'Angle de rue', 'Emplacement premium', 'Fort passage'],
    agentIndex: 0,
  },
  {
    title: 'Duplex terrasse roof — Hay Hassani', type: 'DUPLEX', purpose: 'VENTE',
    city: 'Casablanca', neighborhood: 'Hay Hassani', price: 1850000, area: 145, rooms: 4, bathrooms: 3,
    parking: true, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Beau duplex avec terrasse sur roof. Deux niveaux bien agencés, cuisine ouverte américaine, parking privatif en sous-sol.',
    features: ['Terrasse roof', 'Cuisine ouverte', 'Parking', '2 niveaux'],
    agentIndex: 0,
  },
  {
    title: 'Terrain résidentiel 700m² — Témara Rabat', type: 'TERRAIN', purpose: 'VENTE',
    city: 'Rabat', neighborhood: 'Témara', price: 1400000, area: 700, rooms: null, bathrooms: null,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Terrain de 700m² dans lotissement résidentiel de Témara. Tous réseaux raccordés, titre foncier libre, R+2 autorisé.',
    features: ['Titre foncier', 'Tous réseaux', 'Zone R+2', 'Lotissement résidentiel'],
    agentIndex: 2,
  },
  {
    title: 'Terrain agricole grande superficie — Souss', type: 'TERRAIN', purpose: 'VENTE',
    city: 'Agadir', neighborhood: 'Souss', price: 800000, area: 3000, rooms: null, bathrooms: null,
    parking: false, elevator: false, furnished: false, featured: false, status: 'DISPONIBLE',
    description: 'Grand terrain agricole 3000m² dans la plaine du Souss. Eau abondante, idéal maraîchage et arboriculture. Piste d\'accès.',
    features: ['Eau agricole', 'Électricité', 'Accès piste', 'Grande superficie'],
    agentIndex: 2,
  },
];

// ─── Leads ──────────────────────────────────────────────────────────────────
const LEAD_NAMES = [
  { name: 'Mohamed Rachidi',  phone: '+212661111111', email: 'rachidi@gmail.com',   message: 'Bonjour, je suis intéressé par ce bien. Pouvez-vous me contacter ?' },
  { name: 'Fatima Zahra',     phone: '+212662222222', email: 'fzahra@hotmail.com',  message: 'Est-ce que le prix est négociable ? Merci de me rappeler.' },
  { name: 'Youssef Berrada',  phone: '+212663333333', email: 'berrada@gmail.com',   message: 'Je voudrais organiser une visite cette semaine.' },
  { name: 'Amina Elhassani',  phone: '+212664444444', email: 'amina@gmail.com',     message: 'Disponible pour une visite samedi matin.' },
  { name: 'Khalid Mansouri',  phone: '+212665555555', email: 'khalid@outlook.com',  message: 'Je cherche un bien pour investissement. Ce bien m\'intéresse.' },
  { name: 'Nadia Benmoussa',  phone: '+212666666666', email: 'nadia@gmail.com',     message: 'Merci de me donner plus d\'informations sur ce bien.' },
  { name: 'Omar Tahiri',      phone: '+212667777777', email: 'tahiri@yahoo.fr',     message: 'Je suis client sérieux, financement déjà en cours.' },
  { name: 'Leila Idrissi',    phone: '+212668888888', email: 'leila@gmail.com',     message: 'Ce bien correspond à mes critères. Quand puis-je visiter ?' },
  { name: 'Hamid Cherkaoui',  phone: '+212669999999', email: 'cherkaoui@gmail.com', message: 'Budget disponible, très intéressé par ce bien.' },
  { name: 'Sanaa Bensouda',   phone: '+212660000000', email: 'bensouda@gmail.com',  message: 'Pouvez-vous m\'envoyer plus de photos ?' },
  { name: 'Adil Laghrissi',   phone: '+212671234567', email: 'adil@gmail.com',      message: 'Je voudrais connaître les charges et taxes associées.' },
  { name: 'Dounia Filali',    phone: '+212672345678', email: 'filali@hotmail.com',  message: 'Bien idéal pour notre famille. Disponible pour visite en semaine.' },
  { name: 'Mehdi Sekkouri',   phone: '+212673456789', email: 'sekkouri@gmail.com',  message: 'Question sur le statut juridique du bien.' },
  { name: 'Rim Alaoui',       phone: '+212674567890', email: 'rim@gmail.com',       message: 'Très sérieuse, offre cash possible. Merci de me rappeler.' },
  { name: 'Tarik Benali',     phone: '+212675678901', email: 'tarik@gmail.com',     message: 'Ce bien est-il encore disponible ?' },
];

const LEAD_STATUSES = ['NOUVEAU', 'CONTACTED', 'QUALIFIED', 'CLOSED_WON', 'CLOSED_LOST'];

// ─── Main seeder ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 ImmoMaroc Data Seeder Starting...\n');

  // 1. Login as admin
  info('STEP 1 — Admin Login');
  let adminToken;
  try {
    const auth = await post('/api/auth/login', { email: 'admin@immomaroc.ma', password: 'admin123' });
    adminToken = auth.token;
    log(`Admin logged in as ${auth.name}`);
  } catch (e) {
    console.error('❌ Admin login failed:', e.message);
    process.exit(1);
  }

  // 2. Create 3 agents
  info('STEP 2 — Creating Agents');
  const createdAgents = [];
  for (const a of AGENTS_DATA) {
    try {
      const agent = await post('/api/agents', a, adminToken);
      createdAgents.push(agent);
      log(`Agent created: ${agent.name} (id=${agent.id}, agentId=${agent.agentId ?? agent.id})`);
    } catch (e) {
      if (e.message.includes('409') || e.message.toLowerCase().includes('exist')) {
        warn(`Agent ${a.email} already exists, skipping`);
        // Try to get existing agent
        try {
          const list = await req('GET', '/api/agents/admin/all', null, adminToken);
          const found = list.find(x => x.email === a.email);
          if (found) createdAgents.push(found);
        } catch {}
      } else {
        console.error(`  ❌ Failed to create agent ${a.name}:`, e.message);
        createdAgents.push(null);
      }
    }
  }

  // 3. Login as each agent
  info('STEP 3 — Agent Logins');
  const agentTokens = [];
  const agentIds    = [];
  for (let i = 0; i < AGENTS_DATA.length; i++) {
    const a = AGENTS_DATA[i];
    try {
      const auth = await post('/api/auth/login', { email: a.email, password: a.password });
      agentTokens.push(auth.token);
      agentIds.push(auth.agentId ?? createdAgents[i]?.id);
      log(`Logged in: ${auth.name} (agentId=${auth.agentId ?? createdAgents[i]?.id})`);
    } catch (e) {
      console.error(`  ❌ Agent login failed (${a.email}):`, e.message);
      agentTokens.push(null);
      agentIds.push(null);
    }
  }

  // 4. Create 50 properties
  info('STEP 4 — Creating 50 Properties');
  const createdProps = [];
  let propOk = 0, propFail = 0;

  for (const p of PROPS) {
    const idx = p.agentIndex;
    const token = agentTokens[idx];
    if (!token) { warn(`No token for agent ${idx}, skipping "${p.title}"`); propFail++; continue; }

    const payload = {
      title:        p.title,
      type:         p.type,
      purpose:      p.purpose,
      city:         p.city,
      neighborhood: p.neighborhood || null,
      price:        p.price,
      area:         p.area   || null,
      rooms:        p.rooms  || null,
      bathrooms:    p.bathrooms || null,
      floor:        p.floor  || null,
      parking:      p.parking  ?? false,
      elevator:     p.elevator ?? false,
      furnished:    p.furnished ?? false,
      featured:     p.featured  ?? false,
      description:  p.description,
      features:     p.features || [],
      images:       makeImages(p.type),
    };

    try {
      const prop = await post('/api/properties', payload, token);
      createdProps.push({ id: prop.id, status: p.status });

      // Update status if not DISPONIBLE
      if (p.status && p.status !== 'DISPONIBLE') {
        try {
          await patch(`/api/properties/${prop.id}/status`, { status: p.status }, token);
        } catch {}
      }
      // Toggle featured
      if (p.featured) {
        try {
          await patch(`/api/properties/${prop.id}/featured`, null, adminToken);
        } catch {}
      }

      propOk++;
      process.stdout.write(`  ✓ [${propOk + propFail}/${PROPS.length}] ${p.title.substring(0, 50)}\n`);
    } catch (e) {
      propFail++;
      console.error(`  ❌ [${propOk + propFail}/${PROPS.length}] ${p.title.substring(0, 40)}: ${e.message.substring(0, 80)}`);
    }
  }

  // 5. Update agents' sold count via admin update
  info('STEP 5 — Updating Agent Stats');
  const soldCounts = [8, 12, 5];
  const ratings    = [4.8, 4.9, 4.5];
  for (let i = 0; i < createdAgents.length; i++) {
    const agent = createdAgents[i];
    if (!agent) continue;
    try {
      await put(`/api/agents/${agent.id}`, {
        name:        AGENTS_DATA[i].name,
        phone:       AGENTS_DATA[i].phone,
        whatsapp:    AGENTS_DATA[i].whatsapp,
        agency:      AGENTS_DATA[i].agency,
        city:        AGENTS_DATA[i].city,
        bio:         AGENTS_DATA[i].bio,
        verified:    AGENTS_DATA[i].verified,
        specialties: AGENTS_DATA[i].specialties,
        avatar:      AGENTS_DATA[i].avatar,
        sold:        soldCounts[i],
        rating:      ratings[i],
      }, adminToken);
      log(`Updated stats for ${AGENTS_DATA[i].name} — sold=${soldCounts[i]}, rating=${ratings[i]}`);
    } catch (e) {
      warn(`Could not update stats for agent ${i}: ${e.message.substring(0, 60)}`);
    }
  }

  // 6. Create leads
  info('STEP 6 — Creating Leads');
  const availableProps = createdProps.filter(p => p.id);
  let leadOk = 0, leadFail = 0;

  // Distribute leads across first 15 properties
  const propsForLeads = availableProps.slice(0, Math.min(15, availableProps.length));

  for (let i = 0; i < LEAD_NAMES.length; i++) {
    if (propsForLeads.length === 0) break;
    const prop  = propsForLeads[i % propsForLeads.length];
    const ldata = LEAD_NAMES[i];
    try {
      const lead = await post('/api/leads', {
        name:       ldata.name,
        phone:      ldata.phone,
        email:      ldata.email,
        message:    ldata.message,
        propertyId: prop.id,
      });
      // Update status to mix things up
      const status = LEAD_STATUSES[i % LEAD_STATUSES.length];
      if (status !== 'NOUVEAU') {
        // find the agent token for this property
        // use admin token as fallback
        try {
          await patch(`/api/leads/${lead.id}/status`, { status }, adminToken);
        } catch {}
      }
      leadOk++;
    } catch (e) {
      leadFail++;
      warn(`Lead ${ldata.name}: ${e.message.substring(0, 60)}`);
    }
  }
  log(`Leads created: ${leadOk} ok, ${leadFail} failed`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log('  🎉  SEEDING COMPLETE');
  console.log('═'.repeat(55));
  console.log(`  Agents    : ${createdAgents.filter(Boolean).length} / ${AGENTS_DATA.length}`);
  console.log(`  Properties: ${propOk} / ${PROPS.length}`);
  console.log(`  Leads     : ${leadOk} / ${LEAD_NAMES.length}`);
  console.log('─'.repeat(55));
  console.log('  👤 Admin      : admin@immomaroc.ma  / admin123');
  console.log('  👤 Ahmed      : ahmed.benali@immomaroc.ma  / Agent@2024');
  console.log('  👤 Sara       : sara.alaoui@immomaroc.ma   / Agent@2024');
  console.log('  👤 Karim      : karim.tazi@immomaroc.ma    / Agent@2024');
  console.log('═'.repeat(55) + '\n');
}

seed().catch(e => { console.error('Fatal error:', e); process.exit(1); });
