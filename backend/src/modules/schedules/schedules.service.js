export class SchedulesService {
  static async getModuleStatus(tenant) {
    return {
      module: 'schedules',
      tenant,
      ready: true,
    };
  }
}
