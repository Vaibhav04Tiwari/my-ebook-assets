// App entry. Decides which page to render and passes options to components.
// Single app file reused across both pages.

import { Book, WebPage, Header, Footer, AuthModal } from './components.js';
import { AuthManager } from './auth.js';

// Initialize AWS Cognito Auth Manager
// IMPORTANT: Replace these with your actual AWS Cognito credentials
const authManager = new AuthManager({
  userPoolId: 'us-east-1_9Omyjhcza',  // e.g., 'us-east-1_abcdefgh'
  clientId: '69etrckp419t1havk13t4llo0d'        // e.g., '1234567890abcdefghijklmnop'
});

// Initialize Auth Modal
const authModal = new AuthModal(authManager);

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
    requireAuth: false,  // Set to true if you want to require auth for main book too
    secondaryHref: 'book-solutions.html',
    secondaryLabel: 'VIEW SOLUTIONS 💡'
  });
  page.render();
} else if (pageType === 'solutions') {
  // Solutions page - REQUIRES authentication
  const page = new WebPage(solutionsBook, {
    readMode: 'direct',
    requireAuth: true,                    // Authentication required for solutions
    authManager: authManager,             // Pass auth manager
    authModal: authModal,                 // Pass auth modal
    primaryButtonText: 'VIEW SOLUTIONS // DOWNLOAD PDF 📥',  // Custom button text
    secondaryHref: 'index.html',
    secondaryLabel: '← BACK TO MAIN E-BOOK'
  });
  page.render();
} else {
  // default behavior: render main book
  const page = new WebPage(mainBook, { readMode: 'viewer' });
  page.render();
}