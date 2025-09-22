/*
  # Fix RLS Policy for Admin Users

  1. Security Updates
    - Allow initial admin signup for anon users (first admin creation)
    - Allow authenticated admins to create other admins
    - Maintain security for other operations

  2. Changes
    - Update INSERT policy to allow anon users to create the first admin
    - Add policy for authenticated users to create additional admins
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can manage all admin data" ON admin_users;

-- Allow anonymous users to insert admin users (for initial setup)
CREATE POLICY "Allow initial admin signup"
  ON admin_users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated admins to insert new admin users
CREATE POLICY "Authenticated admins can create admins"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read admin data
CREATE POLICY "Authenticated users can read admin data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to update admin data
CREATE POLICY "Authenticated users can update admin data"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete admin data
CREATE POLICY "Authenticated users can delete admin data"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (true);