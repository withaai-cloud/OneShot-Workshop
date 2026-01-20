import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ioybgskyexwpnniajkfj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveWJnc2t5ZXh3cG5uaWFqa2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDAwOTEsImV4cCI6MjA4NDUxNjA5MX0.01JJT0Y20r-tS33kXxaleQt9Gqooicup0OnES6aDnd4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
