export class TriageService {
  static async getModuleStatus(tenant) {
    return {
      module: 'triage',
      tenant,
      ready: true,
    };
  }
}
