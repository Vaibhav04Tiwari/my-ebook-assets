// App entry. Decides which page to render and passes options to components.
// Single app file reused across both pages.

import { Book, WebPage, Header, Footer } from '/components.js';
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
  coverImage: 'banyan_tree_cover.jpg',
  pdfPath: 'https://my-ebook-assets.s3.us-east-1.amazonaws.com/ISI_Book_Number_Theory.pdf',
  description: "This essential resource is dedicated to deepening your mathematical roots and providing comprehensive preparation for the ISI entrance examination."
});

/* Solutions book data (can be different) */
const solutionsBook = new Book({
  title: 'Solutions to Decoding Numbers',
  subtitle: 'Under the Banyan Tree',
  author: 'Sumit Gupta',
  pages: '320',
  coverImage: 'banyan_tree_cover.jpg',
  // Use relative/local path if you want direct download from solutions page
  pdfPath: 'ISI_Book_Number_Theory_Solutions (6).pdf',
  description: "Comprehensive solution guide with step-by-step explanations for all exercises in the textbook."
});

if (pageType === 'index') {
  const page = new WebPage(mainBook, {
    readMode: 'viewer',           // use docs.google.com for public URLs
    secondaryHref: 'book-solutions.html',
    secondaryLabel: 'VIEW SOLUTIONS 💡'
  });
  page.render();
} else if (pageType === 'solutions') {
  const page = new WebPage(solutionsBook, {
    readMode: 'direct',           // direct download / open
    secondaryHref: 'index.html',
    secondaryLabel: '← GO BACK TO MAIN E-BOOK'
  });
  page.render();
} else {
  // default behavior: render main book
  const page = new WebPage(mainBook, { readMode: 'viewer' });
  page.render();
}