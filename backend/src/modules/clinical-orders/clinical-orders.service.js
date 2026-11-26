export class ClinicalOrdersService {
  static async getModuleStatus(tenant) {
    return {
      module: 'clinical-orders',
      tenant,
      ready: true,
    };
  }
}
