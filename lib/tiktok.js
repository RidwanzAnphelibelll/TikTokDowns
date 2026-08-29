#!/usr/bin/env node

const axios = require('axios');

const RAPIDAPI_KEY = 'b7a226349dmshe6962f8400d6eedp1d6c1ejsne5229da5f4cc';
const RAPIDAPI_HOST = 'tiktok-video-no-watermark2.p.rapidapi.com';

const tiktok = async (url, req) => {
  const response = await axios.post(
    `https://${RAPIDAPI_HOST}`,
    new URLSearchParams({ url, hd: '1' }),
    {
      headers: {
        'User-Agent': 'okhttp/3.12.0',
        'Accept-Encoding': 'gzip',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      decompress: true
    }
  );

  const data = response.data.data;
  if (!data) throw new Error('No results found!');

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timestamp = Date.now();
  const baseUrl = req ? `${req.protocol}://${req.get('host')}` : '';

  const createDownloadUrl = (sourceUrl, filename) => {
    if (!sourceUrl) return null;
    return `${baseUrl}/api/download?url=${encodeURIComponent(sourceUrl)}&filename=${encodeURIComponent(filename)}`;
  };

  const createPreviewUrl = (sourceUrl) => {
    if (!sourceUrl) return null;
    return `${baseUrl}/api/preview?url=${encodeURIComponent(sourceUrl)}`;
  };

  const baseResult = {
    likes: formatNumber(data.digg_count),
    views: formatNumber(data.play_count),
    shares: formatNumber(data.share_count),
    comments: formatNumber(data.comment_count),
    author_avatar: createPreviewUrl(data.author.avatar),
    author_nickname: data.author.nickname,
    author_username: data.author.unique_id
  };

  if (data.images && data.images.length > 0) {
    return {
      ...baseResult,
      type: 'image',
      title_image: data.title || '',
      image_count: data.images.length,
      images: data.images.map((img, index) => createDownloadUrl(img, `TikTok-IMG-${timestamp}_${index + 1}.jpg`)),
      title_audio: data.music_info.title,
      audio: createDownloadUrl(data.music, `TikTok-AUD-${timestamp}.mp3`)
    };
  } else {
    return {
      ...baseResult,
      type: 'video',
      title_video: data.title || '',
      thumbnail: createPreviewUrl(data.cover),
      duration: formatDuration(data.duration),
      video_sd: createDownloadUrl(data.play, `TikTok-VID-${timestamp}_SD.mp4`),
      video_hd: createDownloadUrl(data.hdplay, `TikTok-VID-${timestamp}_HD.mp4`),
      title_audio: data.music_info.title,
      audio: createDownloadUrl(data.music, `TikTok-AUD-${timestamp}.mp3`)
    };
  }
};

module.exports = { tiktok };
