import fs from 'fs';

async function checkRest() {
  try {
    const res = await fetch('https://tnhhtnthbkmvyqgndbmc.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'sb_publishable_k32YrJ87SIP__SW37TYkoQ_Chp0KXmR'
      }
    });
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
checkRest();
