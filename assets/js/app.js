// app.js - Academic Portal with Google Authentication & Silent Download
// Version: 5.0 - Smooth UX with Background Download

// ==================== CONFIGURATION ====================
class Config {
  static AWS = {
    userPoolId: 'ap-south-1_PWJLMbCii',
    clientId: '4nt4gl74g0d0i4qlfodp2poq3g',
    cognitoDomain: 'https://ap-south-1pwjlmbcii.auth.ap-south-1.amazoncognito.com'
  };
  
  static SOLUTION_LINK = 'https://www.amazon.in/dp/B0G2B378HH';
  
  static EBOOK_FILE = {
    url: 'https://my-ebook-assets.s3.us-east-1.amazonaws.com/ISI_Book_Number_Theory.pdf',
    filename: 'Under_the_Banyan_Tree_Number_Theory.pdf'
  };
  
  static REDIRECT_URI = window.location.origin;
  static COACHING_PAGE_URL = 'course.html';
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
    this.setupNavLinks();
    this.setupFooterLinks();
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
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
          const navLinks = document.querySelectorAll('.nav-link');
          navLinks.forEach(navLink => {
            if (navLink.getAttribute('data-section') === section) {
              this.updateActiveLink(navLinks, navLink);
            }
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }
  
  showSection(sectionName) {
    Object.values(this.sections).forEach(section => {
      if (section) {
        section.style.display = 'none';
        section.classList.remove('active');
      }
    });
    
    if (this.heroSection) {
      this.heroSection.style.display = sectionName === 'home' ? 'block' : 'none';
    }
    
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
    const token = localStorage.getItem('accessToken');
    return !!token;
  }
  
  redirectToGoogleSignIn() {
    const redirectUri = Config.REDIRECT_URI;
    
    const params = new URLSearchParams({
      identity_provider: 'Google',
      redirect_uri: redirectUri,
      response_type: 'code',
      client_id: this.config.clientId,
      scope: 'openid email profile'
    });
    
    const authUrl = `${this.config.cognitoDomain}/oauth2/authorize?${params.toString()}`;
    
    console.log('🔐 Starting Google OAuth Flow');
    
    // Set flag that user wants to download ebook
    localStorage.setItem('downloadIntent', 'ebook');
    
    window.location.href = authUrl;
  }
  
  async handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('❌ OAuth Error:', error);
      localStorage.removeItem('downloadIntent');
      return false;
    }
    
    if (!code) return false;
    
    console.log('✅ OAuth code received, exchanging for tokens...');
    return await this.exchangeCodeForTokens(code);
  }
  
  async exchangeCodeForTokens(code) {
    const redirectUri = Config.REDIRECT_URI;
    
    try {
      console.log('🔄 Exchanging code for tokens...');
      
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
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Token exchange failed:', response.status);
        localStorage.removeItem('downloadIntent');
        return false;
      }
      
      if (responseData.access_token) {
        localStorage.setItem('accessToken', responseData.access_token);
        localStorage.setItem('idToken', responseData.id_token);
        
        // Clean URL by removing OAuth parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('✅ Authentication successful!');
        return true;
      }
      
      console.error('❌ No access token in response');
      localStorage.removeItem('downloadIntent');
      return false;
      
    } catch (error) {
      console.error('❌ Token exchange error:', error);
      localStorage.removeItem('downloadIntent');
      return false;
    }
  }
  
  signOut() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('downloadIntent');
    console.log('👋 User signed out');
  }
}

// ==================== DOWNLOAD MANAGER ====================
class DownloadManager {
  constructor(fileConfig) {
    this.fileConfig = fileConfig;
  }
  
  async startDownload() {
    console.log('📥 Starting silent background download:', this.fileConfig.filename);
    
    try {
      // Fetch the file
      console.log('🔄 Fetching PDF from:', this.fileConfig.url);
      const response = await fetch(this.fileConfig.url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('✅ Blob created, size:', blob.size);
      
      // Create download link
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = this.fileConfig.filename;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      console.log('🖱️ Triggering download...');
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        console.log('🧹 Cleanup completed');
      }, 100);
      
      console.log('✅ Silent download initiated successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Fetch failed, trying direct link method:', error);
      
      // Fallback: Use direct link with download attribute
      const link = document.createElement('a');
      link.href = this.fileConfig.url;
      link.download = this.fileConfig.filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      console.log('✅ Fallback download method executed');
      return true;
    }
  }
}

// ==================== UI MANAGER ====================
class UIManager {
  constructor() {
    this.modals = [];
  }
  
  showDownloadingNotification() {
    const notification = new DownloadingNotification();
    notification.show();
    return notification;
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

class DownloadingNotification {
  constructor() {
    this.element = null;
  }
  
  show() {
    this.element = document.createElement('div');
    this.element.className = 'downloading-notification';
    this.element.innerHTML = `
      <div class="notification-content">
        <div class="download-spinner"></div>
        <div class="notification-text">
          <h4>📥 Downloading Your E-Book</h4>
          <p>Your download will start shortly...</p>
        </div>
      </div>
    `;
    document.body.appendChild(this.element);
    
    // Add styles dynamically
    if (!document.getElementById('download-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'download-notification-styles';
      style.textContent = `
        .downloading-notification {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 2rem 3rem;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          z-index: 10001;
          animation: fadeInScale 0.3s ease;
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        .downloading-notification .notification-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .download-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2f5d3f;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .downloading-notification h4 {
          color: #1f2937;
          margin-bottom: 0.3rem;
          font-size: 1.1rem;
        }
        
        .downloading-notification p {
          color: #6b7280;
          margin: 0;
          font-size: 0.9rem;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  remove() {
    if (this.element && this.element.parentNode) {
      this.element.style.opacity = '0';
      this.element.style.transform = 'translate(-50%, -50%) scale(0.9)';
      this.element.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
      }, 300);
    }
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
    }, 3000);
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
        <h2>Sign In to Download E-Book</h2>
        <p>Please sign in with Google to download the textbook</p>
        
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
        <div class="footer-section">
          <p style="font-size: 0.9rem;">
            <a href="#terms" data-section="terms" style="color: #a7d5ba; text-decoration: none; font-weight: 500;">Terms & Conditions</a>
          </p>
        </div>
        <div class="footer-section">
          <p style="font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>📧</span>
            <a href="mailto:thebanyantreebook@gmail.com" style="color: #a7d5ba; text-decoration: none;">thebanyantreebook@gmail.com</a>
          </p>
        </div>
        <div class="footer-section">
          <p style="font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.2rem;">🎥</span>
            <a href="https://www.youtube.com/@TheBanyanTreeCoaching" target="_blank" rel="noopener noreferrer" style="color: #a7d5ba; text-decoration: none;">YouTube Channel</a>
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
    const cardMain = document.querySelector('.card-main');
    if (cardMain) {
      cardMain.innerHTML = `
        <div class="card-wrapper">
          <div id="poster-area" class="card-media"></div>
          <div id="details-area" class="card-details"></div>
        </div>
      `;
      
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
            <span class="btn-icon">📥</span>
            <span>Download E-Book</span>
          </button>
          <button id="solutions-btn" class="btn btn--primary">
            <span class="btn-icon">🛒</span>
            <span>Buy Solutions on Amazon</span>
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
    this.ebookDownloadManager = new DownloadManager(Config.EBOOK_FILE);
    this.uiManager = new UIManager();
    this.navigationManager = new NavigationManager();
  }
  
  async init() {
    console.log('🚀 Initializing Academic Portal');
    
    this.renderComponents();
    this.navigationManager.init();
    
    // Check if user just returned from Google OAuth
    const authSuccess = await this.authManager.handleCallback();
    
    if (authSuccess) {
      console.log('✅ User authenticated successfully');
      this.uiManager.removeAllModals();
      
      // Check if user wanted to download ebook
      const downloadIntent = localStorage.getItem('downloadIntent');
      if (downloadIntent === 'ebook') {
        console.log('📥 Download intent detected - starting process...');
        localStorage.removeItem('downloadIntent');
        
        // Trigger download and redirect immediately
        await this.downloadEbookAndRedirect();
        
        return; // Don't setup event listeners since we're redirecting
      }
    }
    
    this.setupEventListeners();
    
    console.log('✅ Academic Portal Ready');
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
        console.log('✅ Download E-Book button found');
        accessBtn.addEventListener('click', () => this.handleEbookClick());
      }
      
      if (solutionsBtn) {
        solutionsBtn.addEventListener('click', () => this.handleSolutionsClick());
      }
      
      if (solutionsBtn2) {
        solutionsBtn2.addEventListener('click', () => this.handleSolutionsClick());
      }
      
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
  
  handleEbookClick() {
    console.log('📥 Download E-Book button clicked');
    
    const isAuth = this.authManager.isAuthenticated();
    console.log('🔐 Is Authenticated?', isAuth);
    
    if (isAuth) {
      console.log('✅ User already authenticated - Starting download');
      this.downloadEbookAndRedirect();
    } else {
      console.log('❌ User NOT authenticated - Showing sign-in modal');
      this.uiManager.showGoogleSignInModal(() => {
        console.log('🔄 User clicked Sign in with Google');
        this.authManager.redirectToGoogleSignIn();
      });
    }
  }
  
  async downloadEbookAndRedirect() {
    console.log('📥 ========== DOWNLOAD & REDIRECT START ==========');
    
    // Show downloading notification
    const notification = this.uiManager.showDownloadingNotification();
    
    try {
      // Start download silently in background
      console.log('📥 Starting background download...');
      await this.ebookDownloadManager.startDownload();
      console.log('✅ Download triggered successfully');
      
      // Wait a bit for download to initiate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove notification
      notification.remove();
      
      // Show success message briefly
      this.uiManager.showSuccessNotification(
        '✅ Download Started!',
        'Check your downloads folder'
      );
      
      // Wait a bit before redirect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to course page
      console.log('🚀 Redirecting to course page...');
      window.location.href = Config.COACHING_PAGE_URL;
      
    } catch (error) {
      console.error('❌ Error in download/redirect process:', error);
      
      // Remove notification
      notification.remove();
      
      // Still redirect even if download fails
      this.uiManager.showSuccessNotification(
        '📚 Preparing E-Book',
        'Redirecting to course page...'
      );
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      window.location.href = Config.COACHING_PAGE_URL;
    }
  }
  
  handleSolutionsClick() {
    console.log('🛒 Redirecting to Amazon for Solutions');
    window.open(Config.SOLUTION_LINK, '_blank');
  }
}

// ==================== APPLICATION ENTRY POINT ====================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎬 DOM Content Loaded - Starting app');
  const app = new AcademicPortalApp();
  app.init();
});