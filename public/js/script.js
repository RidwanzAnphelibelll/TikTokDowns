window.addEventListener('load', function() {
  setTimeout(function() {
    document.getElementById('loading').style.opacity = '0';
    setTimeout(function() {
      document.getElementById('loading').style.display = 'none';
    }, 500);
  }, 1000);
});

const observeElements = () => {
  const featureCards = document.querySelectorAll('.feature-card');
  const stepCards = document.querySelectorAll('.step-card');

  if (!('IntersectionObserver' in window)) {
    featureCards.forEach(card => card.classList.add('visible'));
    stepCards.forEach(card => card.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  featureCards.forEach(card => observer.observe(card));
  stepCards.forEach(card => observer.observe(card));
};

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    const input = document.getElementById('tiktok-url');
    input.value = text.trim();
    input.classList.add('paste-effect');
    setTimeout(() => input.classList.remove('paste-effect'), 800);
    updateInputIcon();
    input.focus();
  } catch (err) {
    showError('Failed to read clipboard. Please paste manually.');
  }
}

function updateInputIcon() {
  const input = document.getElementById('tiktok-url');
  const pasteBtn = document.getElementById('paste-btn');
  const icon = pasteBtn.querySelector('i');
  if (input.value.trim()) {
    icon.className = 'fas fa-times';
    pasteBtn.setAttribute('title', 'Clear URL');
    pasteBtn.setAttribute('aria-label', 'Clear URL');
  } else {
    icon.className = 'fas fa-paste';
    pasteBtn.setAttribute('title', 'Paste from clipboard');
    pasteBtn.setAttribute('aria-label', 'Paste URL');
  }
}

function handleIconClick() {
  const input = document.getElementById('tiktok-url');
  if (input.value.trim()) {
    clearInput();
  } else {
    pasteFromClipboard();
  }
}

function isValidTikTokURL(url) {
  const pattern = /^https?:\/\/.*tiktok\.com\/.+/;
  return pattern.test(url);
}

function clearInput() {
  const input = document.getElementById('tiktok-url');
  const errorMessage = document.getElementById('error-message');
  const resultContainer = document.getElementById('result-container');
  const noResultContainer = document.getElementById('no-result-container');
  const downloadSection = document.querySelector('.download-section');
  const featuresSection = document.querySelector('.features-section');
  const howToSection = document.querySelector('.how-to-section');

  input.value = '';
  errorMessage.classList.remove('active');
  resultContainer.style.display = 'none';
  if (noResultContainer) noResultContainer.style.display = 'none';
  downloadSection.style.display = 'block';
  featuresSection.style.display = 'block';
  howToSection.style.display = 'block';
  updateInputIcon();
  input.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleDownload() {
  const input = document.getElementById('tiktok-url');
  const url = input.value.trim();
  if (!url) {
    showError('Please enter a TikTok URL!');
    return;
  }
  if (!isValidTikTokURL(url)) {
    showError('Invalid TikTok URL! Please enter a valid TikTok link.');
    return;
  }
  getTikTokData(url);
}

async function getTikTokData(url) {
  const loader = document.getElementById('loader');
  const errorMessage = document.getElementById('error-message');
  const resultContainer = document.getElementById('result-container');
  const noResultContainer = document.getElementById('no-result-container');

  loader.classList.add('active');
  errorMessage.classList.remove('active');
  resultContainer.style.display = 'none';
  if (noResultContainer) noResultContainer.style.display = 'none';

  try {
    const response = await fetch('/api/get-info?url=' + encodeURIComponent(url));
    const data = await response.json();
    loader.classList.remove('active');
    if (data.status && data.result) {
      displayResult(data.result);
    } else {
      showNoResult(data.message || 'No result found!');
    }
  } catch (e) {
    loader.classList.remove('active');
    showNoResult('Network error occurred. Please check your connection.');
  }
}

function displayResult(data) {
  const resultContainer = document.getElementById('result-container');
  const noResultContainer = document.getElementById('no-result-container');
  const downloadSection = document.querySelector('.download-section');
  const featuresSection = document.querySelector('.features-section');
  const howToSection = document.querySelector('.how-to-section');

  if (noResultContainer) noResultContainer.style.display = 'none';
  downloadSection.style.display = 'none';
  featuresSection.style.display = 'none';
  howToSection.style.display = 'none';

  document.getElementById('author-nickname').textContent = data.author_nickname;

  const authorUsernameLink = document.getElementById('author-username-link');
  const authorUsernameText = document.getElementById('author-username');
  authorUsernameText.textContent = '@' + data.author_username;
  authorUsernameLink.href = 'https://tiktok.com/@' + data.author_username;

  const authorAvatar = document.getElementById('author-avatar');
  const authorAvatarPlaceholder = document.getElementById('author-avatar-placeholder');

  if (data.author_avatar) {
    authorAvatar.src = data.author_avatar;
    authorAvatar.style.display = 'block';
    authorAvatarPlaceholder.style.display = 'none';
  } else {
    authorAvatar.style.display = 'none';
    authorAvatarPlaceholder.style.display = 'flex';
  }

  const videoPreview = document.querySelector('.video-preview');
  const titleInfo = document.querySelector('.video-info');
  const downloadOptions = document.getElementById('download-options');

  if (data.type === 'image') {
    videoPreview.innerHTML = `
      <div class="images-preview-container">
        <div class="images-grid" id="images-grid"></div>
        <div class="images-stats">
          <span><i class="fas fa-heart"></i> ${data.likes}</span>
          <span><i class="fas fa-comment"></i> ${data.comments}</span>
          <span><i class="fas fa-share"></i> ${data.shares}</span>
          <span><i class="fas fa-eye"></i> ${data.views}</span>
        </div>
      </div>
    `;

    const imagesGrid = document.getElementById('images-grid');
    data.images.forEach((downloadUrl, index) => {
      const previewUrl = downloadUrl.replace('/api/download?', '/api/preview?').replace(/&filename=[^&]*/, '');
      const imageItem = document.createElement('div');
      imageItem.className = 'image-item';
      imageItem.innerHTML = `
        <img src="${previewUrl}" alt="Image ${index + 1}" loading="lazy">
        <div class="image-info">
          <span class="image-number">#${index + 1}</span>
          <button class="image-download-btn" onclick="downloadFile('${downloadUrl}')">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      `;
      imagesGrid.appendChild(imageItem);
    });

    titleInfo.innerHTML = `<h2>${data.title_image}</h2>`;

    downloadOptions.innerHTML = `
      <h3><i class="fas fa-download"></i> Download Options</h3>
      <div class="options-grid" id="options-grid"></div>
    `;

    const optionsGrid = document.getElementById('options-grid');
    if (data.audio) {
      optionsGrid.appendChild(createOptionCard('Audio MP3', data.title_audio, 'fa-music', 'audio', data.audio, 'MP3', 'audio'));
    }
  } else {
    videoPreview.innerHTML = `
      <div class="video-thumbnail-container">
        <img id="video-thumbnail" src="${data.thumbnail}" alt="Video Thumbnail" />
        ${data.duration ? `<span class="video-duration-badge">${data.duration}</span>` : ''}
      </div>
      <div class="video-stats">
        <span><i class="fas fa-heart"></i> ${data.likes}</span>
        <span><i class="fas fa-comment"></i> ${data.comments}</span>
        <span><i class="fas fa-share"></i> ${data.shares}</span>
        <span><i class="fas fa-eye"></i> ${data.views}</span>
      </div>
    `;

    titleInfo.innerHTML = `<h2>${data.title_video}</h2>`;

    downloadOptions.innerHTML = `
      <h3><i class="fas fa-download"></i> Download Options</h3>
      <div class="options-grid" id="options-grid"></div>
    `;

    const optionsGrid = document.getElementById('options-grid');
    if (data.video_sd) optionsGrid.appendChild(createOptionCard('Video SD', 'Standard Quality Video', 'fa-video', 'video', data.video_sd, 'SD', 'sd'));
    if (data.video_hd) optionsGrid.appendChild(createOptionCard('Video HD', 'High Quality Video', 'fa-video', 'video', data.video_hd, 'HD', 'hd'));
    if (data.audio) optionsGrid.appendChild(createOptionCard('Audio MP3', data.title_audio, 'fa-music', 'audio', data.audio, 'MP3', 'audio'));
  }

  const downloadAnotherContainer = document.createElement('div');
  downloadAnotherContainer.className = 'download-another-container';
  downloadAnotherContainer.innerHTML = `
    <button class="download-another-btn" onclick="clearInput()">
      <i class="fas fa-redo"></i> Download Another
    </button>
  `;
  const existingAnother = downloadOptions.querySelector('.download-another-container');
  if (existingAnother) existingAnother.remove();
  downloadOptions.appendChild(downloadAnotherContainer);

  resultContainer.style.display = 'block';
}

function createOptionCard(title, description, icon, type, downloadUrl, badgeText, badgeClass) {
  const card = document.createElement('div');
  card.className = 'option-card';
  card.innerHTML = `
    <div class="option-header">
      <div class="option-icon ${type}">
        <i class="fas ${icon}"></i>
      </div>
      <div class="option-details">
        <h4>${title}</h4>
        <p>${description}</p>
      </div>
    </div>
    <div class="option-action">
      <span class="quality-badge ${badgeClass}">${badgeText}</span>
      <button class="download-action-btn" onclick="downloadFile('${downloadUrl}')">
        Download <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  `;
  return card;
}

function downloadFile(downloadUrl) {
  window.location.href = downloadUrl;
}

function showNoResult(message) {
  const resultContainer = document.getElementById('result-container');
  resultContainer.style.display = 'none';

  let noResultContainer = document.getElementById('no-result-container');
  if (!noResultContainer) {
    noResultContainer = document.createElement('div');
    noResultContainer.id = 'no-result-container';
    noResultContainer.className = 'no-result-container';
    const mainContainer = document.querySelector('.container');
    const downloadSection = document.querySelector('.download-section');
    mainContainer.insertBefore(noResultContainer, downloadSection.nextSibling);
  }

  noResultContainer.innerHTML = `
    <div class="no-result-content">
      <div class="no-result-icon"><i class="fas fa-search"></i></div>
      <h3>No Result Found</h3>
      <p>${message}</p>
      <button class="try-again-btn" onclick="clearInput()">
        <i class="fas fa-redo"></i> Try Again
      </button>
    </div>
  `;
  noResultContainer.style.display = 'block';
}

function showError(message) {
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  errorText.textContent = message;
  errorMessage.classList.add('active');
}

function handleScroll() {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('year').textContent = new Date().getFullYear();

  const downloadBtn = document.getElementById('download-btn');
  const input = document.getElementById('tiktok-url');
  const pasteBtn = document.getElementById('paste-btn');
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const navMenu = document.getElementById('nav-menu');

  downloadBtn.addEventListener('click', handleDownload);
  pasteBtn.addEventListener('click', handleIconClick);

  input.addEventListener('input', updateInputIcon);
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleDownload();
  });

  hamburgerMenu.addEventListener('click', function() {
    navMenu.classList.toggle('show');
  });

  document.addEventListener('click', function(event) {
    if (!hamburgerMenu.contains(event.target) && !navMenu.contains(event.target)) {
      navMenu.classList.remove('show');
    }
  });

  window.addEventListener('scroll', handleScroll);
  observeElements();
});
