import { auth, googleProvider } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Setup Workspace scopes
const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose'
];

// Add scopes to our Google Provider
WORKSPACE_SCOPES.forEach(scope => {
  googleProvider.addScope(scope);
});

// Cache token in memory (never localStorage for security)
let cachedAccessToken: string | null = null;

export const getCachedToken = (): string | null => cachedAccessToken;
export const clearCachedToken = () => {
  cachedAccessToken = null;
};

/**
 * Initiates Google OAuth Sign-in specifically for Workspace permissions
 */
export async function connectGoogleWorkspace(): Promise<{ user: any; accessToken: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get Google OAuth Access Token');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Workspace Connection Error:', error);
    throw error;
  }
}

// Ensure auth state changes clear token if signed out
auth.onAuthStateChanged((user) => {
  if (!user) {
    clearCachedToken();
  }
});

/**
 * GOOGLE CALENDAR API
 */
export async function listCalendarEvents(calendarId = 'primary') {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=15&orderBy=startTime&singleEvents=true`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  return data.items || [];
}

export async function createCalendarEvent(eventData: {
  summary: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  attendees?: string[];
  createMeetLink?: boolean;
}) {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const body: any = {
    summary: eventData.summary,
    description: eventData.description,
    start: { dateTime: eventData.start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    end: { dateTime: eventData.end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  };

  if (eventData.attendees && eventData.attendees.length > 0) {
    body.attendees = eventData.attendees.map(email => ({ email }));
  }

  if (eventData.createMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    };
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=${eventData.createMeetLink ? 1 : 0}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}

export async function deleteCalendarEvent(eventId: string) {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return true;
}


/**
 * GOOGLE SHEETS API
 */
export async function createSpreadsheet(title: string) {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title }
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}

export async function appendRowToSheet(spreadsheetId: string, range: string, values: any[]) {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [values]
      })
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}

export async function getSpreadsheetValues(spreadsheetId: string, range: string) {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  return data.values || [];
}


/**
 * GMAIL API
 */
export async function sendGmail(emailData: {
  to: string;
  subject: string;
  body: string;
}) {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  // Construct raw RFC 2822 email format
  const emailLines = [
    `To: ${emailData.to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(emailData.subject)))}?=`,
    '',
    emailData.body
  ];
  const emailStr = emailLines.join('\r\n');
  const base64SafeEmail = btoa(unescape(encodeURIComponent(emailStr)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: base64SafeEmail
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}

export async function listGmailMessages() {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  const messages = data.messages || [];

  // Fetch details for the first 5 messages to show rich content
  const detailedMessages = await Promise.all(
    messages.slice(0, 5).map(async (msg: any) => {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (detailRes.ok) {
        return await detailRes.json();
      }
      return msg;
    })
  );

  return detailedMessages;
}


/**
 * GOOGLE CONTACTS (PEOPLE API)
 */
export async function listGoogleContacts() {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=15',
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  return data.connections || [];
}

export async function createGoogleContact(contact: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}) {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const body: any = {
    names: [{ givenName: contact.firstName, familyName: contact.lastName }]
  };

  if (contact.email) {
    body.emailAddresses = [{ value: contact.email, type: 'home' }];
  }
  if (contact.phone) {
    body.phoneNumbers = [{ value: contact.phone, type: 'mobile' }];
  }

  const response = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}


/**
 * GOOGLE CHAT API (Spaces & Messages)
 */
export async function listChatSpaces() {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = await response.json();
  return data.spaces || [];
}

export async function sendChatMessage(spaceName: string, text: string) {
  const token = getCachedToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const response = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  return await response.json();
}
