#!/usr/bin/env node

const axios = require('axios');
const express = require('express');
const { tiktok } = require('../lib/tiktok');

const router = express.Router();

const extractTikTokUrl = (text) => {
  const urlPattern = /https?:\/\/(?:www\.)?(?:vm\.tiktok\.com|vt\.tiktok\.com|tiktok\.com)\/[^\s]*/gi;
  const matches = text.match(urlPattern);
  if (matches && matches.length > 0) return matches[0].split(/[\s,]/)[0];
  return null;
};

const isValidTikTokUrl = (url) => {
  return typeof url === 'string' && /^https?:\/\/.*tiktok\.com\/.+/.test(url);
};

const ok = (result) => ({ status: true, result });
const err = (message) => ({ status: false, message });

router.all('/get-info', async (req, res) => {
  try {
    const raw = req.query.url;
    if (!raw) return res.json(err("Input parameter 'url' is missing."));
    const url = extractTikTokUrl(raw) || raw;
    if (!isValidTikTokUrl(url)) return res.json(err('Invalid URL provided!'));
    const result = await tiktok(url, req);
    return res.status(200).json(ok(result));
  } catch (e) {
    return res.status(500).json(err(e.message));
  }
});

router.all('/preview', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.json(err("Input parameter 'url' is missing."));

    const response = await axios.get(url, {
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const contentType = response.headers['content-type'];
    if (contentType) res.setHeader('Content-Type', contentType);

    const contentLength = response.headers['content-length'];
    if (contentLength) res.setHeader('Content-Length', contentLength);

    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');

    response.data.pipe(res);
  } catch (e) {
    res.status(500).json(err(e.message));
  }
});

router.all('/download', async (req, res) => {
  try {
    const url = req.query.url;
    const filename = req.query.filename;
    if (!url) return res.json(err("Input parameter 'url' is missing."));

    const response = await axios.get(url, {
      responseType: 'stream',
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400
    });

    const finalFilename = filename || url.split('/').pop().split('?')[0];
    const contentLength = response.headers['content-length'];
    const contentType = response.headers['content-type'];

    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    } else {
      res.setHeader('Transfer-Encoding', 'chunked');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Disposition, Content-Type');

    response.data.pipe(res);
  } catch (e) {
    res.status(500).json(err(e.message));
  }
});

module.exports = router;
