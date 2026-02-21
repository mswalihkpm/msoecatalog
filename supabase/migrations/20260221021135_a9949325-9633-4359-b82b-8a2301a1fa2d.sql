-- Add a 3-digit secret code column to students table
ALTER TABLE public.students ADD COLUMN code text NOT NULL DEFAULT '000';
