export class PatientsService {
  static async getModuleStatus(tenant) {
    return {
      module: 'patients',
      tenant,
      ready: true,
    };
  }
}
