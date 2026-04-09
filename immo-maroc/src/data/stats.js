export const platformStats = {
  totalListings:        77,
  available:            52,
  totalSold:            18,
  totalRented:           7,
  totalAgents:           5,
  activeAgents:          5,
  totalCities:          10,
  totalViews:         9847,
  monthlyLeads:         143,
  newListingsThisMonth:   8,
};

export const agentStats = {
  listings:        12,
  activeListings:   8,
  sold:             2,
  leads:            5,
  views:         1842,
  profileViews:   324,
};

export const recentActivity = [
  { id:1, type:'new_lead',    text:'Nouveau message de Mohamed A. pour "Appartement Ain Diab"', time:'Il y a 20 min' },
  { id:2, type:'view',        text:'Votre annonce "Duplex Anfa" a reçu 12 nouvelles vues',       time:'Il y a 1h' },
  { id:3, type:'status',      text:'Statut mis à jour : "Studio Guéliz" → Loué',                 time:'Il y a 3h' },
  { id:4, type:'new_lead',    text:'Demande de visite pour "Villa Palmeraie" reçue',             time:'Hier 16h30' },
  { id:5, type:'new_listing', text:'Nouvelle annonce publiée : "Terrain Route Tétouan"',         time:'Hier 10h00' },
];

export const leads = [
  { id:1, name:'Mohamed Alaoui',   phone:'+212 661 111 222', email:'m.alaoui@gmail.com',    propertyId:1, propertyTitle:'Appartement Ain Diab',   message:'Je suis intéressé, pouvez-vous me contacter svp?', date:'2024-03-20', status:'nouveau' },
  { id:2, name:'Fatima Zahra',     phone:'+212 662 333 444', email:'fz.bennis@yahoo.fr',     propertyId:9, propertyTitle:'Duplex Anfa',            message:'Disponible pour une visite samedi prochain',       date:'2024-03-19', status:'en cours' },
  { id:3, name:'Jean-Pierre Morin',phone:'+33 6 12 34 56 78',email:'jp.morin@outlook.com',   propertyId:2, propertyTitle:'Villa Palmeraie',        message:'Quelles sont les conditions de vente exactes?',    date:'2024-03-18', status:'en cours' },
  { id:4, name:'Rachid Senhaji',   phone:'+212 663 555 666', email:'r.senhaji@gmail.com',    propertyId:4, propertyTitle:'Appartement Agdal',      message:'Est-ce que la cuisine est équipée?',               date:'2024-03-17', status:'traité' },
  { id:5, name:'Sophie Lecomte',   phone:'+33 7 89 01 23 45',email:'s.lecomte@gmail.com',    propertyId:3, propertyTitle:'Riad Médina Fès',        message:'Nous cherchons un riad pour en faire une maison d\'hôtes', date:'2024-03-16', status:'traité' },
];
