import cron from 'node-cron';

export function startReminderCron() {
  // Runs daily at 08:00 AM Asia/Manila time (implemented in Phase 5)
  cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('[Cron] Daily 24-hour PEP appointment reminder check triggered.');
    },
    { timezone: 'Asia/Manila' }
  );
}
