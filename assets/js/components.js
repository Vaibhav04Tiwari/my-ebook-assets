// Reusable components (OOP) for pages.
// Export: Book, WebPage, Header, Footer
export class Book {
  constructor({ title, subtitle = '', author = '', pages = '', coverImage = '', pdfPath = '', description = '' } = {}) {
    this.title = title;
    this.subtitle = subtitle;
    this.author = author;
    this.pages = pages;
    this.coverImage = coverImage;
    this.pdfPath = pdfPath;
    this.description = description;
  }
}

export class Header {
  constructor(root = document.getElementById('site-header')) {
    this.root = root;
  }
  mount() {
    if (!this.root) return;
    this.root.innerHTML = `
      <div class="container" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:44px;height:44px;border-radius:8px;background:linear-gradient(135deg,#86b097,#a39baa)"></div>
          <div style="font-weight:700">${document.title.split(' - ')[0] || 'E-Book Portal'}</div>
        </div>
        <nav aria-label="Main">
          <a href="index.html" style="color:var(--muted-text);text-decoration:none;margin-right:16px">Home</a>
          <a href="book-solutions.html" style="color:var(--muted-text);text-decoration:none">Solutions</a>
        </nav>
      </div>
    `;
  }
  destroy(){ if (this.root) this.root.innerHTML = ''; }
}

export class Footer {
  constructor(root = document.getElementById('site-footer')){ this.root = root; }
  mount(text){ if (!this.root) return; this.root.innerHTML = `<div class="container">${text || '© ' + new Date().getFullYear() + ' My E-Book Assets'}</div>`; }
  destroy(){ if (this.root) this.root.innerHTML = ''; }
}

/* WebPage: renders book UI into #poster-area and #details-area.
   Options:
     - readMode: 'viewer' | 'direct' — viewer uses Google Docs viewer for public URLs
*/
export class WebPage {
  constructor(book, options = {}) {
    this.book = book;
    this.options = Object.assign({ readMode: 'viewer' }, options);
    this.containerPoster = document.getElementById('poster-area');
    this.containerDetails = document.getElementById('details-area');
    this.actionsEl = null;
  }

  render() {
    if (!this.containerPoster || !this.containerDetails) {
      console.error('Missing required DOM elements (#poster-area or #details-area).');
      return;
    }

    // Poster
    this.containerPoster.innerHTML = '';
    const img = document.createElement('img');
    img.src = this.book.coverImage || '';
    img.alt = `Cover of ${this.book.title}`;
    img.loading = 'lazy';
    this.containerPoster.appendChild(img);

    // Details content
    this.containerDetails.innerHTML = '';
    const titleEl = document.createElement('div');
    titleEl.innerHTML = `
      <h2 id="book-title">${this.book.title || ''} <span>${this.book.subtitle || ''}</span></h2>
      <div class="meta-data">Authored by: ${this.book.author || '—'}<br>Pages: ${this.book.pages || '—'}</div>
      <p>${this.book.description || ''}</p>
    `;
    this.containerDetails.appendChild(titleEl);

    // Actions (buttons)
    this.actionsEl = document.createElement('div');
    this.actionsEl.className = 'actions';

    // Read button
    if (this.options.readMode === 'viewer') {
      const readBtn = document.createElement('button');
      readBtn.className = 'btn btn--primary';
      readBtn.textContent = 'ACCESS E-BOOK // READ ONLINE';
      readBtn.addEventListener('click', (e) => this.openReader(e));
      this.actionsEl.appendChild(readBtn);
    } else {
      // direct download link
      const readLink = document.createElement('a');
      readLink.className = 'btn btn--primary';
      readLink.href = this.book.pdfPath || '#';
      readLink.target = '_blank';
      readLink.rel = 'noopener';
      readLink.textContent = 'VIEW / DOWNLOAD';
      this.actionsEl.appendChild(readLink);
    }

    // Secondary link (solutions or back) — the page instantiation decides URL
    const secondaryLink = document.createElement('a');
    secondaryLink.className = 'btn btn--secondary';
    secondaryLink.href = this.options.secondaryHref || 'book-solutions.html';
    secondaryLink.textContent = this.options.secondaryLabel || 'VIEW SOLUTIONS 💡';
    this.actionsEl.appendChild(secondaryLink);

    this.containerDetails.appendChild(this.actionsEl);
  }

  openReader() {
    const pdfUrl = this.book.pdfPath || '';
    if (!pdfUrl) {
      alert('No PDF specified for this book.');
      return;
    }
    // If it's an HTTP(S) URL, use Google Docs viewer. Otherwise open directly.
    if (pdfUrl.startsWith('http')) {
      const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      window.open(viewerUrl, 'ProtectedReader', 'width=1000,height=800,scrollbars=yes,menubar=no,toolbar=no,location=no');
    } else {
      // local/relative files: fallback to direct open (browser will offer download)
      window.open(pdfUrl, '_blank', 'noopener');
    }
  }
}