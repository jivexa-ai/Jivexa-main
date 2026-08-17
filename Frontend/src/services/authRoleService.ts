import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { UserRole } from '../context/AuthContext';

export interface RoleCheckResult {
  isRegistered: boolean;
  actualRole?: UserRole;
  error?: string;
}

/**
 * Pre-Auth Role Registration Checker
 * Verifies whether a given email address belongs to a registered account with the specified role.
 */
export const checkUserRoleRegistration = async (
  email: string,
  requiredRole: UserRole
): Promise<RoleCheckResult> => {
  const sanitizedEmail = email.toLowerCase().trim();

  if (!sanitizedEmail) {
    return { isRegistered: false, error: 'Please enter a valid email address.' };
  }

  // 1. Supabase Database Query
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('email', sanitizedEmail)
        .maybeSingle();

      if (error) {
        console.warn('[Supabase Role Check] Warning:', error.message);
      }

      if (data && data.role) {
        return {
          isRegistered: data.role === requiredRole,
          actualRole: data.role as UserRole
        };
      }
    } catch (err: any) {
      console.warn('[Supabase Role Check] Exception:', err);
    }
  }

  // 2. Check Local Storage Cache
  const registeredUsersJSON = localStorage.getItem('jivexa_registered_users');
  if (registeredUsersJSON) {
    try {
      const usersList: Array<{ email: string; role: UserRole }> = JSON.parse(registeredUsersJSON);
      const match = usersList.find((u) => u.email.toLowerCase().trim() === sanitizedEmail);

      if (match) {
        return {
          isRegistered: match.role === requiredRole,
          actualRole: match.role
        };
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }

  // If no database or local cache record is found, allow account registration / first-time login
  return { isRegistered: true };
};
