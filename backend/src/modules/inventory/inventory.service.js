export class InventoryService {
  static async getModuleStatus(tenant) {
    return {
      module: 'inventory',
      tenant,
      ready: true,
    };
  }
}
