// src/shared/constants/categories.js
export const CATEGORY_SLUGS = Object.freeze({
  GLASSES_DRINKWARE:    'glasses-drinkware',
  CUPS_MUGS:            'cups-mugs',
  WINE_GLASSES:         'wine-glasses',
  PLATES_BOWLS:         'plates-bowls',
  CUTLERY_UTENSILS:     'cutlery-utensils',
  COOKWARE_APPLIANCES:  'cookware-appliances',
  BEDDING:              'bedding',
  PILLOWS_TOWELS:       'pillows-towels',
  HOME_DECOR:           'home-decor',
  BATHROOM_ACCESSORIES: 'bathroom-accessories',
  CLEANING_SUPPLIES:    'cleaning-supplies',
});

export const DEFAULT_CATEGORIES = [
  { name: 'Glasses & Drinkware',    slug: 'glasses-drinkware',    icon: '🥃', sortOrder: 1 },
  { name: 'Cups & Mugs',            slug: 'cups-mugs',            icon: '☕', sortOrder: 2 },
  { name: 'Wine Glasses',           slug: 'wine-glasses',         icon: '🍷', sortOrder: 3 },
  { name: 'Plates & Bowls',         slug: 'plates-bowls',         icon: '🍽️', sortOrder: 4 },
  { name: 'Cutlery & Utensils',     slug: 'cutlery-utensils',     icon: '🍴', sortOrder: 5 },
  { name: 'Cookware & Appliances',  slug: 'cookware-appliances',  icon: '🍳', sortOrder: 6 },
  { name: 'Bedding',                slug: 'bedding',              icon: '🛏️', sortOrder: 7 },
  { name: 'Pillows & Towels',       slug: 'pillows-towels',       icon: '🛁', sortOrder: 8 },
  { name: 'Home Décor',             slug: 'home-decor',           icon: '🏠', sortOrder: 9 },
  { name: 'Bathroom Accessories',   slug: 'bathroom-accessories', icon: '🚿', sortOrder: 10 },
  { name: 'Cleaning Supplies',      slug: 'cleaning-supplies',    icon: '🧹', sortOrder: 11 },
];