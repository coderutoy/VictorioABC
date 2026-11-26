export class AuditService {
  static async getModuleStatus(tenant) {
    return {
      module: 'audit',
      tenant,
      ready: true,
    };
  }
}
