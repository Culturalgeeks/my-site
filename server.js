require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route /api/:fn  →  api/:fn.js
app.all('/api/:fn', async (req, res) => {
  try {
    const handler = require(path.join(__dirname, 'api', req.params.fn));
    await handler(req, res);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return res.status(404).json({ error: `No handler found for /api/${req.params.fn}` });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static site files
app.use(express.static(path.join(__dirname)));

// SPA fallback — serve index.html for any unmatched route
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  CulturalGeeks dev server`);
  console.log(`  http://localhost:${PORT}\n`);
});
