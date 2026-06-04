/** Curated AU/NZ suburbs for typeahead (expand over time). */
export interface SuburbEntry {
  id: string;
  name: string;
  state: string;
  country: 'AU' | 'NZ';
  latitude: number;
  longitude: number;
}

export const AU_NZ_SUBURBS: SuburbEntry[] = [
  // NSW
  { id: 'au-nsw-sydney', name: 'Sydney', state: 'NSW', country: 'AU', latitude: -33.8688, longitude: 151.2093 },
  { id: 'au-nsw-surry-hills', name: 'Surry Hills', state: 'NSW', country: 'AU', latitude: -33.8847, longitude: 151.2094 },
  { id: 'au-nsw-newtown', name: 'Newtown', state: 'NSW', country: 'AU', latitude: -33.898, longitude: 151.1745 },
  { id: 'au-nsw-bondi', name: 'Bondi', state: 'NSW', country: 'AU', latitude: -33.8915, longitude: 151.2767 },
  { id: 'au-nsw-parramatta', name: 'Parramatta', state: 'NSW', country: 'AU', latitude: -33.815, longitude: 151.001 },
  { id: 'au-nsw-chatswood', name: 'Chatswood', state: 'NSW', country: 'AU', latitude: -33.7969, longitude: 151.183 },
  { id: 'au-nsw-manly', name: 'Manly', state: 'NSW', country: 'AU', latitude: -33.7969, longitude: 151.2878 },
  { id: 'au-nsw-newcastle', name: 'Newcastle', state: 'NSW', country: 'AU', latitude: -32.9283, longitude: 151.7817 },
  { id: 'au-nsw-wollongong', name: 'Wollongong', state: 'NSW', country: 'AU', latitude: -34.4278, longitude: 150.8931 },
  // VIC
  { id: 'au-vic-melbourne', name: 'Melbourne', state: 'VIC', country: 'AU', latitude: -37.8136, longitude: 144.9631 },
  { id: 'au-vic-fitzroy', name: 'Fitzroy', state: 'VIC', country: 'AU', latitude: -37.798, longitude: 144.978 },
  { id: 'au-vic-carlton', name: 'Carlton', state: 'VIC', country: 'AU', latitude: -37.8, longitude: 144.9667 },
  { id: 'au-vic-richmond', name: 'Richmond', state: 'VIC', country: 'AU', latitude: -37.8182, longitude: 145.0018 },
  { id: 'au-vic-st-kilda', name: 'St Kilda', state: 'VIC', country: 'AU', latitude: -37.8676, longitude: 144.981 },
  { id: 'au-vic-brunswick', name: 'Brunswick', state: 'VIC', country: 'AU', latitude: -37.7667, longitude: 144.9667 },
  { id: 'au-vic-footscray', name: 'Footscray', state: 'VIC', country: 'AU', latitude: -37.8, longitude: 144.9 },
  { id: 'au-vic-geelong', name: 'Geelong', state: 'VIC', country: 'AU', latitude: -38.1499, longitude: 144.3617 },
  { id: 'au-vic-ballarat', name: 'Ballarat', state: 'VIC', country: 'AU', latitude: -37.5622, longitude: 143.8503 },
  // QLD
  { id: 'au-qld-brisbane', name: 'Brisbane', state: 'QLD', country: 'AU', latitude: -27.4698, longitude: 153.0251 },
  { id: 'au-qld-fortitude-valley', name: 'Fortitude Valley', state: 'QLD', country: 'AU', latitude: -27.4574, longitude: 153.0349 },
  { id: 'au-qld-south-brisbane', name: 'South Brisbane', state: 'QLD', country: 'AU', latitude: -27.4804, longitude: 153.0205 },
  { id: 'au-qld-gold-coast', name: 'Gold Coast', state: 'QLD', country: 'AU', latitude: -28.0167, longitude: 153.4 },
  { id: 'au-qld-sunshine-coast', name: 'Sunshine Coast', state: 'QLD', country: 'AU', latitude: -26.65, longitude: 153.0667 },
  { id: 'au-qld-cairns', name: 'Cairns', state: 'QLD', country: 'AU', latitude: -16.9186, longitude: 145.7781 },
  // WA
  { id: 'au-wa-perth', name: 'Perth', state: 'WA', country: 'AU', latitude: -31.9505, longitude: 115.8605 },
  { id: 'au-wa-fremantle', name: 'Fremantle', state: 'WA', country: 'AU', latitude: -32.0569, longitude: 115.7439 },
  { id: 'au-wa-subiaco', name: 'Subiaco', state: 'WA', country: 'AU', latitude: -31.9485, longitude: 115.8265 },
  // SA
  { id: 'au-sa-adelaide', name: 'Adelaide', state: 'SA', country: 'AU', latitude: -34.9285, longitude: 138.6007 },
  { id: 'au-sa-north-adelaide', name: 'North Adelaide', state: 'SA', country: 'AU', latitude: -34.9073, longitude: 138.5939 },
  // ACT
  { id: 'au-act-canberra', name: 'Canberra', state: 'ACT', country: 'AU', latitude: -35.2809, longitude: 149.13 },
  { id: 'au-act-braddon', name: 'Braddon', state: 'ACT', country: 'AU', latitude: -35.2669, longitude: 149.1326 },
  // TAS
  { id: 'au-tas-hobart', name: 'Hobart', state: 'TAS', country: 'AU', latitude: -42.8821, longitude: 147.3272 },
  { id: 'au-tas-sandy-bay', name: 'Sandy Bay', state: 'TAS', country: 'AU', latitude: -42.8944, longitude: 147.3294 },
  // NT
  { id: 'au-nt-darwin', name: 'Darwin', state: 'NT', country: 'AU', latitude: -12.4634, longitude: 130.8456 },
  // NZ — Auckland
  { id: 'nz-auckland-cbd', name: 'Auckland CBD', state: 'Auckland', country: 'NZ', latitude: -36.8485, longitude: 174.7633 },
  { id: 'nz-ponsonby', name: 'Ponsonby', state: 'Auckland', country: 'NZ', latitude: -36.8481, longitude: 174.7434 },
  { id: 'nz-parnell', name: 'Parnell', state: 'Auckland', country: 'NZ', latitude: -36.8572, longitude: 174.7766 },
  { id: 'nz-mt-eden', name: 'Mount Eden', state: 'Auckland', country: 'NZ', latitude: -36.877, longitude: 174.764 },
  { id: 'nz-north-shore', name: 'Takapuna', state: 'Auckland', country: 'NZ', latitude: -36.787, longitude: 174.77 },
  // NZ — Wellington
  { id: 'nz-wellington-cbd', name: 'Wellington CBD', state: 'Wellington', country: 'NZ', latitude: -41.2865, longitude: 174.7762 },
  { id: 'nz-te-aro', name: 'Te Aro', state: 'Wellington', country: 'NZ', latitude: -41.2965, longitude: 174.7762 },
  { id: 'nz-petone', name: 'Petone', state: 'Wellington', country: 'NZ', latitude: -41.2276, longitude: 174.8706 },
  // NZ — Canterbury / Otago
  { id: 'nz-christchurch', name: 'Christchurch', state: 'Canterbury', country: 'NZ', latitude: -43.5321, longitude: 172.6362 },
  { id: 'nz-riccarton', name: 'Riccarton', state: 'Canterbury', country: 'NZ', latitude: -43.531, longitude: 172.599 },
  { id: 'nz-queenstown', name: 'Queenstown', state: 'Otago', country: 'NZ', latitude: -45.0312, longitude: 168.6626 },
  { id: 'nz-dunedin', name: 'Dunedin', state: 'Otago', country: 'NZ', latitude: -45.8741, longitude: 170.5036 },
  { id: 'nz-hamilton', name: 'Hamilton', state: 'Waikato', country: 'NZ', latitude: -37.787, longitude: 175.2793 },
  { id: 'nz-tauranga', name: 'Tauranga', state: 'Bay of Plenty', country: 'NZ', latitude: -37.6878, longitude: 176.1651 },
];
