// Reusable components (OOP) for pages.
// Export: Book, WebPage, Header, Footer, AuthModal
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

/* AuthModal: handles sign in/sign up UI */
export class AuthModal {
  constructor(authManager) {
    this.authManager = authManager;
    this.overlay = null;
    this.currentMode = 'signin';
    this.tempEmail = '';
    this.onAuthSuccess = null;
  }

  show(mode = 'signin', onSuccess) {
    this.currentMode = mode;
    this.onAuthSuccess = onSuccess;
    this.render();
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  hide() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
      }, 300);
    }
  }

  render() {
    const existing = document.querySelector('.auth-modal-overlay');
    if (existing) existing.remove();

    this.overlay = document.createElement('div');
    this.overlay.className = 'auth-modal-overlay';
    
    this.overlay.innerHTML = `
      <div class="auth-modal">
        <button class="auth-modal-close">&times;</button>
        <div id="auth-content"></div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    this.overlay.querySelector('.auth-modal-close').addEventListener('click', () => this.hide());

    this.renderContent();
  }

  renderContent() {
    const content = this.overlay.querySelector('#auth-content');
    
    if (this.currentMode === 'signin') {
      content.innerHTML = this.getSignInHTML();
      this.attachSignInHandlers();
    } else if (this.currentMode === 'signup') {
      content.innerHTML = this.getSignUpHTML();
      this.attachSignUpHandlers();
    } else if (this.currentMode === 'verify') {
      content.innerHTML = this.getVerifyHTML();
      this.attachVerifyHandlers();
    } else if (this.currentMode === 'forgot') {
      content.innerHTML = this.getForgotPasswordHTML();
      this.attachForgotPasswordHandlers();
    }
  }

  getSignInHTML() {
    return `
      <h2>Welcome Back</h2>
      <p>Sign in to access premium content</p>
      <div class="auth-error" id="auth-error"></div>
      <form class="auth-form" id="signin-form">
        <div class="form-group">
          <label for="signin-email">Email</label>
          <input type="email" id="signin-email" required placeholder="your@email.com">
        </div>
        <div class="form-group">
          <label for="signin-password">Password</label>
          <input type="password" id="signin-password" required placeholder="••••••••">
        </div>
        <div class="forgot-password-link">
          <a id="forgot-link">Forgot password?</a>
        </div>
        <button type="submit" class="auth-submit-btn">Sign In</button>
      </form>
      <div class="auth-toggle">
        Don't have an account? <a id="toggle-signup">Sign up</a>
      </div>
    `;
  }

  getSignUpHTML() {
    return `
      <h2>Create Account</h2>
      <p>Join us to access exclusive content</p>
      <div class="auth-error" id="auth-error"></div>
      <form class="auth-form" id="signup-form">
        <div class="form-group">
          <label for="signup-name">Full Name</label>
          <input type="text" id="signup-name" required placeholder="John Doe">
        </div>
        <div class="form-group">
          <label for="signup-email">Email</label>
          <input type="email" id="signup-email" required placeholder="your@email.com">
        </div>
        <div class="form-group">
          <label for="signup-password">Password</label>
          <input type="password" id="signup-password" required placeholder="••••••••" minlength="8">
          <small style="color:var(--muted-text);font-size:0.85rem">Minimum 8 characters, include uppercase, lowercase, and numbers</small>
        </div>
        <button type="submit" class="auth-submit-btn">Sign Up</button>
      </form>
      <div class="auth-toggle">
        Already have an account? <a id="toggle-signin">Sign in</a>
      </div>
    `;
  }

  getVerifyHTML() {
    return `
      <h2>Verify Your Email</h2>
      <p>We sent a verification code to <strong>${this.tempEmail}</strong></p>
      <div class="auth-error" id="auth-error"></div>
      <div class="auth-success" id="auth-success"></div>
      <form class="auth-form" id="verify-form">
        <div class="form-group">
          <label for="verify-code">Verification Code</label>
          <input type="text" id="verify-code" required placeholder="123456">
        </div>
        <button type="submit" class="auth-submit-btn">Verify</button>
      </form>
      <div class="auth-toggle">
        <a id="resend-code">Resend code</a> | <a id="back-signin">Back to sign in</a>
      </div>
    `;
  }

  getForgotPasswordHTML() {
    return `
      <h2>Reset Password</h2>
      <p>Enter your email to receive a reset code</p>
      <div class="auth-error" id="auth-error"></div>
      <div class="auth-success" id="auth-success"></div>
      <form class="auth-form" id="forgot-form">
        <div class="form-group">
          <label for="forgot-email">Email</label>
          <input type="email" id="forgot-email" required placeholder="your@email.com">
        </div>
        <button type="submit" class="auth-submit-btn">Send Reset Code</button>
      </form>
      <div class="auth-toggle">
        <a id="back-signin">Back to sign in</a>
      </div>
    `;
  }

  attachSignInHandlers() {
    const form = document.getElementById('signin-form');
    const toggleSignup = document.getElementById('toggle-signup');
    const forgotLink = document.getElementById('forgot-link');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value;
      const password = document.getElementById('signin-password').value;
      const btn = form.querySelector('button');
      const errorDiv = document.getElementById('auth-error');

      btn.disabled = true;
      btn.innerHTML = 'Signing in...<span class="auth-loading"></span>';
      errorDiv.classList.remove('active');

      try {
        await this.authManager.signIn(email, password);
        this.hide();
        if (this.onAuthSuccess) this.onAuthSuccess();
      } catch (error) {
        errorDiv.textContent = error.message || 'Sign in failed. Please try again.';
        errorDiv.classList.add('active');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });

    toggleSignup.addEventListener('click', () => {
      this.currentMode = 'signup';
      this.renderContent();
    });

    forgotLink.addEventListener('click', () => {
      this.currentMode = 'forgot';
      this.renderContent();
    });
  }

  attachSignUpHandlers() {
    const form = document.getElementById('signup-form');
    const toggleSignin = document.getElementById('toggle-signin');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const btn = form.querySelector('button');
      const errorDiv = document.getElementById('auth-error');

      btn.disabled = true;
      btn.innerHTML = 'Creating account...<span class="auth-loading"></span>';
      errorDiv.classList.remove('active');

      try {
        await this.authManager.signUp(email, password, name);
        this.tempEmail = email;
        this.currentMode = 'verify';
        this.renderContent();
      } catch (error) {
        errorDiv.textContent = error.message || 'Sign up failed. Please try again.';
        errorDiv.classList.add('active');
        btn.disabled = false;
        btn.textContent = 'Sign Up';
      }
    });

    toggleSignin.addEventListener('click', () => {
      this.currentMode = 'signin';
      this.renderContent();
    });
  }

  attachVerifyHandlers() {
    const form = document.getElementById('verify-form');
    const backSignin = document.getElementById('back-signin');
    const resendCode = document.getElementById('resend-code');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('verify-code').value;
      const btn = form.querySelector('button');
      const errorDiv = document.getElementById('auth-error');
      const successDiv = document.getElementById('auth-success');

      btn.disabled = true;
      btn.innerHTML = 'Verifying...<span class="auth-loading"></span>';
      errorDiv.classList.remove('active');
      successDiv.classList.remove('active');

      try {
        await this.authManager.confirmSignUp(this.tempEmail, code);
        successDiv.textContent = 'Email verified! You can now sign in.';
        successDiv.classList.add('active');
        setTimeout(() => {
          this.currentMode = 'signin';
          this.renderContent();
        }, 2000);
      } catch (error) {
        errorDiv.textContent = error.message || 'Verification failed. Please check the code.';
        errorDiv.classList.add('active');
        btn.disabled = false;
        btn.textContent = 'Verify';
      }
    });

    backSignin.addEventListener('click', () => {
      this.currentMode = 'signin';
      this.renderContent();
    });

    resendCode.addEventListener('click', async () => {
      alert('Please check your email for the code or sign up again.');
    });
  }

  attachForgotPasswordHandlers() {
    const form = document.getElementById('forgot-form');
    const backSignin = document.getElementById('back-signin');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value;
      const btn = form.querySelector('button');
      const errorDiv = document.getElementById('auth-error');
      const successDiv = document.getElementById('auth-success');

      btn.disabled = true;
      btn.innerHTML = 'Sending...<span class="auth-loading"></span>';
      errorDiv.classList.remove('active');
      successDiv.classList.remove('active');

      try {
        await this.authManager.forgotPassword(email);
        successDiv.textContent = 'Reset code sent! Check your email.';
        successDiv.classList.add('active');
        btn.disabled = false;
        btn.textContent = 'Send Reset Code';
      } catch (error) {
        errorDiv.textContent = error.message || 'Failed to send reset code.';
        errorDiv.classList.add('active');
        btn.disabled = false;
        btn.textContent = 'Send Reset Code';
      }
    });

    backSignin.addEventListener('click', () => {
      this.currentMode = 'signin';
      this.renderContent();
    });
  }
}

/* WebPage: renders book UI into #poster-area and #details-area.
   Options:
     - readMode: 'viewer' | 'direct' — viewer uses Google Docs viewer for public URLs
     - requireAuth: boolean — if true, requires authentication before access
*/
export class WebPage {
  constructor(book, options = {}) {
    this.book = book;
    this.options = Object.assign({ readMode: 'viewer', requireAuth: false }, options);
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

    // Determine button text based on page type
    const buttonText = this.options.primaryButtonText || 'ACCESS E-BOOK // READ ONLINE';
    
    // Read/Access button
    const readBtn = document.createElement('button');
    readBtn.className = 'btn btn--primary';
    readBtn.textContent = buttonText;
    readBtn.addEventListener('click', (e) => this.handleAccess(e));
    this.actionsEl.appendChild(readBtn);

    // Secondary link (solutions or back)
    const secondaryLink = document.createElement('a');
    secondaryLink.className = 'btn btn--secondary';
    secondaryLink.href = this.options.secondaryHref || 'book-solutions.html';
    secondaryLink.textContent = this.options.secondaryLabel || 'VIEW SOLUTIONS 💡';
    this.actionsEl.appendChild(secondaryLink);

    this.containerDetails.appendChild(this.actionsEl);
  }

  async handleAccess(e) {
    e.preventDefault();
    
    // Check if authentication is required
    if (this.options.requireAuth) {
      // Check if using Hosted UI (OAuth) or custom auth
      if (this.options.useHostedUI) {
        // FIXED: Redirect to Cognito Hosted UI for Google Sign-In
        const cognitoDomain = this.options.cognitoDomain;
        const clientId = this.options.clientId;
        const redirectUri = window.location.href.split('?')[0]; // Current page without query params
        
        // Store current action to resume after login
        sessionStorage.setItem('pendingAction', 'openReader');
        
        // FIXED: Use /oauth2/authorize and include identity_provider=Google
        // Try with just 'openid' scope first, add 'email profile' if enabled in Cognito
        const hostedUIUrl = `${cognitoDomain}/oauth2/authorize?` +
          `identity_provider=Google&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `client_id=${clientId}&` +
          `scope=openid`;
        
        console.log('Redirecting to Cognito Hosted UI:', hostedUIUrl);
        window.location.href = hostedUIUrl;
        return;
      } else if (this.options.authManager) {
        // Use custom modal (old way)
        const isAuth = await this.options.authManager.isAuthenticated();
        if (!isAuth) {
          if (this.options.authModal) {
            this.options.authModal.show('signin', () => {
              this.openReader();
            });
          } else {
            alert('Please sign in to access this content.');
          }
          return;
        }
      }
    }
    
    // User is authenticated or auth not required
    this.openReader();
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