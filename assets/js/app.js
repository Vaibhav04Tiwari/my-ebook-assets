// app.js - Object-Oriented Academic Portal with Navigation

// ==================== CONFIGURATION ====================
class Config {
  static AWS = {
    userPoolId: 'us-east-1_Oeh7iH12H',
    clientId: '5gfu0h940eejksp0ekuqi1s9lh',
    cognitoDomain: 'https://us-east-1oeh7ih12h.auth.us-east-1.amazoncognito.com'
  };
  
  static SOLUTION_FILE = {
    url: './assets/ISI_Book_Number_Theory_Solutions.pdf',
    filename: 'ISI_Book_Number_Theory_Solutions.pdf'
  };
  
  static EBOOK_FILE = {
    url: 'https://my-ebook-assets.s3.us-east-1.amazonaws.com/ISI_Book_Number_Theory.pdf'
  };
  
  // Production redirect URI - MUST match exactly what's in Cognito
  static REDIRECT_URI = 'https://my-ebook-assets.vercel.app';
}

// ==================== NAVIGATION MANAGER ====================
class NavigationManager {
  constructor() {
    this.sections = {
      'home': document.getElementById('main-book'),
      'author': document.getElementById('author-section'),
      'solutions': document.getElementById('solutions-section'),
      'terms': document.getElementById('terms-section')
    };
    this.heroSection = document.getElementById('home-section');
    this.currentSection = 'home';
  }
  
  init() {
    // Setup navigation links
    this.setupNavLinks();
    this.setupFooterLinks();
    
    // Show home section by default
    this.showSection('home');
  }
  
  setupNavLinks() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        if (section) {
          this.showSection(section);
          this.updateActiveLink(navLinks, link);
          
          // Smooth scroll to top
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      });
    });
  }
  
  setupFooterLinks() {
    const footerLinks = document.querySelectorAll('.footer-section a[data-section]');
    footerLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        if (section) {
          this.showSection(section);
          
          // Update header nav links
          const navLinks = document.querySelectorAll('.nav-link');
          navLinks.forEach(navLink => {
            if (navLink.getAttribute('data-section') === section) {
              this.updateActiveLink(navLinks, navLink);
            }
          });
          
          // Smooth scroll to top
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      });
    });
  }
  
  showSection(sectionName) {
    // Hide all sections
    Object.values(this.sections).forEach(section => {
      if (section) {
        section.style.display = 'none';
        section.classList.remove('active');
      }
    });
    
    // Show/hide hero section
    if (this.heroSection) {
      this.heroSection.style.display = sectionName === 'home' ? 'block' : 'none';
    }
    
    // Show selected section
    if (sectionName === 'home') {
      if (this.sections.home) {
        this.sections.home.style.display = 'flex';
      }
    } else {
      if (this.sections[sectionName]) {
        this.sections[sectionName].style.display = 'block';
        this.sections[sectionName].classList.add('active');
      }
    }
    
    this.currentSection = sectionName;
  }
  
  updateActiveLink(links, activeLink) {
    links.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
  }
}

// ==================== AUTHENTICATION MANAGER ====================
class AuthenticationManager {
  constructor(config) {
    this.config = config;
  }
  
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
  
  redirectToGoogleSignIn() {
    // Get the base URL - use root domain without trailing slash
    let currentUrl = window.location.origin;
    
    // If on a specific page (not root), include the path
    const path = window.location.pathname;
    if (path && path !== '/' && path !== '/index.html') {
      currentUrl += path;
    }
    
    const authUrl = `${this.config.cognitoDomain}/oauth2/authorize?` +
      `identity_provider=Google&` +
      `redirect_uri=${encodeURIComponent(currentUrl)}&` +
      `response_type=code&` +
      `client_id=${this.config.clientId}&` +
      `scope=openid%20email%20profile`;
    
    console.log('Redirect URI:', currentUrl);
    console.log('Full Auth URL:', authUrl);
    window.location.href = authUrl;
  }
  
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (!code) return false;
    
    console.log('Processing OAuth callback');
    return await this.exchangeCodeForTokens(code);
  }
  
  async exchangeCodeForTokens(code) {
    // Use same format as authorization
    let redirectUri = window.location.origin;
    
    const path = window.location.pathname;
    if (path && path !== '/' && path !== '/index.html') {
      redirectUri += path;
    }
    
    try {
      const response = await fetch(`${this.config.cognitoDomain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          code: code,
          redirect_uri: redirectUri
        })
      });
      
      const tokens = await response.json();
      
      if (tokens.access_token) {
        localStorage.setItem('accessToken', tokens.access_token);
        localStorage.setItem('idToken', tokens.id_token);
        
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('Authentication successful');
        return true;
      }
      
      console.error('Token exchange failed:', tokens);
      return false;
      
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }
  
  signOut() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('downloadIntent');
    console.log('User signed out');
  }
}

// ==================== PDF VIEWER MANAGER ====================
class PDFViewerManager {
  constructor(ebookUrl) {
    this.ebookUrl = ebookUrl;
    this.currentPage = 1;
    this.currentZoom = 100;
    this.iframe = null;
    this.container = null;
  }
  
  openEmbeddedViewer() {
    if (!this.ebookUrl) {
      alert('E-Book URL not configured. Please add your PDF URL.');
      return;
    }
    
    console.log('Opening E-Book in embedded viewer');
    
    const viewerHTML = `
      <div class="pdf-viewer-overlay" id="pdf-overlay">
        <div class="pdf-viewer-header">
          <div class="pdf-viewer-title">
            <span class="viewer-icon">📖</span>
            <span>Under the Banyan Tree - Decoding Numbers</span>
          </div>
          <div class="pdf-viewer-controls">
            <button id="zoom-out-btn" class="pdf-control-btn" title="Zoom Out">
              <span style="font-size: 20px; line-height: 1;">−</span>
            </button>
            <span id="zoom-level-display" class="zoom-display">100%</span>
            <button id="zoom-in-btn" class="pdf-control-btn" title="Zoom In">
              <span style="font-size: 20px; line-height: 1;">+</span>
            </button>
            <span class="control-divider">|</span>
            <button id="prev-page-btn" class="pdf-control-btn" title="Previous Page">
              <span>◄</span>
            </button>
            <input type="number" id="page-number-input" class="page-input" min="1" value="1">
            <button id="go-page-btn" class="pdf-control-btn" title="Go to Page">Go</button>
            <button id="next-page-btn" class="pdf-control-btn" title="Next Page">
              <span>►</span>
            </button>
          </div>
          <button class="pdf-viewer-close" id="close-viewer-btn">&times;</button>
        </div>
        <div class="pdf-viewer-container" id="pdf-container-main">
          <iframe 
            id="pdf-iframe-viewer"
            src="${this.ebookUrl}#page=1&zoom=100&toolbar=0&navpanes=0" 
            frameborder="0"
            allowfullscreen>
          </iframe>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', viewerHTML);
    document.body.style.overflow = 'hidden';
    
    // Get references
    this.iframe = document.getElementById('pdf-iframe-viewer');
    this.container = document.getElementById('pdf-container-main');
    
    this.setupControls();
  }
  
  setupControls() {
    const overlay = document.getElementById('pdf-overlay');
    const closeBtn = document.getElementById('close-viewer-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomDisplay = document.getElementById('zoom-level-display');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageInput = document.getElementById('page-number-input');
    const goPageBtn = document.getElementById('go-page-btn');
    
    // Close viewer
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      document.body.style.overflow = '';
    });
    
    // Zoom In
    zoomInBtn.addEventListener('click', () => {
      this.currentZoom += 10;
      if (this.currentZoom > 200) this.currentZoom = 200;
      this.applyZoom();
      zoomDisplay.textContent = this.currentZoom + '%';
      console.log('Zoom in:', this.currentZoom);
    });
    
    // Zoom Out
    zoomOutBtn.addEventListener('click', () => {
      this.currentZoom -= 10;
      if (this.currentZoom < 50) this.currentZoom = 50;
      this.applyZoom();
      zoomDisplay.textContent = this.currentZoom + '%';
      console.log('Zoom out:', this.currentZoom);
    });
    
    // Previous Page
    prevPageBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.goToPage(this.currentPage);
        pageInput.value = this.currentPage;
        console.log('Previous page:', this.currentPage);
      }
    });
    
    // Next Page
    nextPageBtn.addEventListener('click', () => {
      this.currentPage++;
      this.goToPage(this.currentPage);
      pageInput.value = this.currentPage;
      console.log('Next page:', this.currentPage);
    });
    
    // Go to Page
    goPageBtn.addEventListener('click', () => {
      const page = parseInt(pageInput.value);
      if (page && page > 0) {
        this.currentPage = page;
        this.goToPage(page);
        console.log('Go to page:', page);
      }
    });
    
    // Enter key on page input
    pageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        goPageBtn.click();
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!overlay || !overlay.parentNode) return;
      
      switch(e.key) {
        case 'Escape':
          closeBtn.click();
          break;
        case 'ArrowLeft':
          prevPageBtn.click();
          break;
        case 'ArrowRight':
          nextPageBtn.click();
          break;
        case '+':
        case '=':
          zoomInBtn.click();
          break;
        case '-':
          zoomOutBtn.click();
          break;
      }
    });
  }
  
  applyZoom() {
    if (!this.iframe) return;
    
    const scale = this.currentZoom / 100;
    this.iframe.style.transform = `scale(${scale})`;
    this.iframe.style.transformOrigin = 'top left';
    this.iframe.style.width = `${100 / scale}%`;
    this.iframe.style.height = `${100 / scale}%`;
  }
  
  goToPage(pageNumber) {
    if (!this.iframe) return;
    
    const baseUrl = this.ebookUrl.split('#')[0];
    const newUrl = `${baseUrl}#page=${pageNumber}&zoom=100&toolbar=0&navpanes=0`;
    this.iframe.src = newUrl;
  }
}

// ==================== DOWNLOAD MANAGER ====================
class DownloadManager {
  constructor(fileConfig) {
    this.fileConfig = fileConfig;
  }
  
  startDownload() {
    console.log('Starting file download');
    
    const link = document.createElement('a');
    link.href = this.fileConfig.url;
    link.download = this.fileConfig.filename;
    link.target = '_blank';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Download initiated');
  }
}

// ==================== UI MANAGER ====================
class UIManager {
  constructor() {
    this.modals = [];
  }
  
  showLoadingModal() {
    const modal = new LoadingModal();
    modal.show();
    this.modals.push(modal);
    return modal;
  }
  
  showSuccessNotification(title, message) {
    const notification = new SuccessNotification(title, message);
    notification.show();
  }
  
  showGoogleSignInModal(onSignInClick) {
    const modal = new GoogleSignInModal(onSignInClick);
    modal.show();
    this.modals.push(modal);
    return modal;
  }
  
  showErrorModal(message) {
    const modal = new ErrorModal(message);
    modal.show();
    this.modals.push(modal);
    return modal;
  }
  
  removeAllModals() {
    this.modals.forEach(modal => modal.remove());
    this.modals = [];
  }
}

// ==================== MODAL CLASSES ====================
class Modal {
  constructor() {
    this.element = null;
  }
  
  create(content, className = '') {
    this.element = document.createElement('div');
    this.element.className = `auth-modal ${className}`;
    this.element.innerHTML = content;
    document.body.appendChild(this.element);
    return this.element;
  }
  
  show() {
    if (this.element) {
      this.element.style.display = 'block';
    }
  }
  
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

class LoadingModal extends Modal {
  constructor() {
    super();
    const content = `
      <div class="auth-modal-content loading-content">
        <div class="loading-spinner"></div>
        <h3>Authenticating...</h3>
        <p>Verifying your credentials</p>
      </div>
    `;
    this.create(content);
  }
}

class ErrorModal extends Modal {
  constructor(message) {
    super();
    const content = `
      <div class="auth-modal-content error-content">
        <span class="modal-close">&times;</span>
        <div class="error-icon">⚠️</div>
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn btn--primary">OK</button>
      </div>
    `;
    this.create(content);
    this.attachListeners();
  }
  
  attachListeners() {
    const closeBtn = this.element.querySelector('.modal-close');
    const okBtn = this.element.querySelector('.btn');
    
    closeBtn.onclick = () => this.remove();
    okBtn.onclick = () => this.remove();
    this.element.onclick = (e) => {
      if (e.target === this.element) this.remove();
    };
  }
}

class SuccessNotification {
  constructor(title, message) {
    this.title = title;
    this.message = message;
    this.element = null;
  }
  
  show() {
    this.element = document.createElement('div');
    this.element.className = 'success-notification show';
    this.element.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">✓</span>
        <div class="notification-text">
          <h4>${this.title}</h4>
          <p>${this.message}</p>
        </div>
      </div>
    `;
    document.body.appendChild(this.element);
    
    setTimeout(() => {
      this.element.classList.add('fade-out');
      setTimeout(() => this.remove(), 300);
    }, 4000);
  }
  
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

class GoogleSignInModal extends Modal {
  constructor(onSignInClick) {
    super();
    this.onSignInClick = onSignInClick;
    const content = `
      <div class="auth-modal-content">
        <span class="modal-close">&times;</span>
        <h2>Sign In to Access E-Book</h2>
        <p>Please sign in with Google to read the textbook</p>
        
        <div class="auth-buttons">
          <button id="google-signin-btn" class="google-btn">
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
        
        <div id="auth-status" class="auth-status"></div>
      </div>
    `;
    this.create(content);
    this.attachListeners();
  }
  
  attachListeners() {
    const closeBtn = this.element.querySelector('.modal-close');
    const googleBtn = this.element.querySelector('#google-signin-btn');
    
    closeBtn.onclick = () => this.remove();
    googleBtn.onclick = () => {
      if (this.onSignInClick) {
        this.onSignInClick();
      }
    };
    
    this.element.onclick = (e) => {
      if (e.target === this.element) this.remove();
    };
  }
}

// ==================== PAGE COMPONENT ====================
class PageComponent {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
  }
  
  render(content) {
    if (this.element) {
      this.element.innerHTML = content;
    }
  }
}

class Header extends PageComponent {
  constructor() {
    super('site-header');
  }
  
  render() {
    const content = `
      <div class="header-content">
        <a href="#home" class="logo" data-section="home">
          <span class="logo-icon">📚</span>
          <span class="logo-text">Academic Portal</span>
        </a>
        <nav class="main-nav">
          <a href="#home" class="nav-link active" data-section="home">Home</a>
          <a href="#author" class="nav-link" data-section="author">Author</a>
          <a href="#solutions" class="nav-link" data-section="solutions">Solution Book</a>
        </nav>
      </div>
    `;
    super.render(content);
  }
}

class Footer extends PageComponent {
  constructor() {
    super('site-footer');
  }
  
  render() {
    const content = `
      <div class="footer-content">
        <div class="footer-section" style="max-width: 600px; margin: 0 auto; text-align: center;">
          <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">
            <a href="#terms" data-section="terms" style="color: #4CAF50; text-decoration: none; font-weight: 500;">Terms & Conditions</a>
          </p>
          <p style="font-size: 0.85rem; color: #ccc;">
            Contact: <a href="mailto:thebanyantreebook@gmail.com" style="color: #4CAF50; text-decoration: none;">thebanyantreebook@gmail.com</a>
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
      </div>
    `;
    super.render(content);
  }
}

class BookCard {
  constructor(posterElement, detailsElement) {
    this.posterElement = posterElement;
    this.detailsElement = detailsElement;
  }
  
  render() {
    // Wrap both elements in a card wrapper
    const cardMain = document.querySelector('.card-main');
    if (cardMain) {
      cardMain.innerHTML = `
        <div class="card-wrapper">
          <div id="poster-area" class="card-media"></div>
          <div id="details-area" class="card-details"></div>
        </div>
      `;
      
      // Re-get elements after creating wrapper
      this.posterElement = document.getElementById('poster-area');
      this.detailsElement = document.getElementById('details-area');
    }
    
    if (this.posterElement) {
      this.posterElement.innerHTML = `
        <img src="assets/banyan_tree_cover.jpg" 
             alt="Under the Banyan Tree - Decoding Numbers"
             onerror="this.src='https://via.placeholder.com/360x540/2f5d3f/ffffff?text=Decoding+Numbers'">
      `;
    }
    
    if (this.detailsElement) {
      this.detailsElement.innerHTML = `
        <div>
          <h2>Under the Banyan Tree
            <span>Decoding Numbers</span>
          </h2>
          <div class="meta-data">Author: Sumit Gupta | Pages: 450+ | Subject: Mathematics</div>
          <p>
            This comprehensive textbook provides an in-depth exploration of number theory concepts, 
            specifically designed for ISI entrance examination preparation. It covers fundamental 
            principles, advanced problem-solving techniques, and includes detailed solutions to help 
            students master complex mathematical concepts.
          </p>
        </div>
        <div class="actions">
          <button id="access-ebook-btn" class="btn btn--secondary">
            <span class="btn-icon">📖</span>
            <span>Access E-Book</span>
          </button>
          <button id="solutions-btn" class="btn btn--primary">
            <span class="btn-icon">📥</span>
            <span>Solutions</span>
          </button>
        </div>
      `;
    }
  }
}

// ==================== MAIN APPLICATION ====================
class AcademicPortalApp {
  constructor() {
    this.authManager = new AuthenticationManager(Config.AWS);
    this.downloadManager = new DownloadManager(Config.SOLUTION_FILE);
    this.pdfViewerManager = new PDFViewerManager(Config.EBOOK_FILE.url);
    this.uiManager = new UIManager();
    this.navigationManager = new NavigationManager();
    this.downloadIntent = false;
  }
  
  async init() {
    console.log('Initializing Academic Portal');
    
    // Render UI components
    this.renderComponents();
    
    // Initialize navigation
    this.navigationManager.init();
    
    // Handle OAuth callback
    const authSuccess = await this.authManager.handleCallback();
    
    if (authSuccess) {
      this.uiManager.removeAllModals();
      
      // Check if user intended to access ebook
      const downloadIntent = localStorage.getItem('downloadIntent');
      if (downloadIntent === 'ebook') {
        localStorage.removeItem('downloadIntent');
        this.openEbookViewer();
      } else if (downloadIntent === 'solutions') {
        // Legacy support if any
        localStorage.removeItem('downloadIntent');
        this.handleSuccessfulDownload();
      }
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Academic Portal Ready');
  }
  
  renderComponents() {
    const header = new Header();
    header.render();
    
    const footer = new Footer();
    footer.render();
    
    const bookCard = new BookCard(
      document.getElementById('poster-area'),
      document.getElementById('details-area')
    );
    bookCard.render();
  }
  
  setupEventListeners() {
    setTimeout(() => {
      const accessBtn = document.getElementById('access-ebook-btn');
      const solutionsBtn = document.getElementById('solutions-btn');
      const solutionsBtn2 = document.getElementById('solutions-btn-2');
      
      if (accessBtn) {
        accessBtn.addEventListener('click', () => this.handleAccessEbook());
      }
      
      if (solutionsBtn) {
        solutionsBtn.addEventListener('click', () => this.handleSolutionsClick());
      }
      
      if (solutionsBtn2) {
        solutionsBtn2.addEventListener('click', () => this.handleSolutionsClick());
      }
      
      // Logo click handler
      const logo = document.querySelector('.logo');
      if (logo) {
        logo.addEventListener('click', (e) => {
          e.preventDefault();
          this.navigationManager.showSection('home');
          const navLinks = document.querySelectorAll('.nav-link');
          navLinks.forEach(link => {
            if (link.getAttribute('data-section') === 'home') {
              this.navigationManager.updateActiveLink(navLinks, link);
            }
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }, 300);
  }
  
  handleAccessEbook() {
    console.log('Access E-Book clicked - Checking authentication');
    
    if (this.authManager.isAuthenticated()) {
      // User is authenticated - open ebook immediately
      this.openEbookViewer();
    } else {
      // Show Google Sign-In modal
      this.uiManager.showGoogleSignInModal(() => {
        // Store intent and redirect to Google
        localStorage.setItem('downloadIntent', 'ebook');
        this.authManager.redirectToGoogleSignIn();
      });
    }
  }
  
  openEbookViewer() {
    console.log('Opening E-Book in embedded viewer');
    this.pdfViewerManager.openEmbeddedViewer();
  }
  
  handleSolutionsClick() {
    console.log('Solutions button clicked - Direct download');
    // Direct download without authentication
    this.handleSuccessfulDownload();
  }
  
  handleSuccessfulDownload() {
    this.uiManager.showSuccessNotification(
      'Download Started!',
      'Your solution file is downloading now'
    );
    
    setTimeout(() => {
      this.downloadManager.startDownload();
    }, 500);
  }
}

// ==================== APPLICATION ENTRY POINT ====================
document.addEventListener('DOMContentLoaded', () => {
  const app = new AcademicPortalApp();
  app.init();
});