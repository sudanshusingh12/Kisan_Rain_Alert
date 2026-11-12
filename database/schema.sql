-- ============================================================================
-- KISAN RAIN ALERT - SUPABASE POSTGRESQL SCHEMA
-- Location-Specific Rainfall Monitoring & Early Warning System for Indian Farmers
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE NOT NULL,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.profiles DROP COLUMN IF EXISTS state;

-- ----------------------------------------------------------------------------
-- 2. FARMS TABLE (Multi-farm support per farmer, satellite pinned coordinates)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    village TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    crop_type TEXT,
    farm_size_acres NUMERIC(6,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.farms DROP COLUMN IF EXISTS state;
ALTER TABLE public.farms DROP COLUMN IF EXISTS district;

-- Index for fast user-specific farm lookup
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farms_coordinates ON public.farms(latitude, longitude);

-- ----------------------------------------------------------------------------
-- 3. WEATHER OBSERVATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weather_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    source TEXT NOT NULL DEFAULT 'Open-Meteo & RainViewer',
    observation_type TEXT NOT NULL, -- 'observed_radar', 'model_precipitation', 'forecast'
    temperature NUMERIC(5,2),       -- Degree Celsius
    humidity NUMERIC(5,2),          -- Percentage
    precipitation NUMERIC(6,2),    -- mm/hr
    precipitation_probability INTEGER, -- Percentage 0-100
    weather_code INTEGER,           -- WMO weather interpretation code
    wind_speed NUMERIC(5,2),        -- km/h
    wind_direction INTEGER,         -- Degrees (0-360)
    radar_reflectivity_dbz NUMERIC(5,2), -- Observed radar echo in dBZ if available
    observation_timestamp TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    raw_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_weather_observations_farm_time ON public.weather_observations(farm_id, observation_timestamp DESC);

-- ----------------------------------------------------------------------------
-- 4. RAIN ALERTS TABLE (Deterministic alert history & deduplication)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rain_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,       -- 'detected', 'approaching', 'forecast_warning'
    rainfall_category TEXT NOT NULL, -- 'No Rain', 'Light Rain', 'Moderate Rain', 'Heavy Rain', 'Very Heavy Rain'
    precipitation_rate NUMERIC(6,2), -- mm/hr
    alert_message TEXT NOT NULL,
    alert_reason TEXT NOT NULL,
    confidence_or_data_quality TEXT DEFAULT 'High',
    event_identifier TEXT NOT NULL, -- Hash or event key used to prevent duplicate alerts
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_rain_alerts_farm_created ON public.rain_alerts(farm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rain_alerts_user_created ON public.rain_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rain_alerts_event ON public.rain_alerts(event_identifier);

-- ----------------------------------------------------------------------------
-- 5. NOTIFICATION LOGS TABLE (Twilio SMS and Gmail SMTP audit trails)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES public.rain_alerts(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,          -- 'sms' or 'email'
    recipient TEXT NOT NULL,        -- Phone number or Email address
    delivery_status TEXT NOT NULL,  -- 'queued', 'sent', 'delivered', 'failed', 'simulated'
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user ON public.notification_logs(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_alert ON public.notification_logs(alert_id);

-- ----------------------------------------------------------------------------
-- 6. NOTIFICATION PREFERENCES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    min_rainfall_intensity TEXT DEFAULT 'Light Rain', -- 'Light Rain', 'Moderate Rain', 'Heavy Rain'
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '06:00',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rain_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 2. Farms Policies
DROP POLICY IF EXISTS "Farmers can view own farms" ON public.farms;
CREATE POLICY "Farmers can view own farms" 
    ON public.farms FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farmers can insert own farms" ON public.farms;
CREATE POLICY "Farmers can insert own farms" 
    ON public.farms FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farmers can update own farms" ON public.farms;
CREATE POLICY "Farmers can update own farms" 
    ON public.farms FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farmers can delete own farms" ON public.farms;
CREATE POLICY "Farmers can delete own farms" 
    ON public.farms FOR DELETE 
    USING (auth.uid() = user_id);

-- 3. Weather Observations Policies
DROP POLICY IF EXISTS "Farmers can view weather for their farms" ON public.weather_observations;
CREATE POLICY "Farmers can view weather for their farms" 
    ON public.weather_observations FOR SELECT 
    USING (
        farm_id IN (
            SELECT id FROM public.farms WHERE user_id = auth.uid()
        )
    );

-- 4. Rain Alerts Policies
DROP POLICY IF EXISTS "Farmers can view their rain alerts" ON public.rain_alerts;
CREATE POLICY "Farmers can view their rain alerts" 
    ON public.rain_alerts FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farmers can acknowledge their rain alerts" ON public.rain_alerts;
CREATE POLICY "Farmers can acknowledge their rain alerts" 
    ON public.rain_alerts FOR UPDATE 
    USING (auth.uid() = user_id);

-- 5. Notification Logs Policies
DROP POLICY IF EXISTS "Farmers can view own notification logs" ON public.notification_logs;
CREATE POLICY "Farmers can view own notification logs" 
    ON public.notification_logs FOR SELECT 
    USING (auth.uid() = user_id);

-- 6. Notification Preferences Policies
DROP POLICY IF EXISTS "Farmers can view own preferences" ON public.notification_preferences;
CREATE POLICY "Farmers can view own preferences" 
    ON public.notification_preferences FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farmers can update own preferences" ON public.notification_preferences;
CREATE POLICY "Farmers can update own preferences" 
    ON public.notification_preferences FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Farmers can insert own preferences" ON public.notification_preferences;
CREATE POLICY "Farmers can insert own preferences" 
    ON public.notification_preferences FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- AUTOMATIC PROFILE & PREFERENCES INITIALIZATION TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, email)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Kisan Farmer'),
        new.raw_user_meta_data->>'phone',
        new.email
    );

    INSERT INTO public.notification_preferences (user_id, sms_enabled, email_enabled)
    VALUES (new.id, TRUE, TRUE);

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

