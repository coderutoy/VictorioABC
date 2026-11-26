import dotenv from 'dotenv';
import app from './app.js';
import { startReminderCron } from './jobs/reminder.cron.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Victorio ABC API running on http://localhost:${PORT}`);
    startReminderCron();
  });
}

export default app;
