/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  This software is the exclusive intellectual property of
 *  DivineDemonGaming Inc. Unauthorized copying, distribution,
 *  modification, or use of this software, in whole or in part,
 *  is strictly prohibited without written permission from
 *  DivineDemonGaming Inc.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 * ============================================================
 */
/**
 * Chat Room seeding utility
 * Creates World Chat + all major area codes + countries on first run
 */
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

// US Area codes with city/region names
const US_AREA_CODES = [
  { code: '212', city: 'New York City, NY' }, { code: '213', city: 'Los Angeles, CA' },
  { code: '214', city: 'Dallas, TX' }, { code: '215', city: 'Philadelphia, PA' },
  { code: '216', city: 'Cleveland, OH' }, { code: '217', city: 'Central Illinois' },
  { code: '219', city: 'Northwest Indiana' }, { code: '224', city: 'Northeast Illinois' },
  { code: '225', city: 'Baton Rouge, LA' }, { code: '228', city: 'Biloxi, MS' },
  { code: '229', city: 'Southwest Georgia' }, { code: '231', city: 'Northwest Michigan' },
  { code: '234', city: 'Northeast Ohio' }, { code: '239', city: 'Southwest Florida' },
  { code: '240', city: 'Suburban Maryland' }, { code: '248', city: 'Oakland County, MI' },
  { code: '251', city: 'Mobile, AL' }, { code: '252', city: 'Eastern North Carolina' },
  { code: '253', city: 'Tacoma, WA' }, { code: '256', city: 'Northern Alabama' },
  { code: '260', city: 'Fort Wayne, IN' }, { code: '262', city: 'Southeast Wisconsin' },
  { code: '267', city: 'Philadelphia, PA (2)' }, { code: '269', city: 'Southwest Michigan' },
  { code: '270', city: 'Western Kentucky' }, { code: '276', city: 'Southwest Virginia' },
  { code: '281', city: 'Houston, TX' }, { code: '301', city: 'Western Maryland' },
  { code: '302', city: 'Delaware' }, { code: '303', city: 'Denver, CO' },
  { code: '304', city: 'West Virginia' }, { code: '305', city: 'Miami, FL' },
  { code: '307', city: 'Wyoming' }, { code: '308', city: 'Western Nebraska' },
  { code: '309', city: 'Central Illinois' }, { code: '310', city: 'Los Angeles, CA (2)' },
  { code: '312', city: 'Chicago, IL' }, { code: '313', city: 'Detroit, MI' },
  { code: '314', city: 'St. Louis, MO' }, { code: '315', city: 'Syracuse, NY' },
  { code: '316', city: 'Wichita, KS' }, { code: '317', city: 'Indianapolis, IN' },
  { code: '318', city: 'Northern Louisiana' }, { code: '319', city: 'Eastern Iowa' },
  { code: '320', city: 'Central Minnesota' }, { code: '321', city: 'Central Florida' },
  { code: '323', city: 'Los Angeles, CA (3)' }, { code: '325', city: 'West Central Texas' },
  { code: '330', city: 'Northeast Ohio' }, { code: '331', city: 'Western DuPage County, IL' },
  { code: '334', city: 'Southern Alabama' }, { code: '336', city: 'Greensboro, NC' },
  { code: '337', city: 'Southwest Louisiana' }, { code: '339', city: 'Eastern Massachusetts' },
  { code: '347', city: 'New York City Boroughs' }, { code: '351', city: 'Northeast Massachusetts' },
  { code: '352', city: 'North Central Florida' }, { code: '360', city: 'Western Washington' },
  { code: '361', city: 'Corpus Christi, TX' }, { code: '386', city: 'North Central Florida (2)' },
  { code: '401', city: 'Rhode Island' }, { code: '402', city: 'Eastern Nebraska' },
  { code: '404', city: 'Atlanta, GA' }, { code: '405', city: 'Oklahoma City, OK' },
  { code: '406', city: 'Montana' }, { code: '407', city: 'Orlando, FL' },
  { code: '408', city: 'San Jose, CA' }, { code: '409', city: 'Southeast Texas' },
  { code: '410', city: 'Baltimore, MD' }, { code: '412', city: 'Pittsburgh, PA' },
  { code: '413', city: 'Western Massachusetts' }, { code: '414', city: 'Milwaukee, WI' },
  { code: '415', city: 'San Francisco, CA' }, { code: '417', city: 'Southwest Missouri' },
  { code: '419', city: 'Northwest Ohio' }, { code: '423', city: 'Eastern Tennessee' },
  { code: '424', city: 'Los Angeles, CA (4)' }, { code: '425', city: 'Bellevue, WA' },
  { code: '430', city: 'Northeast Texas' }, { code: '432', city: 'West Texas' },
  { code: '434', city: 'Central Virginia' }, { code: '435', city: 'Rural Utah' },
  { code: '440', city: 'Northeast Ohio (Suburbs)' }, { code: '442', city: 'Imperial County, CA' },
  { code: '443', city: 'Maryland' }, { code: '458', city: 'Western Oregon' },
  { code: '469', city: 'Dallas, TX (2)' }, { code: '470', city: 'Atlanta, GA (2)' },
  { code: '475', city: 'Connecticut' }, { code: '478', city: 'Central Georgia' },
  { code: '479', city: 'Northwest Arkansas' }, { code: '480', city: 'East Valley, AZ' },
  { code: '484', city: 'Southeast Pennsylvania' }, { code: '501', city: 'Central Arkansas' },
  { code: '502', city: 'Louisville, KY' }, { code: '503', city: 'Portland, OR' },
  { code: '504', city: 'New Orleans, LA' }, { code: '505', city: 'New Mexico' },
  { code: '507', city: 'Southern Minnesota' }, { code: '508', city: 'Southeast Massachusetts' },
  { code: '509', city: 'Eastern Washington' }, { code: '510', city: 'East Bay, CA' },
  { code: '512', city: 'Austin, TX' }, { code: '513', city: 'Cincinnati, OH' },
  { code: '515', city: 'Des Moines, IA' }, { code: '516', city: 'Nassau County, NY' },
  { code: '517', city: 'Lansing, MI' }, { code: '518', city: 'Albany, NY' },
  { code: '520', city: 'Tucson, AZ' }, { code: '530', city: 'Northern California' },
  { code: '540', city: 'Western Virginia' }, { code: '541', city: 'Oregon (outside Portland)' },
  { code: '551', city: 'Northeast New Jersey' }, { code: '559', city: 'Fresno, CA' },
  { code: '561', city: 'Palm Beach, FL' }, { code: '562', city: 'Long Beach, CA' },
  { code: '563', city: 'Eastern Iowa' }, { code: '567', city: 'Northwest Ohio' },
  { code: '570', city: 'Northeast Pennsylvania' }, { code: '571', city: 'Northern Virginia' },
  { code: '573', city: 'Southeast Missouri' }, { code: '574', city: 'Northern Indiana' },
  { code: '575', city: 'Southern New Mexico' }, { code: '580', city: 'Western Oklahoma' },
  { code: '585', city: 'Rochester, NY' }, { code: '586', city: 'Macomb County, MI' },
  { code: '601', city: 'Southern Mississippi' }, { code: '602', city: 'Phoenix, AZ' },
  { code: '603', city: 'New Hampshire' }, { code: '605', city: 'South Dakota' },
  { code: '606', city: 'Eastern Kentucky' }, { code: '607', city: 'Southern Tier, NY' },
  { code: '608', city: 'Madison, WI' }, { code: '609', city: 'Southern New Jersey' },
  { code: '610', city: 'Eastern Pennsylvania' }, { code: '612', city: 'Minneapolis, MN' },
  { code: '614', city: 'Columbus, OH' }, { code: '615', city: 'Nashville, TN' },
  { code: '616', city: 'Grand Rapids, MI' }, { code: '617', city: 'Boston, MA' },
  { code: '618', city: 'Southern Illinois' }, { code: '619', city: 'San Diego, CA' },
  { code: '620', city: 'Southwest Kansas' }, { code: '623', city: 'West Phoenix, AZ' },
  { code: '626', city: 'San Gabriel Valley, CA' }, { code: '628', city: 'San Francisco, CA (2)' },
  { code: '630', city: 'DuPage County, IL' }, { code: '631', city: 'Suffolk County, NY' },
  { code: '636', city: 'St. Louis Suburbs, MO' }, { code: '641', city: 'Central Iowa' },
  { code: '646', city: 'New York City (Manhattan)' }, { code: '650', city: 'San Mateo, CA' },
  { code: '651', city: 'Saint Paul, MN' }, { code: '657', city: 'Northern Orange County, CA' },
  { code: '660', city: 'North Central Missouri' }, { code: '661', city: 'Bakersfield, CA' },
  { code: '662', city: 'Northern Mississippi' }, { code: '667', city: 'Maryland' },
  { code: '669', city: 'San Jose, CA (2)' }, { code: '678', city: 'Atlanta, GA (3)' },
  { code: '680', city: 'Syracuse, NY (2)' }, { code: '681', city: 'West Virginia (2)' },
  { code: '682', city: 'Fort Worth, TX' }, { code: '701', city: 'North Dakota' },
  { code: '702', city: 'Las Vegas, NV' }, { code: '703', city: 'Northern Virginia' },
  { code: '704', city: 'Charlotte, NC' }, { code: '706', city: 'Northeast Georgia' },
  { code: '707', city: 'North Bay, CA' }, { code: '708', city: 'Chicago South Suburbs' },
  { code: '712', city: 'Western Iowa' }, { code: '713', city: 'Houston, TX (2)' },
  { code: '714', city: 'Orange County, CA' }, { code: '715', city: 'Northern Wisconsin' },
  { code: '716', city: 'Buffalo, NY' }, { code: '717', city: 'South Central Pennsylvania' },
  { code: '718', city: 'New York City Boroughs (2)' }, { code: '719', city: 'Southern Colorado' },
  { code: '720', city: 'Denver, CO (2)' }, { code: '724', city: 'Western Pennsylvania' },
  { code: '725', city: 'Las Vegas, NV (2)' }, { code: '727', city: 'Pinellas County, FL' },
  { code: '731', city: 'Western Tennessee' }, { code: '732', city: 'Central New Jersey' },
  { code: '734', city: 'Ann Arbor, MI' }, { code: '737', city: 'Austin, TX (2)' },
  { code: '740', city: 'Southeast Ohio' }, { code: '743', city: 'Greensboro, NC (2)' },
  { code: '747', city: 'San Fernando Valley, CA' }, { code: '754', city: 'Broward County, FL' },
  { code: '757', city: 'Hampton Roads, VA' }, { code: '760', city: 'San Diego County, CA' },
  { code: '762', city: 'Georgia (Augusta area)' }, { code: '763', city: 'Northwest Minneapolis' },
  { code: '765', city: 'Central Indiana' }, { code: '769', city: 'Mississippi (2)' },
  { code: '770', city: 'Metro Atlanta, GA' }, { code: '772', city: 'Treasure Coast, FL' },
  { code: '773', city: 'Chicago, IL' }, { code: '774', city: 'Cape Cod, MA' },
  { code: '775', city: 'Reno, NV' }, { code: '779', city: 'Northern Illinois' },
  { code: '781', city: 'Eastern Massachusetts' }, { code: '785', city: 'Kansas (outside Wichita)' },
  { code: '786', city: 'Miami-Dade, FL' }, { code: '801', city: 'Salt Lake City, UT' },
  { code: '802', city: 'Vermont' }, { code: '803', city: 'Central South Carolina' },
  { code: '804', city: 'Richmond, VA' }, { code: '805', city: 'Central Coast, CA' },
  { code: '806', city: 'Panhandle Texas' }, { code: '808', city: 'Hawaii' },
  { code: '810', city: 'Flint, MI' }, { code: '812', city: 'Southern Indiana' },
  { code: '813', city: 'Tampa, FL' }, { code: '814', city: 'Central Pennsylvania' },
  { code: '815', city: 'Northern Illinois' }, { code: '816', city: 'Kansas City, MO' },
  { code: '817', city: 'Fort Worth, TX (2)' }, { code: '818', city: 'San Fernando Valley, CA (2)' },
  { code: '828', city: 'Western North Carolina' }, { code: '830', city: 'Southwest Texas' },
  { code: '831', city: 'Monterey Bay, CA' }, { code: '832', city: 'Houston, TX (3)' },
  { code: '843', city: 'Coastal South Carolina' }, { code: '845', city: 'Hudson Valley, NY' },
  { code: '847', city: 'North Suburban Chicago' }, { code: '848', city: 'Central New Jersey (2)' },
  { code: '850', city: 'Northwest Florida' }, { code: '856', city: 'Southwest New Jersey' },
  { code: '857', city: 'Boston, MA (2)' }, { code: '858', city: 'Northern San Diego, CA' },
  { code: '859', city: 'Lexington, KY' }, { code: '860', city: 'Connecticut' },
  { code: '862', city: 'Newark, NJ' }, { code: '863', city: 'Central Florida' },
  { code: '864', city: 'Upstate South Carolina' }, { code: '865', city: 'Knoxville, TN' },
  { code: '870', city: 'Eastern Arkansas' }, { code: '878', city: 'Pittsburgh, PA (2)' },
  { code: '901', city: 'Memphis, TN' }, { code: '903', city: 'Northeast Texas' },
  { code: '904', city: 'Jacksonville, FL' }, { code: '907', city: 'Alaska' },
  { code: '908', city: 'Central New Jersey' }, { code: '909', city: 'Inland Empire, CA' },
  { code: '910', city: 'Southeastern North Carolina' }, { code: '912', city: 'Coastal Georgia' },
  { code: '913', city: 'Kansas City, KS' }, { code: '914', city: 'Westchester County, NY' },
  { code: '915', city: 'El Paso, TX' }, { code: '916', city: 'Sacramento, CA' },
  { code: '917', city: 'New York City (all boroughs)' }, { code: '918', city: 'Northeast Oklahoma' },
  { code: '919', city: 'Raleigh, NC' }, { code: '920', city: 'Northeast Wisconsin' },
  { code: '925', city: 'East Bay Suburbs, CA' }, { code: '928', city: 'Western Arizona' },
  { code: '929', city: 'New York City Boroughs (3)' }, { code: '930', city: 'Southern Indiana (2)' },
  { code: '931', city: 'Central Tennessee' }, { code: '936', city: 'Eastern Texas' },
  { code: '937', city: 'Dayton, OH' }, { code: '940', city: 'North Texas' },
  { code: '941', city: 'Southwest Florida' }, { code: '947', city: 'Southeast Michigan' },
  { code: '949', city: 'Orange County, CA (2)' }, { code: '951', city: 'Riverside, CA' },
  { code: '952', city: 'Southwest Minneapolis' }, { code: '954', city: 'Broward County, FL (2)' },
  { code: '956', city: 'Laredo, TX' }, { code: '959', city: 'Connecticut (2)' },
  { code: '970', city: 'Western Colorado' }, { code: '971', city: 'Portland, OR (2)' },
  { code: '972', city: 'Dallas, TX (3)' }, { code: '973', city: 'Northern New Jersey' },
  { code: '978', city: 'Northeast Massachusetts' }, { code: '979', city: 'Brazos Valley, TX' },
  { code: '980', city: 'Charlotte, NC (2)' }, { code: '984', city: 'Raleigh, NC (2)' },
  { code: '985', city: 'Southeast Louisiana' }, { code: '989', city: 'Central Michigan' },
];

// International country chats
const WORLD_REGIONS = [
  { code: 'CA', name: 'Canada', flag: '🇨🇦', lang: 'en' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', lang: 'en' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', lang: 'en' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', lang: 'de' },
  { code: 'FR', name: 'France', flag: '🇫🇷', lang: 'fr' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', lang: 'es' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', lang: 'es' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', lang: 'pt' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', lang: 'ja' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', lang: 'ko' },
  { code: 'CN', name: 'China', flag: '🇨🇳', lang: 'zh' },
  { code: 'IN', name: 'India', flag: '🇮🇳', lang: 'hi' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', lang: 'ru' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', lang: 'it' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', lang: 'nl' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', lang: 'sv' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', lang: 'no' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', lang: 'fi' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', lang: 'pl' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', lang: 'tr' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', lang: 'ar' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', lang: 'ar' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', lang: 'en' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', lang: 'en' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', lang: 'ar' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', lang: 'en' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', lang: 'id' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', lang: 'th' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', lang: 'vi' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', lang: 'es' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', lang: 'es' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', lang: 'es' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', lang: 'pt' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', lang: 'el' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', lang: 'uk' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', lang: 'en' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', lang: 'en' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', lang: 'ms' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', lang: 'ur' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', lang: 'bn' },
];

const seedChatRooms = async () => {
  let created = 0;

  // World Chat
  await prisma.chatRoom.upsert({
    where: { slug: 'world' },
    update: {},
    create: {
      type: 'WORLD',
      name: '🌍 World Chat',
      description: 'The global VENTURE community — everyone welcome. Keep it clean and friendly!',
      slug: 'world',
      regionCode: 'WORLD',
      regionName: 'Global',
      flagEmoji: '🌍',
      language: 'en',
      slowMode: 2,
    }
  });
  created++;

  // Country chats
  for (const region of WORLD_REGIONS) {
    await prisma.chatRoom.upsert({
      where: { slug: `country-${region.code.toLowerCase()}` },
      update: {},
      create: {
        type: 'COUNTRY',
        name: `${region.flag} ${region.name}`,
        description: `VENTURE community for ${region.name}`,
        slug: `country-${region.code.toLowerCase()}`,
        regionCode: region.code,
        regionName: region.name,
        countryCode: region.code,
        flagEmoji: region.flag,
        language: region.lang,
        slowMode: 2,
      }
    });
    created++;
  }

  // US Area code chats
  for (const ac of US_AREA_CODES) {
    await prisma.chatRoom.upsert({
      where: { slug: `us-${ac.code}` },
      update: {},
      create: {
        type: 'AREA_CODE',
        name: `🇺🇸 ${ac.code} — ${ac.city}`,
        description: `Local VENTURE chat for the ${ac.code} area (${ac.city})`,
        slug: `us-${ac.code}`,
        regionCode: ac.code,
        regionName: ac.city,
        countryCode: 'US',
        flagEmoji: '🇺🇸',
        language: 'en',
        slowMode: 1,
      }
    });
    created++;
  }

  logger.info(`✅ Chat rooms seeded: ${created} rooms (1 world + ${WORLD_REGIONS.length} countries + ${US_AREA_CODES.length} US area codes)`);
  return created;
};

module.exports = { seedChatRooms, US_AREA_CODES, WORLD_REGIONS };
