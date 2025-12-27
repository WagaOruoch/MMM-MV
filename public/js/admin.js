// Admin Panel JavaScript

// State
let slides = [];
let currentEditingSlide = null;
let slideToDelete = null;
let currentImageData = '';
let settings = {};

// DOM Elements
const slidesList = document.getElementById('slidesList');
const emptyState = document.getElementById('emptyState');
const slideCount = document.getElementById('slideCount');
const slideModal = document.getElementById('slideModal');
const confirmModal = document.getElementById('confirmModal');
const toast = document.getElementById('toast');
const slideForm = document.getElementById('slideForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchSlides();
  fetchSettings();
  initEventListeners();
});

// Event Listeners
function initEventListeners() {
  // Slide type buttons
  document.querySelectorAll('.slide-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openSlideModal(btn.dataset.type);
    });
  });

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', closeSlideModal);
  document.getElementById('cancelBtn').addEventListener('click', closeSlideModal);
  document.getElementById('saveSlideBtn').addEventListener('click', saveSlide);

  // Confirm modal
  document.getElementById('confirmModalClose').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

  // Image upload
  const imageUploadArea = document.getElementById('imageUploadArea');
  const slideImage = document.getElementById('slideImage');

  imageUploadArea.addEventListener('click', () => slideImage.click());
  imageUploadArea.addEventListener('dragover', handleDragOver);
  imageUploadArea.addEventListener('dragleave', handleDragLeave);
  imageUploadArea.addEventListener('drop', handleDrop);
  slideImage.addEventListener('change', handleImageSelect);
  document.getElementById('removeImage').addEventListener('click', removeImage);

  // Color picker
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      document.getElementById('backgroundColor').value = option.dataset.color;
    });
  });

  // Stats
  document.getElementById('addStatBtn').addEventListener('click', addStatRow);

  // Header buttons
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('publishAllBtn').addEventListener('click', publishAll);

  // Settings
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  document.getElementById('bgMusic').addEventListener('change', handleAudioUpload);
  document.getElementById('removeAudio').addEventListener('click', removeAudio);
}

// API Functions
async function fetchSlides() {
  try {
    const response = await fetch('/api/admin/slides');
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    slides = await response.json();
    renderSlides();
  } catch (error) {
    showToast('Error fetching slides', 'error');
  }
}

async function fetchSettings() {
  try {
    const response = await fetch('/api/admin/settings');
    if (response.ok) {
      settings = await response.json();
      document.getElementById('siteTitle').value = settings.siteTitle || '';
      document.getElementById('musicEnabled').checked = settings.backgroundMusicEnabled || false;
      
      if (settings.backgroundMusicUrl) {
        document.getElementById('audioPreview').style.display = 'flex';
        document.getElementById('audioPlayer').src = settings.backgroundMusicUrl;
      }
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
  }
}

async function saveSlide() {
  const slideId = document.getElementById('slideId').value;
  const slideData = {
    type: document.getElementById('slideType').value,
    title: document.getElementById('slideTitle').value,
    subtitle: document.getElementById('slideSubtitle').value,
    content: document.getElementById('slideContent').value,
    imageUrl: currentImageData,
    backgroundColor: document.getElementById('backgroundColor').value,
    isPublished: document.getElementById('isPublished').checked,
    stats: getStatsData()
  };

  try {
    let response;
    if (slideId) {
      response = await fetch(`/api/admin/slides/${slideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideData)
      });
    } else {
      response = await fetch('/api/admin/slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slideData)
      });
    }

    if (response.ok) {
      showToast(slideId ? 'Slide updated!' : 'Slide created!', 'success');
      closeSlideModal();
      fetchSlides();
    } else {
      showToast('Error saving slide', 'error');
    }
  } catch (error) {
    showToast('Error saving slide', 'error');
  }
}

async function deleteSlide(id) {
  try {
    const response = await fetch(`/api/admin/slides/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('Slide deleted!', 'success');
      fetchSlides();
    } else {
      showToast('Error deleting slide', 'error');
    }
  } catch (error) {
    showToast('Error deleting slide', 'error');
  }
}

async function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const xhr = new XMLHttpRequest();
    
    // Progress event
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        updateUploadProgress(percentComplete);
      }
    });
    
    // Load complete
    xhr.addEventListener('load', () => {
      hideUploadProgress();
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.imageUrl);
        } catch (e) {
          showToast('Error parsing response', 'error');
          resolve(null);
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          showToast(error.error || 'Upload failed', 'error');
        } catch (e) {
          showToast('Upload failed', 'error');
        }
        resolve(null);
      }
    });
    
    // Error event
    xhr.addEventListener('error', () => {
      hideUploadProgress();
      showToast('Network error during upload', 'error');
      resolve(null);
    });
    
    // Abort event
    xhr.addEventListener('abort', () => {
      hideUploadProgress();
      showToast('Upload cancelled', 'error');
      resolve(null);
    });
    
    xhr.open('POST', '/api/admin/upload');
    xhr.send(formData);
  });
}

function updateUploadProgress(percent) {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  if (progressBar && progressText) {
    progressBar.style.width = percent + '%';
    progressText.textContent = `Uploading... ${percent}%`;
  }
}

function showUploadProgress() {
  document.getElementById('uploadPlaceholder').style.display = 'none';
  document.getElementById('uploadProgress').style.display = 'block';
  document.getElementById('imagePreview').style.display = 'none';
  updateUploadProgress(0);
}

function hideUploadProgress() {
  document.getElementById('uploadProgress').style.display = 'none';
}

async function uploadAudio(file) {
  const formData = new FormData();
  formData.append('audio', file);

  try {
    const response = await fetch('/api/admin/upload-audio', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      return data.audioUrl;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    showToast('Error uploading audio', 'error');
    return null;
  }
}

async function saveSettings() {
  const settingsData = {
    siteTitle: document.getElementById('siteTitle').value,
    backgroundMusicEnabled: document.getElementById('musicEnabled').checked,
    backgroundMusicUrl: settings.backgroundMusicUrl || ''
  };

  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });

    if (response.ok) {
      showToast('Settings saved!', 'success');
    } else {
      showToast('Error saving settings', 'error');
    }
  } catch (error) {
    showToast('Error saving settings', 'error');
  }
}

async function publishAll() {
  const unpublishedCount = slides.filter(s => !s.isPublished).length;
  const action = unpublishedCount > 0;

  try {
    const response = await fetch('/api/admin/publish-all', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: action })
    });

    if (response.ok) {
      showToast(action ? 'All slides published!' : 'All slides unpublished!', 'success');
      fetchSlides();
    } else {
      showToast('Error updating slides', 'error');
    }
  } catch (error) {
    showToast('Error updating slides', 'error');
  }
}

async function reorderSlides(slideIds) {
  try {
    const response = await fetch('/api/admin/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideIds })
    });

    if (!response.ok) {
      showToast('Error reordering slides', 'error');
      fetchSlides(); // Refresh to restore original order
    }
  } catch (error) {
    showToast('Error reordering slides', 'error');
    fetchSlides();
  }
}

async function logout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/login';
  } catch (error) {
    window.location.href = '/login';
  }
}

// Render Functions
function renderSlides() {
  if (slides.length === 0) {
    slidesList.style.display = 'none';
    emptyState.style.display = 'flex';
  } else {
    slidesList.style.display = 'flex';
    emptyState.style.display = 'none';
  }

  slideCount.textContent = `${slides.length} slide${slides.length !== 1 ? 's' : ''}`;

  slidesList.innerHTML = slides.map((slide, index) => `
    <div class="slide-card" draggable="true" data-id="${slide._id}" data-index="${index}">
      <div class="slide-drag-handle">⋮⋮</div>
      <div class="slide-preview ${slide.backgroundColor || 'gradient-1'}">
        ${slide.imageUrl 
          ? `<img src="${slide.imageUrl}" alt="Preview">`
          : `<div class="slide-preview-placeholder">${getSlideIcon(slide.type)}</div>`
        }
      </div>
      <div class="slide-info">
        <span class="slide-type-badge">${slide.type}</span>
        <div class="slide-title">${slide.title || 'Untitled'}</div>
        <div class="slide-subtitle">${slide.subtitle || ''}</div>
      </div>
      <div class="slide-status ${slide.isPublished ? 'published' : ''}" title="${slide.isPublished ? 'Published' : 'Draft'}"></div>
      <div class="slide-actions">
        <button class="slide-action-btn edit" onclick="editSlide('${slide._id}')" title="Edit">✏️</button>
        <button class="slide-action-btn delete" onclick="showDeleteConfirm('${slide._id}')" title="Delete">🗑️</button>
      </div>
    </div>
  `).join('');

  initDragAndDrop();
}

function getSlideIcon(type) {
  const icons = {
    cover: '🎬',
    photo: '📷',
    stat: '📊',
    quote: '💬',
    message: '💌',
    closing: '💖'
  };
  return icons[type] || '📝';
}

// Modal Functions
function openSlideModal(type, slideData = null) {
  currentEditingSlide = slideData;
  currentImageData = slideData?.imageUrl || '';

  document.getElementById('modalTitle').textContent = slideData ? 'Edit Slide' : 'Add New Slide';
  document.getElementById('slideId').value = slideData?._id || '';
  document.getElementById('slideType').value = type;
  document.getElementById('slideTitle').value = slideData?.title || '';
  document.getElementById('slideSubtitle').value = slideData?.subtitle || '';
  document.getElementById('slideContent').value = slideData?.content || '';
  document.getElementById('isPublished').checked = slideData?.isPublished || false;

  // Set background color
  const bgColor = slideData?.backgroundColor || 'gradient-1';
  document.getElementById('backgroundColor').value = bgColor;
  document.querySelectorAll('.color-option').forEach(o => {
    o.classList.toggle('active', o.dataset.color === bgColor);
  });

  // Show/hide fields based on type
  const contentGroup = document.getElementById('contentGroup');
  const imageGroup = document.getElementById('imageGroup');
  const statsGroup = document.getElementById('statsGroup');

  contentGroup.style.display = ['quote', 'message', 'closing'].includes(type) ? 'block' : 'none';
  imageGroup.style.display = ['cover', 'photo', 'message'].includes(type) ? 'block' : 'none';
  statsGroup.style.display = type === 'stat' ? 'block' : 'none';

  // Handle image preview
  if (currentImageData) {
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('previewImg').src = currentImageData;
  } else {
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('imagePreview').style.display = 'none';
  }

  // Handle stats
  if (type === 'stat') {
    renderStats(slideData?.stats || []);
  }

  slideModal.classList.add('show');
}

function closeSlideModal() {
  slideModal.classList.remove('show');
  currentEditingSlide = null;
  currentImageData = '';
  slideForm.reset();
}

function editSlide(id) {
  const slide = slides.find(s => s._id === id);
  if (slide) {
    openSlideModal(slide.type, slide);
  }
}

function showDeleteConfirm(id) {
  slideToDelete = id;
  confirmModal.classList.add('show');
}

function closeConfirmModal() {
  confirmModal.classList.remove('show');
  slideToDelete = null;
}

function confirmDelete() {
  if (slideToDelete) {
    deleteSlide(slideToDelete);
    closeConfirmModal();
  }
}

// Image Handling
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('dragover');
}

async function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    await processImage(file);
  }
}

async function handleImageSelect(e) {
  const file = e.target.files[0];
  if (file) {
    await processImage(file);
  }
}

async function processImage(file) {
  if (file.size > 12 * 1024 * 1024) {
    showToast('Image must be less than 12MB', 'error');
    return;
  }

  showUploadProgress();
  const imageUrl = await uploadImage(file);
  
  if (imageUrl) {
    currentImageData = imageUrl;
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'block';
    document.getElementById('previewImg').src = imageUrl;
    showToast('Image uploaded!', 'success');
  } else {
    document.getElementById('uploadPlaceholder').style.display = 'block';
    document.getElementById('uploadProgress').style.display = 'none';
  }
}

function removeImage(e) {
  e.stopPropagation();
  currentImageData = '';
  document.getElementById('uploadPlaceholder').style.display = 'block';
  document.getElementById('uploadProgress').style.display = 'none';
  document.getElementById('imagePreview').style.display = 'none';
  document.getElementById('slideImage').value = '';
}

// Audio Handling
async function handleAudioUpload(e) {
  const file = e.target.files[0];
  if (file) {
    showToast('Uploading audio...', 'success');
    const audioUrl = await uploadAudio(file);
    
    if (audioUrl) {
      settings.backgroundMusicUrl = audioUrl;
      document.getElementById('audioPreview').style.display = 'flex';
      document.getElementById('audioPlayer').src = audioUrl;
      showToast('Audio uploaded!', 'success');
    }
  }
}

function removeAudio() {
  settings.backgroundMusicUrl = '';
  document.getElementById('audioPreview').style.display = 'none';
  document.getElementById('audioPlayer').src = '';
  document.getElementById('bgMusic').value = '';
}

// Stats Handling
function renderStats(stats) {
  const container = document.getElementById('statsContainer');
  container.innerHTML = '';
  
  if (stats.length === 0) {
    addStatRow();
  } else {
    stats.forEach(stat => addStatRow(stat));
  }
}

function addStatRow(stat = null) {
  const container = document.getElementById('statsContainer');
  const row = document.createElement('div');
  row.className = 'stat-row';
  row.innerHTML = `
    <input type="text" class="stat-label" placeholder="Label (e.g., Days Together)" value="${stat?.label || ''}">
    <input type="text" class="stat-value" placeholder="Value (e.g., 365)" value="${stat?.value || ''}">
    <button type="button" class="remove-stat-btn" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(row);
}

function getStatsData() {
  const rows = document.querySelectorAll('.stat-row');
  const stats = [];
  rows.forEach(row => {
    const label = row.querySelector('.stat-label').value;
    const value = row.querySelector('.stat-value').value;
    if (label || value) {
      stats.push({ label, value });
    }
  });
  return stats;
}

// Drag and Drop
function initDragAndDrop() {
  const cards = document.querySelectorAll('.slide-card');
  
  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleCardDragOver);
    card.addEventListener('drop', handleCardDrop);
    card.addEventListener('dragleave', handleCardDragLeave);
  });
}

let draggedCard = null;

function handleDragStart(e) {
  draggedCard = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.slide-card').forEach(card => {
    card.classList.remove('drag-over');
  });
}

function handleCardDragOver(e) {
  e.preventDefault();
  if (this !== draggedCard) {
    this.classList.add('drag-over');
  }
}

function handleCardDragLeave() {
  this.classList.remove('drag-over');
}

function handleCardDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  
  if (this !== draggedCard) {
    const allCards = [...document.querySelectorAll('.slide-card')];
    const draggedIndex = allCards.indexOf(draggedCard);
    const dropIndex = allCards.indexOf(this);
    
    // Reorder slides array
    const [movedSlide] = slides.splice(draggedIndex, 1);
    slides.splice(dropIndex, 0, movedSlide);
    
    // Get new order of IDs
    const newOrder = slides.map(s => s._id);
    
    // Update UI
    renderSlides();
    
    // Save to server
    reorderSlides(newOrder);
  }
}

// Toast Notification
function showToast(message, type = 'success') {
  const toastEl = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');

  toastEl.className = `toast ${type}`;
  toastIcon.textContent = type === 'success' ? '✓' : '✕';
  toastMessage.textContent = message;

  toastEl.classList.add('show');

  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

// Make functions globally accessible
window.editSlide = editSlide;
window.showDeleteConfirm = showDeleteConfirm;
