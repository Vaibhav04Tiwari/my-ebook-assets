// App entry. Decides which page to render and passes options to components.
// Single app file reused across both pages.

import { Book, WebPage, Header, Footer } from './components.js';

// Configuration for Cognito Hosted UI
const cognitoConfig = {
  cognitoDomain: 'https://us-east-1oeh7ih12h.auth.us-east-1.amazoncognito.com',
  clientId: '5gfu0h940eejksp0ekuqi1s9lh', // Replace with your app client ID
  redirectUri: window.location.origin + window.location.pathname
};

// Check if user is returning from OAuth login
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('code')) {
  // User just logged in via OAuth
  const authCode = urlParams.get('code');
  console.log('OAuth code received:', authCode);
  
  // Exchange code for tokens (you can implement this or just mark as authenticated)
  sessionStorage.setItem('isAuthenticated', 'true');
  
  // Clean up URL
  window.history.replaceState({}, document.title, window.location.pathname);
  
  // Check if there's a pending action
  const pendingAction = sessionStorage.getItem('pendingAction');
  if (pendingAction === 'openReader') {
    sessionStorage.removeItem('pendingAction');
    // The page will reload and the PDF will open automatically
  }
}

// Simple auth check
const isAuthenticated = () => {
  return sessionStorage.getItem('isAuthenticated') === 'true';
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
    useHostedUI: true,                      // Use Cognito Hosted UI for Google Sign-In
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