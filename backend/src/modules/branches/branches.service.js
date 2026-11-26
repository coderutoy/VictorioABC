import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../middleware/error.middleware.js';

export class BranchesService {
  static async getModuleStatus(tenant) {
    return {
      module: 'branches',
      tenant,
      ready: true,
    };
  }

  static async listBranches(user) {
    let query = supabaseAdmin
      .from('branches')
      .select('id, name, address, barangay, municipality, latitude, longitude, contact_number, operating_hours, status, created_at')
      .order('name', { ascending: true });

    if (user?.role !== 'admin') {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;
    if (error) {
      throw new AppError(`Failed to fetch branches: ${error.message}`, 500);
    }
    return data || [];
  }
}
