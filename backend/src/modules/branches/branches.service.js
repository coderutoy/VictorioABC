export class BranchesService {
  static async getModuleStatus(tenant) {
    return {
      module: 'branches',
      tenant,
      ready: true,
    };
  }
}
