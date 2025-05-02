-- Documents are stored in users/{userId}/{fileName}_V{version}
insert into storage.buckets
  (id, name)
values
  ('documents', 'documents');

-- CREATE POLICY "Users can upload their own objects"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   (storage.foldername(name))[1] = 'users' AND
--   (storage.foldername(name))[2] = (SELECT auth.uid()::TEXT)
-- );

CREATE POLICY "Anyone can upload their own objects"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view all documents"
ON storage.objects
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can update all documents"
ON storage.objects
FOR UPDATE
TO public
USING (true);

CREATE POLICY "Users can delete their own objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = (SELECT auth.uid()::TEXT)
);
