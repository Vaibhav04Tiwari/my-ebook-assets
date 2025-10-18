// App entry. Decides which page to render and passes options to components.
// Single app file reused across both pages.

import { Book, WebPage, Header, Footer } from './components.js';

// Configuration for Cognito Hosted UI
const cognitoConfig = {
  cognitoDomain: 'https://us-east-1oeh7ih12h.auth.us-east-1.amazoncognito.com',
  clientId: '5gfu0h940eejksp0ekuqi1s9lh',
  // Use current page URL as redirect URI to match Cognito config
  redirectUri: window.location.href.split('?')[0], // Current page without query params
  region: 'us-east-1'
};

// Debug: Log the configuration
console.log('Cognito Config:', cognitoConfig);
console.log('Current URL:', window.location.href);
console.log('Redirect URI:', cognitoConfig.redirectUri);

// Function to exchange authorization code for tokens
async function exchangeCodeForTokens(code) {
  const { cognitoDomain, clientId, redirectUri } = cognitoConfig;
  
  // Add more debugging
  console.log('Exchanging code for tokens...');
  console.log('Code:', code);
  console.log('Redirect URI for token exchange:', redirectUri);
  
  try {
    const response = await fetch(`${cognitoDomain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code: code,
        redirect_uri: redirectUri
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange failed:', errorData);
      throw new Error('Token exchange failed');
    }
    
    const tokens = await response.json();
    console.log('Authentication successful!');
    
    // Store tokens securely in sessionStorage
    sessionStorage.setItem('accessToken', tokens.access_token);
    sessionStorage.setItem('idToken', tokens.id_token);
    if (tokens.refresh_token) {
      sessionStorage.setItem('refreshToken', tokens.refresh_token);
    }
    sessionStorage.setItem('isAuthenticated', 'true');
    
    return true;
  } catch (error) {
    console.error('Error during token exchange:', error);
    alert('Authentication failed. Please try again.');
    return false;
  }
}

// Check if user is returning from OAuth login
const urlParams = new URLSearchParams(window.location.search);

// Handle OAuth callback
if (urlParams.has('code')) {
  const authCode = urlParams.get('code');
  console.log('OAuth code received, exchanging for tokens...');
  
  // Exchange code for tokens
  exchangeCodeForTokens(authCode).then(success => {
    if (success) {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Check if there's a pending action
      const pendingAction = sessionStorage.getItem('pendingAction');
      if (pendingAction === 'openReader') {
        sessionStorage.removeItem('pendingAction');
        // Reload to trigger the automatic reader opening
        window.location.reload();
      }
    } else {
      // Clear URL even if failed
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
}

// Handle OAuth errors
if (urlParams.has('error')) {
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  console.error('OAuth error:', error, errorDescription);
  alert(`Authentication error: ${errorDescription || error}`);
  window.history.replaceState({}, document.title, window.location.pathname);
}

// Simple auth check
const isAuthenticated = () => {
  return sessionStorage.getItem('isAuthenticated') === 'true';
};

// Function to sign out
window.signOut = function() {
  const { cognitoDomain, clientId } = cognitoConfig;
  const logoutUri = window.location.origin;
  
  // Clear all session data
  sessionStorage.clear();
  
  // Redirect to Cognito logout
  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
};

const header = new Header();
header.mount();
const footer = new Footer();
footer.mount('Made with ♥ — My E-Book Assets • License: Free to use');

const pageType = document.body.getAttribute('data-page') || 'index';

/* Shared book data for the main book (index) */
const mainBook = new Book({
  title: 'Under the Banyan Tree',
  subtitle: 'Decoding Numbers: An ISI Entrance Guide',
  author: 'Sumit Gupta',
  pages: '310',
  coverImage: 'assets/banyan_tree_cover.jpg',
  pdfPath: 'https://my-ebook-assets.s3.us-east-1.amazonaws.com/ISI_Book_Number_Theory.pdf',
  description: "This essential resource is dedicated to deepening your mathematical roots and providing comprehensive preparation for the ISI entrance examination."
});

/* Solutions book data (can be different) */
const solutionsBook = new Book({
  title: 'Solutions to Decoding Numbers',
  subtitle: 'Under the Banyan Tree',
  author: 'Sumit Gupta',
  pages: '320',
  coverImage: 'assets/banyan_tree_cover.jpg',
  pdfPath: 'ISI_Book_Number_Theory_Solutions (6).pdf',
  description: "Comprehensive solution guide with step-by-step explanations for all exercises in the textbook."
});

if (pageType === 'index') {
  // Main book page - no authentication required
  const page = new WebPage(mainBook, {
    readMode: 'viewer',
    requireAuth: false,
    secondaryHref: 'book-solutions.html',
    secondaryLabel: 'VIEW SOLUTIONS 💡'
  });
  page.render();
} else if (pageType === 'solutions') {
  // Solutions page - REQUIRES Google authentication via Hosted UI
  const page = new WebPage(solutionsBook, {
    readMode: 'direct',
    requireAuth: true,
    useHostedUI: true,
    cognitoDomain: cognitoConfig.cognitoDomain,
    clientId: cognitoConfig.clientId,
    primaryButtonText: 'VIEW SOLUTIONS // DOWNLOAD PDF 📥',
    secondaryHref: 'index.html',
    secondaryLabel: '← BACK TO MAIN E-BOOK'
  });
  page.render();
  
  // If user just authenticated and has pending action, open reader automatically
  if (isAuthenticated() && sessionStorage.getItem('pendingAction') === 'openReader') {
    sessionStorage.removeItem('pendingAction');
    page.openReader();
  }
} else {
  // default behavior: render main book
  const page = new WebPage(mainBook, { readMode: 'viewer' });
  page.render();
}