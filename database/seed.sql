-- ============================================================================
-- KISAN RAIN ALERT - SEED DATA SCRIPT
-- Sample Indian Farms, Observations, and Alerts for Testing and Demonstration
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    demo_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
    farm_punjab_id UUID := 'b0000000-0000-0000-0000-000000000001';
    farm_maharashtra_id UUID := 'b0000000-0000-0000-0000-000000000002';
    farm_karnataka_id UUID := 'b0000000-0000-0000-0000-000000000003';
BEGIN
    -- 1. Create matching demo user in auth.users so foreign keys succeed
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        demo_user_id,
        'authenticated',
        'authenticated',
        'farmer.rajesh@kisanrain.org',
        crypt('demo1234', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Rajesh Kumar Patel","phone":"+919876543210"}',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Upsert profile in public.profiles
    INSERT INTO public.profiles (id, full_name, phone, email, preferred_language)
    VALUES (demo_user_id, 'Rajesh Kumar Patel', '+919876543210', 'farmer.rajesh@kisanrain.org', 'en')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;

    -- 3. Upsert default notification preferences
    INSERT INTO public.notification_preferences (user_id, sms_enabled, email_enabled, min_rainfall_intensity)
    VALUES (demo_user_id, TRUE, TRUE, 'Light Rain')
    ON CONFLICT (user_id) DO NOTHING;

    -- 4. Farm 1: Punjab (Samrala) - Wheat & Rice
    INSERT INTO public.farms (id, user_id, farm_name, village, latitude, longitude, crop_type, farm_size_acres)
    VALUES (farm_punjab_id, demo_user_id, 'Green Gold Farm', 'Samrala, Punjab', 30.9010, 75.8573, 'Wheat / Rice', 12.5)
    ON CONFLICT (id) DO NOTHING;

    -- 5. Farm 2: Maharashtra (Dindori) - Grape & Onion
    INSERT INTO public.farms (id, user_id, farm_name, village, latitude, longitude, crop_type, farm_size_acres)
    VALUES (farm_maharashtra_id, demo_user_id, 'Sahyadri Vineyard', 'Dindori, Nashik', 20.0059, 73.7898, 'Table Grapes / Onions', 8.0)
    ON CONFLICT (id) DO NOTHING;

    -- 6. Farm 3: Karnataka (Pandavapura) - Sugarcane
    INSERT INTO public.farms (id, user_id, farm_name, village, latitude, longitude, crop_type, farm_size_acres)
    VALUES (farm_karnataka_id, demo_user_id, 'Kaveri Basin Acres', 'Pandavapura, Mandya', 12.5242, 76.8958, 'Sugarcane', 15.0)
    ON CONFLICT (id) DO NOTHING;

    -- 7. Sample weather observation for Farm 1
    INSERT INTO public.weather_observations (
        farm_id, source, observation_type, temperature, humidity, precipitation, precipitation_probability, weather_code, wind_speed, wind_direction, observation_timestamp
    ) VALUES (
        farm_punjab_id, 'Open-Meteo High-Res', 'model_precipitation', 28.5, 78.0, 4.2, 85, 63, 14.2, 180, TIMEZONE('utc', NOW())
    );

    -- 8. Sample rain alert for Farm 1
    INSERT INTO public.rain_alerts (
        farm_id, user_id, alert_type, rainfall_category, precipitation_rate, alert_message, alert_reason, confidence_or_data_quality, event_identifier
    ) VALUES (
        farm_punjab_id, demo_user_id, 'detected', 'Moderate Rain', 4.2, 
        'Kisan Rain Alert: Moderate rainfall (4.2 mm/h) detected over Green Gold Farm, Samrala, Punjab.',
        'Observed precipitation rate (4.2 mm/hr) exceeds moderate rainfall threshold (2.5 mm/hr). Wind velocity: 14.2 km/h SSE.',
        'High (NWP + Multi-station agreement)',
        'alert-punjab-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24')
    );

END $$;

