const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/api/claude', async (req, res) => {
  console.log('Requête reçue:', JSON.stringify(req.body).substring(0, 100));
  try {
    const https = require('https');
    const body = JSON.stringify(req.body);
    
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'TA_CLE_API_ICI',
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => res.json(JSON.parse(data)));
    });

    request.on('error', e => res.status(500).json({ error: e.message }));
    request.write(body);
    request.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Serveur sur http://localhost:3000'));