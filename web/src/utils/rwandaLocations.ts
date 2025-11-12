// Rwanda administrative divisions data
const rwandaData = {
  provinces: ['Kigali City', 'Eastern Province', 'Northern Province', 'Southern Province', 'Western Province'],

  districts: {
    'kigali city': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'eastern province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    'northern province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
    'southern province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
    'western province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro']
  },

  sectors: {
    // Kigali Province
    'gasabo': ['Bumbogo', 'Gatsata', 'Jali', 'Gikomero', 'Gisozi', 'Jabana', 'Kacyiru', 'Kimihurura', 'Kimironko', 'Kinyinya', 'Ndera', 'Nduba', 'Rusororo', 'Rutunga'],
    'kicukiro': ['Gahanga', 'Gatenga', 'Gikondo', 'Kagarama', 'Kanombe', 'Kicukiro', 'Niboye', 'Nyarugunga', 'Rukiri', 'Masaka'],
    'nyarugenge': ['Gitega', 'Kanyinya', 'Kigali', 'Kimisagara', 'Mageragere', 'Muhima', 'Nyakabanda', 'Nyamirambo', 'Nyarugenge', 'Rwezamenyo'],

    // Eastern Province - major districts
    'bugesera': ['Gashora', 'Juru', 'Kamabuye', 'Mareba', 'Mayange', 'Musenyi', 'Mwogo', 'Ngeruka', 'Ntarama', 'Nyamata', 'Nyarugenge', 'Rilima', 'Ruhuha', 'Rweru', 'Shyara'],
    'gatsibo': ['Gasange', 'Gatsibo', 'Gitoki', 'Kabarore', 'Kageyo', 'Kiramuruzi', 'Kiziguro', 'Muhura', 'Murambi', 'Nyagihanga', 'Remera', 'Rugarama', 'Rwimbogo'],

    // Northern Province - major districts
    'musanze': ['Busogo', 'Cyuve', 'Gacaca', 'Gashaki', 'Gataraga', 'Kimonyi', 'Kinigi', 'Muhoza', 'Muko', 'Musanze', 'Nkotsi', 'Nyange', 'Remera', 'Rwaza', 'Shingiro'],
    'gicumbi': ['Bukure', 'Bwisige', 'Byumba', 'Cyumba', 'Gicumbi', 'Kaniga', 'Manyagiro', 'Miyove', 'Munini', 'Nyamiyaga', 'Nyankenke', 'Rubaya', 'Rukomo', 'Rushenyi', 'Rutare', 'Rwerere'],

    // Southern Province - major districts
    'huye': ['Gishamvu', 'Karama', 'Kigoma', 'Kinazi', 'Maraba', 'Mbazi', 'Mukura', 'Ngoma', 'Ruhashya', 'Rusatira', 'Rwaniro', 'Simbi', 'Tumba'],
    'muhanga': ['Cyeza', 'Kabacuzi', 'Kibangu', 'Kiyumba', 'Muhanga', 'Mushishiro', 'Nyabinoni', 'Nyamabuye', 'Nyarusange', 'Rongi', 'Rugendabari', 'Shyogwe'],

    // Western Province - major districts
    'rubavu': ['Bugeshi', 'Busasamana', 'Cyanzarwe', 'Gisenyi', 'Kanama', 'Mudende', 'Nyakiliba', 'Nyamyumba', 'Rubavu', 'Rugerero'],
    'rusizi': ['Butare', 'Bugarama', 'Giheke', 'Gishoma', 'Kamembe', 'Muganza', 'Mururu', 'Nkanka', 'Nkombo', 'Nyakabuye', 'Nyakarenzo', 'Rwimbogo']
  }
};

export const getProvinces = (): string[] => {
  return rwandaData.provinces;
};

export const getDistricts = (province: string): string[] => {
  const key = province.toLowerCase();
  return rwandaData.districts[key as keyof typeof rwandaData.districts] || [];
};

export const getSectors = (province: string, district: string): string[] => {
  const key = district.toLowerCase();
  return rwandaData.sectors[key as keyof typeof rwandaData.sectors] || [];
};

export const formatLocationDisplay = (customer: any): string => {
  const parts = [];
  if (customer.sector) parts.push(customer.sector);
  if (customer.district) parts.push(customer.district);
  if (customer.province) parts.push(customer.province);

  return parts.join(', ');
};