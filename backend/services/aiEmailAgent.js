import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import OpenAI from 'openai';
import pool from '../db.js';

export async function startEmailAgent() {
  const GMAIL_USER = process.env.GMAIL_EMAIL?.trim();
  const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD?.trim();
  const GROQ_KEY = process.env.GROQ_API_KEY?.trim();

  if (!GMAIL_USER || !GMAIL_PASS || !GROQ_KEY) {
    console.warn('[!] AI Email Agent disabled. Missing GMAIL_EMAIL, GMAIL_APP_PASSWORD, or GROQ_API_KEY.');
    return;
  }

  const openai = new OpenAI({ 
    apiKey: GROQ_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  });

  const startAgent = async () => {
    // Create fresh instance per retry
    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
      },
      logger: false 
    });

    const checkMails = async () => {
      let lock;
      try {
        lock = await client.getMailboxLock('INBOX');
        console.log('Checking for unread emails...');

        const messages = client.fetch({ seen: false }, { uid: true, source: true });

        for await (let message of messages) {
          console.log(`Processing message UID: ${message.uid}`);
          
          const parsed = await simpleParser(message.source);
          const subject = parsed.subject || 'No Subject';
          const sender = parsed.from?.text || 'Unknown Sender';
          const body = parsed.text || parsed.textAsHtml || '';

          const prompt = `Analyze the following email content and determine if it is spam or phishing. Consider factors like suspicious links, urgent language, unknown sender, and misleading content. Respond only with 'Spam' or 'Safe'.

Subject: ${subject}
Sender: ${sender}
Body: ${body.substring(0, 1500)}`;

          const completion = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          });

          const classification = completion.choices[0].message.content.trim();
          console.log(`Email from ${sender} classified as: ${classification}`);

          await pool.query(
            `INSERT INTO email_logs (sender, subject, classification, confidence) VALUES ($1, $2, $3, $4)`,
            [sender, subject, classification, classification === 'Spam' ? 'High' : 'N/A']
          );

          if (classification.includes('Spam')) {
            try {
              await client.messageMove(message.uid, '[Gmail]/Spam', { uid: true });
              console.log(`Moved UID ${message.uid} to Spam folder.`);
            } catch (moveErr) {
               console.error("Could not move to spam:", moveErr);
            }
          } 
          
          await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
        }

      } catch (err) {
        console.error('Error during mail fetching/processing:', err);
      } finally {
        if (lock) lock.release();
      }
    };

    try {
      await client.connect();
      console.log('[+] AI Email Agent connected to IMAP server.');
      
      await checkMails();
      setInterval(checkMails, 60 * 1000); // 1 minute
      
    } catch (err) {
      console.error('[!] AI Email Agent failed to connect:', err.response || err);
      setTimeout(startAgent, 30000);
    }
  };

  startAgent();
}
