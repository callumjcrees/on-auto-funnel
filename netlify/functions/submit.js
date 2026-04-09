exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const GHL_TOKEN = process.env.GHL_API_KEY || 'pit-d269fd1b-794c-4a57-8988-e03cd354c50f';
  const LOCATION_ID = process.env.GHL_LOCATION_ID || 'F4rbkQEhtHZ7rwLFK791';
  const PIPELINE_ID = 'F9TzPgajMxi9HVPYsqTp';
  const STAGE_ID = '77613488-801d-464f-9b36-4d7ccb172997';

  const headers = {
    'Authorization': `Bearer ${GHL_TOKEN}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
  };

  const notes = [
    `Industry: ${data.industry || '—'}`,
    `Team Size: ${data.teamSize || '—'}`,
    `Business: ${data.bizDescription || '—'}`,
    `Top Challenge: ${data.topChallenge || '—'}`,
    `ROI Value: £${data.roiAmount || '—'}`,
    `AI Areas: ${data.aiAreas || '—'}`,
    `Tech Stack: ${data.techStack || '—'}`,
    `LinkedIn: ${data.linkedinUrl || '—'}`,
    `Source: AI Guide Funnel`,
  ].join('\n');

  try {
    // 1. Create contact
    const contactRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        locationId: LOCATION_ID,
        firstName: data.firstName || '',
        email: data.email || '',
        companyName: data.companyName || '',
        source: 'AI Guide Funnel',
        tags: ['guide-funnel', 'on-auto'],
      }),
    });

    const contactData = await contactRes.json();

    if (!contactRes.ok) {
      console.error('Contact creation failed:', contactData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Contact creation failed', detail: contactData }) };
    }

    const contactId = contactData?.contact?.id;
    if (!contactId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'No contact ID returned' }) };
    }

    // 2. Add note
    await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ body: notes }),
    });

    // 3. Create opportunity
    await fetch('https://services.leadconnectorhq.com/opportunities/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        pipelineId: PIPELINE_ID,
        locationId: LOCATION_ID,
        name: `${data.firstName || 'Unknown'} — ${data.companyName || 'Unknown'}`,
        pipelineStageId: STAGE_ID,
        contactId,
        status: 'open',
      }),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, contactId }),
    };

  } catch (err) {
    console.error('Submit error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
