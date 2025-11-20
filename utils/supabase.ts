import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zrgvdgzwsiqoahzbkihm.supabase.co';
const supabasePublishableKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZ3ZkZ3p3c2lxb2FoemJraWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDM0NjcsImV4cCI6MjA3OTE3OTQ2N30.Qo5mq3owIhm2svEh5OAYCGElzg97_B5aJ2qn_N8LZ5s';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

