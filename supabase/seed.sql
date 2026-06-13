-- SkyPulse seed data: 3 demo businesses in Tel Aviv

-- 1. Dizengoff Health Pharmacy
insert into businesses (id, name, business_type, address, lat, lng, timezone, opening_hours_json)
values (
  'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
  'Dizengoff Health Pharmacy',
  'pharmacy',
  'Dizengoff Center, 50 Dizengoff St, Tel Aviv',
  32.0775, 34.7748,
  'Asia/Jerusalem',
  '{
    "sunday":    {"open": "08:00", "close": "22:00"},
    "monday":    {"open": "08:00", "close": "22:00"},
    "tuesday":   {"open": "08:00", "close": "22:00"},
    "wednesday": {"open": "08:00", "close": "22:00"},
    "thursday":  {"open": "08:00", "close": "22:00"},
    "friday":    {"open": "08:00", "close": "15:00"},
    "saturday":  null
  }'::jsonb
);

-- 2. Central Station Mini-Market
insert into businesses (id, name, business_type, address, lat, lng, timezone, opening_hours_json)
values (
  'a2b3c4d5-f6e7-8901-bcde-f12345678901',
  'Central Station Mini-Market',
  'convenience_store',
  'Arlozorov Terminal, 64 Arlozorov St, Tel Aviv',
  32.0873, 34.7818,
  'Asia/Jerusalem',
  '{
    "sunday":    {"open": "06:00", "close": "23:00"},
    "monday":    {"open": "06:00", "close": "23:00"},
    "tuesday":   {"open": "06:00", "close": "23:00"},
    "wednesday": {"open": "06:00", "close": "23:00"},
    "thursday":  {"open": "06:00", "close": "23:00"},
    "friday":    {"open": "06:00", "close": "16:00"},
    "saturday":  {"open": "20:00", "close": "23:00"}
  }'::jsonb
);

-- 3. Bograshov Beach Cafe
insert into businesses (id, name, business_type, address, lat, lng, timezone, opening_hours_json)
values (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Bograshov Beach Cafe',
  'cafe',
  'Bograshov Beach, Tel Aviv',
  32.0789, 34.7683,
  'Asia/Jerusalem',
  '{
    "sunday":    {"open": "07:00", "close": "23:00"},
    "monday":    {"open": "07:00", "close": "23:00"},
    "tuesday":   {"open": "07:00", "close": "23:00"},
    "wednesday": {"open": "07:00", "close": "23:00"},
    "thursday":  {"open": "07:00", "close": "00:00"},
    "friday":    {"open": "07:00", "close": "16:00"},
    "saturday":  {"open": "20:00", "close": "00:00"}
  }'::jsonb
);

-- ── Business categories ───────────────────────────────────────────────

-- Pharmacy categories
insert into business_categories (business_id, category_name, margin_level, weather_sensitivity, event_sensitivity, air_quality_sensitivity) values
  ('b1a2c3d4-e5f6-7890-abcd-ef1234567890', 'OTC Medications',     'high',   'high',   'low',    'high'),
  ('b1a2c3d4-e5f6-7890-abcd-ef1234567890', 'Sunscreen & Skincare','high',   'high',   'medium', 'medium'),
  ('b1a2c3d4-e5f6-7890-abcd-ef1234567890', 'Allergy Relief',      'high',   'medium', 'low',    'high'),
  ('b1a2c3d4-e5f6-7890-abcd-ef1234567890', 'Hydration & Electrolytes', 'medium', 'high', 'high', 'low'),
  ('b1a2c3d4-e5f6-7890-abcd-ef1234567890', 'First Aid',           'medium', 'low',    'high',   'low'),
  ('b1a2c3d4-e5f6-7890-abcd-ef1234567890', 'Personal Care',       'medium', 'low',    'low',    'low');

-- Mini-Market categories
insert into business_categories (business_id, category_name, margin_level, weather_sensitivity, event_sensitivity, air_quality_sensitivity) values
  ('a2b3c4d5-f6e7-8901-bcde-f12345678901', 'Cold Beverages',      'medium', 'high',   'high',   'low'),
  ('a2b3c4d5-f6e7-8901-bcde-f12345678901', 'Snacks & Chips',      'medium', 'low',    'high',   'low'),
  ('a2b3c4d5-f6e7-8901-bcde-f12345678901', 'Ready Meals',         'low',    'medium', 'medium', 'low'),
  ('a2b3c4d5-f6e7-8901-bcde-f12345678901', 'Ice Cream & Frozen',  'high',   'high',   'medium', 'low'),
  ('a2b3c4d5-f6e7-8901-bcde-f12345678901', 'Tobacco & Accessories','high',  'low',    'low',    'low'),
  ('a2b3c4d5-f6e7-8901-bcde-f12345678901', 'Travel Essentials',   'high',   'low',    'low',    'low');

-- Beach Cafe categories
insert into business_categories (business_id, category_name, margin_level, weather_sensitivity, event_sensitivity, air_quality_sensitivity) values
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Iced Coffee & Drinks','high',   'high',   'high',   'medium'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Fresh Juices',        'medium', 'high',   'medium', 'medium'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Breakfast & Brunch',  'medium', 'medium', 'low',    'low'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Light Meals & Salads','medium', 'medium', 'medium', 'low'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Alcohol & Cocktails', 'high',   'high',   'high',   'low'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Desserts & Ice Cream','high',   'high',   'medium', 'low');
