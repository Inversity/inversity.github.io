/**
 * ShareX Gallery Worker
 * Serves a public gallery for R2 bucket uploads
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle root path - show gallery
    if (path === '/' || path === '') {
      return await handleGallery(env.BUCKET);
    }

    // Handle DELETE requests
    if (method === 'DELETE') {
      return await handleDelete(env.BUCKET, path);
    }

    // Handle file requests - serve from R2
    return await handleFile(env.BUCKET, path);
  }
};

/**
 * Lists all objects in R2 bucket and renders gallery HTML
 */
async function handleGallery(bucket) {
  try {
    // List all objects in the bucket
    const listed = await bucket.list();
    const objects = listed.objects || [];

    // Sort by uploaded date, newest first
    objects.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());

    // Categorize files by type
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

    const images = objects.filter(obj =>
      imageExtensions.some(ext => obj.key.toLowerCase().endsWith(ext))
    );

    const videos = objects.filter(obj =>
      videoExtensions.some(ext => obj.key.toLowerCase().endsWith(ext))
    );

    const otherFiles = objects.filter(obj =>
      !imageExtensions.some(ext => obj.key.toLowerCase().endsWith(ext)) &&
      !videoExtensions.some(ext => obj.key.toLowerCase().endsWith(ext))
    );

    // Generate HTML
    const html = generateGalleryHTML(images, videos, otherFiles);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    return new Response(`Error loading gallery: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Serves a file from R2 bucket
 */
async function handleFile(bucket, path) {
  // Remove leading slash
  const key = path.substring(1);

  try {
    const object = await bucket.get(key);

    if (!object) {
      return new Response('File not found', { status: 404 });
    }

    // Set appropriate headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    return new Response(object.body, { headers });
  } catch (error) {
    return new Response(`Error retrieving file: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Deletes a file from R2 bucket
 */
async function handleDelete(bucket, path) {
  // Remove leading slash
  const key = path.substring(1);

  try {
    await bucket.delete(key);

    return new Response(JSON.stringify({ success: true, message: 'File deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Generates the gallery HTML with midnight theme styling
 */
function generateGalleryHTML(images, videos, otherFiles) {
  const imageCards = images.map(obj => {
    const url = `/${obj.key}`;
    const date = new Date(obj.uploaded).toLocaleDateString();
    const size = formatFileSize(obj.size);

    return `
      <div class="masonry-item">
        <a href="${url}" target="_blank">
          <img src="${url}" alt="${obj.key}" loading="lazy">
        </a>
        <div class="item-info">
          <div class="item-name" title="${obj.key}">${obj.key}</div>
          <div class="item-meta">${date} • ${size}</div>
          <div class="item-actions">
            <button class="copy-btn" onclick="copyToClipboard('https://sharex.inversity.dev${url}')">
              📋 Copy URL
            </button>
            <button class="delete-btn" onclick="deleteFile('${url}', '${obj.key}')">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const videoCards = videos.map(obj => {
    const url = `/${obj.key}`;
    const date = new Date(obj.uploaded).toLocaleDateString();
    const size = formatFileSize(obj.size);

    return `
      <div class="masonry-item">
        <video controls preload="metadata" onclick="this.paused ? this.play() : this.pause()">
          <source src="${url}" type="video/${obj.key.split('.').pop()}">
          Your browser does not support the video tag.
        </video>
        <div class="item-info">
          <div class="item-name" title="${obj.key}">${obj.key}</div>
          <div class="item-meta">${date} • ${size}</div>
          <div class="item-actions">
            <button class="copy-btn" onclick="copyToClipboard('https://sharex.inversity.dev${url}')">
              📋 Copy URL
            </button>
            <button class="delete-btn" onclick="deleteFile('${url}', '${obj.key}')">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const fileCards = otherFiles.map(obj => {
    const url = `/${obj.key}`;
    const date = new Date(obj.uploaded).toLocaleDateString();
    const size = formatFileSize(obj.size);
    const icon = getFileIcon(obj.key);

    return `
      <div class="file-item">
        <a href="${url}" target="_blank" class="file-link">
          <span class="file-icon">${icon}</span>
          <div class="file-details">
            <div class="file-name" title="${obj.key}">${obj.key}</div>
            <div class="file-meta">${date} • ${size}</div>
          </div>
        </a>
        <div class="file-actions">
          <button class="copy-btn" onclick="copyToClipboard('https://sharex.inversity.dev${url}')">
            📋
          </button>
          <button class="delete-btn" onclick="deleteFile('${url}', '${obj.key}')">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ShareX Gallery - inversity.dev</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(to bottom, #0d0d0d 0%, #1a1a1a 100%);
      color: #e0e0e0;
      min-height: 100vh;
      padding: 2rem 1rem;
    }

    .container {
      max-width: 1600px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #333;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #ff6b6b, #8b0000);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      color: #888;
      font-size: 1.1rem;
    }

    .stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .stat {
      background: rgba(139, 0, 0, 0.2);
      padding: 0.5rem 1.5rem;
      border-radius: 8px;
      border: 1px solid rgba(139, 0, 0, 0.3);
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: bold;
      color: #ff6b6b;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #888;
    }

    /* Masonry gallery for images */
    .masonry-gallery {
      column-count: 4;
      column-gap: 1.2em;
      padding: 1em 0;
      margin-bottom: 3rem;
    }

    .masonry-item {
      break-inside: avoid;
      margin-bottom: 1.2em;
      position: relative;
      overflow: hidden;
      border-radius: 8px;
      background: #222;
      transition: transform 0.3s ease;
    }

    .masonry-item:hover {
      transform: translateY(-5px);
    }

    .masonry-item img,
    .masonry-item video {
      width: 100%;
      display: block;
      border-radius: 8px 8px 0 0;
      box-shadow: 0 4px 15px rgba(139, 0, 0, 0.4);
      cursor: pointer;
      transition: all 0.4s ease;
    }

    .masonry-item:hover img,
    .masonry-item:hover video {
      box-shadow: 0 8px 30px rgba(139, 0, 0, 0.7);
    }

    .item-info {
      padding: 0.8rem;
      background: #1a1a1a;
      border-radius: 0 0 8px 8px;
    }

    .item-name {
      font-size: 0.85rem;
      color: #e0e0e0;
      margin-bottom: 0.3rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-meta {
      font-size: 0.75rem;
      color: #888;
      margin-bottom: 0.5rem;
    }

    /* Other files section */
    .section-title {
      font-size: 1.5rem;
      margin: 2rem 0 1rem 0;
      color: #ff6b6b;
      border-bottom: 2px solid #333;
      padding-bottom: 0.5rem;
    }

    .files-list {
      display: grid;
      gap: 0.8rem;
      margin-bottom: 2rem;
    }

    .file-item {
      background: #222;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.3s ease;
    }

    .file-item:hover {
      border-color: rgba(139, 0, 0, 0.5);
      background: #2a2a2a;
      transform: translateX(5px);
    }

    .file-link {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
      text-decoration: none;
      color: inherit;
    }

    .file-icon {
      font-size: 2rem;
    }

    .file-details {
      flex: 1;
    }

    .file-name {
      color: #e0e0e0;
      margin-bottom: 0.3rem;
      word-break: break-all;
    }

    .file-meta {
      font-size: 0.85rem;
      color: #888;
    }

    .item-actions,
    .file-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .copy-btn,
    .delete-btn {
      background: rgba(139, 0, 0, 0.3);
      border: 1px solid rgba(139, 0, 0, 0.5);
      color: #ff6b6b;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.3s ease;
      white-space: nowrap;
      flex: 1;
    }

    .copy-btn:hover,
    .delete-btn:hover {
      background: rgba(139, 0, 0, 0.5);
      border-color: rgba(139, 0, 0, 0.8);
      transform: scale(1.05);
    }

    .copy-btn:active,
    .delete-btn:active {
      transform: scale(0.95);
    }

    .delete-btn {
      background: rgba(139, 0, 0, 0.2);
    }

    .delete-btn:hover {
      background: rgba(139, 0, 0, 0.6);
      color: #ff4444;
    }

    /* Responsive breakpoints */
    @media (max-width: 1400px) {
      .masonry-gallery {
        column-count: 3;
      }
    }

    @media (max-width: 900px) {
      .masonry-gallery {
        column-count: 2;
      }

      h1 {
        font-size: 2rem;
      }
    }

    @media (max-width: 600px) {
      .masonry-gallery {
        column-count: 1;
      }

      h1 {
        font-size: 1.5rem;
      }

      .stats {
        gap: 1rem;
      }

      body {
        padding: 1rem 0.5rem;
      }
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #666;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    footer {
      text-align: center;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 2px solid #333;
      color: #666;
      font-size: 0.9rem;
    }

    footer a {
      color: #ff6b6b;
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>ShareX Gallery</h1>
      <p class="subtitle">sharex.inversity.dev</p>
      <div class="stats">
        <div class="stat">
          <div class="stat-number">${images.length}</div>
          <div class="stat-label">Images</div>
        </div>
        <div class="stat">
          <div class="stat-number">${videos.length}</div>
          <div class="stat-label">Videos</div>
        </div>
        <div class="stat">
          <div class="stat-number">${otherFiles.length}</div>
          <div class="stat-label">Other Files</div>
        </div>
        <div class="stat">
          <div class="stat-number">${images.length + videos.length + otherFiles.length}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>
    </header>

    ${images.length > 0 ? `
      <h2 class="section-title">Images</h2>
      <div class="masonry-gallery">
        ${imageCards}
      </div>
    ` : ''}

    ${videos.length > 0 ? `
      <h2 class="section-title">Videos</h2>
      <div class="masonry-gallery">
        ${videoCards}
      </div>
    ` : ''}

    ${images.length === 0 && videos.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">📷</div>
        <h2>No media yet</h2>
        <p>Upload some screenshots or videos with ShareX to get started!</p>
      </div>
    ` : ''}

    ${otherFiles.length > 0 ? `
      <h2 class="section-title">Other Files</h2>
      <div class="files-list">
        ${fileCards}
      </div>
    ` : ''}

    <footer>
      <p>Powered by <a href="https://workers.cloudflare.com/" target="_blank">Cloudflare Workers</a> + <a href="https://www.cloudflare.com/products/r2/" target="_blank">R2</a></p>
      <p><a href="https://inversity.dev/">inversity.dev</a></p>
    </footer>
  </div>

  <script>
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.style.background = 'rgba(0, 139, 0, 0.3)';
        btn.style.borderColor = 'rgba(0, 139, 0, 0.5)';
        btn.style.color = '#90EE90';

        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy URL');
      });
    }

    async function deleteFile(url, filename) {
      if (!confirm(\`Are you sure you want to delete "${filename}"?\nThis action cannot be undone.\`)) {
        return;
      }

      const btn = event.target;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Deleting...';

      try {
        const response = await fetch(url, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          btn.textContent = '✓ Deleted!';
          btn.style.background = 'rgba(0, 139, 0, 0.3)';
          btn.style.borderColor = 'rgba(0, 139, 0, 0.5)';
          btn.style.color = '#90EE90';

          // Reload the page after a brief delay
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          throw new Error(result.message || 'Delete failed');
        }
      } catch (err) {
        console.error('Failed to delete:', err);
        alert(\`Failed to delete file: \${err.message}\`);
        btn.textContent = originalText;
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Returns an emoji icon based on file extension
 */
function getFileIcon(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const icons = {
    'pdf': '📄',
    'doc': '📝',
    'docx': '📝',
    'txt': '📄',
    'zip': '🗜️',
    'rar': '🗜️',
    '7z': '🗜️',
    'mp4': '🎬',
    'mov': '🎬',
    'avi': '🎬',
    'mp3': '🎵',
    'wav': '🎵',
    'json': '📋',
    'xml': '📋',
    'csv': '📊',
    'exe': '⚙️',
    'app': '⚙️'
  };
  return icons[ext] || '📎';
}
