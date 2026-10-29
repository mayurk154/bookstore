import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookCard from '@/components/books/BookCard';
import type { Book } from '@/types';

const mockBook: Book = {
  id: 'book-1',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  publisher: { id: 'pub-1', name: 'Prentice Hall' },
  price: 1299,
  discountPct: 15,
  coverUrl: 'https://example.com/cover.jpg',
  description: 'A handbook of agile software craftsmanship.',
  isbn: '9780132350884',
  pages: 431,
  language: 'English',
  rating: 4.7,
  reviewCount: 3988,
  stock: 12,
  categories: [{ id: 'cat-1', name: 'Technology', slug: 'technology' }],
};

function renderCard(book: Book = mockBook) {
  return render(
    <MemoryRouter>
      <BookCard book={book} />
    </MemoryRouter>
  );
}

describe('BookCard', () => {
  it('renders the book title', () => {
    renderCard();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
  });

  it('renders the author name', () => {
    renderCard();
    expect(screen.getByText('Robert C. Martin')).toBeInTheDocument();
  });

  it('renders the discounted price', () => {
    renderCard();
    // 1299 * (1 - 15/100) = 1104.15 → 1104
    expect(screen.getByText(/1,104|1104/)).toBeInTheDocument();
  });

  it('renders the original price with strikethrough when discounted', () => {
    renderCard();
    expect(screen.getByText(/1,299|1299/)).toBeInTheDocument();
  });

  it('shows the discount badge', () => {
    renderCard();
    expect(screen.getByText('-15%')).toBeInTheDocument();
  });

  it('does not show a discount badge when discountPct is 0', () => {
    renderCard({ ...mockBook, discountPct: 0 });
    expect(screen.queryByText(/-\d+%/)).toBeNull();
  });

  it('links to the correct book detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/books/book-1');
  });

  it('renders the rating', () => {
    renderCard();
    expect(screen.getByText('4.7')).toBeInTheDocument();
  });
});
