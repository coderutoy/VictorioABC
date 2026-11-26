export const notificationConfig = {
  semaphore: {
    apiKey: process.env.SEMAPHORE_API_KEY || '',
    senderName: process.env.SEMAPHORE_SENDER_NAME || 'VictorioABC',
    endpoint: 'https://api.semaphore.co/api/v4/messages',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@victorioabc.ph',
  },
  firebase: {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  },
};
