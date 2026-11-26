export class AnalyticsService {
  static async getModuleStatus(tenant) {
    return {
      module: 'analytics',
      tenant,
      ready: true,
    };
  }
}
