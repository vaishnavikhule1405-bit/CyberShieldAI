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

          const completion = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content:
                  'You are an email content classifier. Your job is to detect spam and phishing emails. ' +
                  'IMPORTANT: Judge based on the MESSAGE CONTENT ONLY — subject line and body. ' +
                  'Do NOT use the sender address to decide. A spam message is spam regardless of who sent it, ' +
                  'even if it came from a teammate, colleague, or known contact. ' +
                  'Look for: urgent/threatening language, requests for money or credentials, suspicious links, ' +
                  'lottery/prize scams, impersonation, misleading claims, unsolicited offers. ' +
                  'Respond with ONLY one word: "Spam" or "Safe". No explanation.',
              },
              {
                role: 'user',
                content: `Subject: ${subject}\n\nBody:\n${body.substring(0, 2000)}`,
              },
            ],
            temperature: 0,  // deterministic — same content must always give same result
          });

          const raw = completion.choices[0].message.content.trim();
          const classification = raw.toLowerCase().includes('spam') ? 'Spam' : 'Safe';
          console.log(`Email from ${sender} | Subject: "${subject}" → ${classification}`);

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

      // Guard to prevent both 'error' and 'close' from scheduling two reconnects
      let reconnecting = false;
      let pollInterval;

      const scheduleReconnect = (reason) => {
        if (reconnecting) return;
        reconnecting = true;
        clearInterval(pollInterval);
        console.warn(`[!] AI Email Agent reconnecting in 30s (reason: ${reason})`);
        setTimeout(startAgent, 30_000);
      };

      // ── Handle socket-level errors (ETIMEOUT, ECONNRESET, etc.) ──────────────────
      client.on('error', (err) => {
        console.error('[!] AI Email Agent IMAP error:', err.code ?? err.message);
        scheduleReconnect(err.code ?? err.message);
      });

      client.on('close', () => {
        scheduleReconnect('connection closed');
      });

      await checkMails();
      pollInterval = setInterval(checkMails, 60 * 1000); // 1 minute

    } catch (err) {
      const errMsg = err.response ?? err.message ?? String(err);
      const isAuthError = typeof errMsg === 'string' && errMsg.includes('Invalid credentials');

      if (isAuthError) {
        console.error(
          '[!] AI Email Agent: Gmail authentication FAILED.\n' +
          '    The App Password in .env is invalid or has been revoked.\n' +
          '    Steps to fix:\n' +
          '      1. Go to https://myaccount.google.com/apppasswords\n' +
          '      2. Delete the old password and create a new one\n' +
          '      3. Update GMAIL_APP_PASSWORD in backend/.env\n' +
          '    Email agent will NOT retry until the server restarts.'
        );
        // Do NOT retry — wrong credentials will never suddenly become right
        return;
      }

      console.error('[!] AI Email Agent failed to connect:', errMsg);
      setTimeout(startAgent, 30_000);
    }
  };

  startAgent();
}
