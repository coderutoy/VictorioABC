import { supabaseAdmin } from '../../config/supabase.js';
import { AppError } from '../../middleware/error.middleware.js';
import { ROLES } from '../../middleware/rbac.middleware.js';

export class InventoryService {
  static async getModuleStatus(tenant) {
    return {
      module: 'inventory',
      tenant,
      ready: true,
    };
  }

  /**
   * Lists vaccine inventory batches for the active branch (ordered by FEFO expiration_date ASC).
   */
  static async listInventory({ user, tenant, query = {} }) {
    let dbQuery = supabaseAdmin
      .from('vaccine_inventory')
      .select(
        `
        *,
        branch:branches!vaccine_inventory_branch_id_fkey(id, name, barangay)
      `
      )
      .order('expiration_date', { ascending: true });

    const branchId =
      user.role === ROLES.ADMIN
        ? query.branch_id || tenant?.branchId || null
        : user.branch_id || tenant?.branchId;

    if (branchId) {
      dbQuery = dbQuery.eq('branch_id', branchId);
    }

    if (query.item_type) {
      dbQuery = dbQuery.eq('item_type', query.item_type);
    }

    if (query.available_only === 'true') {
      const todayStr = new Date().toISOString().slice(0, 10);
      dbQuery = dbQuery.gt('quantity_remaining', 0).gte('expiration_date', todayStr);
    }

    const { data, error } = await dbQuery;
    if (error) {
      throw new AppError(`Failed to fetch vaccine inventory: ${error.message}`, 500);
    }

    return data || [];
  }
}
