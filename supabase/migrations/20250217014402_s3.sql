-- Disable default public access
CREATE POLICY "No public access"
ON storage.objects
FOR ALL USING (false);

-- Allow server-side operations through service role
CREATE POLICY "Allow service role operations"
ON storage.objects
FOR ALL
TO service_role
USING (true);
