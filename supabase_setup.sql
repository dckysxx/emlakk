-- EMLAK APP SUPABASE SETUP
-- You can run this entire script in your Supabase SQL Editor.

-- 1. Create Properties Table
CREATE TABLE public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title VARCHAR NOT NULL,
    type VARCHAR NOT NULL, -- Satılık / Kiralık
    price NUMERIC NOT NULL,
    price_text VARCHAR,
    location VARCHAR NOT NULL,
    mahalle VARCHAR NOT NULL,
    rooms VARCHAR NOT NULL,
    area VARCHAR NOT NULL,
    image TEXT, -- Main Cover Image
    description TEXT,
    images JSONB, -- Array of extra images
    corporate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Only corporate accounts can own properties
);

-- 2. Create User Requests Table
CREATE TABLE public.requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR,
    phone VARCHAR,
    user_email VARCHAR,
    type VARCHAR,
    mahalle VARCHAR,
    min_price NUMERIC,
    max_price NUMERIC,
    rooms VARCHAR
);

-- 3. Row Level Security (RLS) Configuration

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Properties Policies
-- Anyone can read properties (Public)
CREATE POLICY "Allow public read access on properties" 
ON public.properties FOR SELECT 
USING (true);

-- Authenticated corporate users can insert properties
CREATE POLICY "Allow authenticated users to insert properties" 
ON public.properties FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Users can only delete their own properties
CREATE POLICY "Allow users to delete own properties"
ON public.properties FOR DELETE
TO authenticated
USING (auth.uid() = corporate_id);

-- Users can only update their own properties
CREATE POLICY "Allow users to update own properties"
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = corporate_id)
WITH CHECK (auth.uid() = corporate_id);

-- Request Policies
-- Authenticated individual users can read their own requests
CREATE POLICY "Users can view own requests"
ON public.requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated individual users can insert requests
CREATE POLICY "Users can insert requests"
ON public.requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own requests
CREATE POLICY "Users can delete own requests"
ON public.requests FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Create Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('properties_images', 'properties_images', true);
-- Allow public access to bucket images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'properties_images' );
-- Allow authenticated uploads
CREATE POLICY "Authenticated Uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'properties_images' );
