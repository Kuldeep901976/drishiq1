-- Add missing profile fields to users table
ALTER TABLE public.users 
ADD COLUMN first_name text null,
ADD COLUMN last_name text null,
ADD COLUMN city text null,
ADD COLUMN country text null,
ADD COLUMN occupation text null,
ADD COLUMN date_of_birth date null;

-- Update existing users to split full_name into first_name and last_name
UPDATE public.users 
SET 
  first_name = split_part(full_name, ' ', 1),
  last_name = CASE 
    WHEN array_length(string_to_array(full_name, ' '), 1) > 1 
    THEN array_to_string(string_to_array(full_name, ' ')[2:], ' ')
    ELSE ''
  END
WHERE full_name IS NOT NULL AND first_name IS NULL; 