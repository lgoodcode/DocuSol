-- Documents are stored in users/{userId}/{fileName}_V{version}

CREATE POLICY "Users can upload their own objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = (SELECT auth.uid()::TEXT)
);

CREATE POLICY "Users can view their own objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = (SELECT auth.uid()::TEXT)
);

CREATE POLICY "Users can update their own objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = (SELECT auth.uid()::TEXT)
);

CREATE POLICY "Users can delete their own objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = (SELECT auth.uid()::TEXT)
);
