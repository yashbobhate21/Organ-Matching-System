import { supabase } from '../lib/supabase';
import type { Admin } from '../types';

export class AuthService {
  static async signUp(email: string, password: string, fullName: string): Promise<Admin> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin'
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create user');

    // Insert user profile into admin_users table
    const { data: adminUser, error: profileError } = await supabase
      .from('admin_users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        password_hash: 'managed_by_supabase_auth',
        full_name: fullName,
        role: 'admin'
      })
      .select()
      .maybeSingle();

    if (profileError) throw profileError;
    if (!adminUser) throw new Error('Failed to create admin user profile');

    return adminUser;
  }

  static async signIn(email: string, password: string): Promise<Admin> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Invalid credentials');

    // Fetch user profile from admin_users table
    const { data: adminUser, error: profileError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    
    // If admin profile doesn't exist, create it
    if (!adminUser) {
      const { data: newAdminUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          password_hash: 'managed_by_supabase_auth',
          full_name: data.user.user_metadata?.full_name || data.user.email!.split('@')[0],
          role: 'admin'
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;
      if (!newAdminUser) throw new Error('Failed to create admin user profile');
      
      return newAdminUser;
    }
    return adminUser;
  }

  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<Admin | null> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;

    // Fetch user profile from admin_users table
    const { data: adminUser, error: profileError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) return null;

    return adminUser;
  }
}

export const authService = new AuthService();