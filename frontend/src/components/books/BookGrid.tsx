import type { Book } from '@/types';
import BookCard, { BookCardSkeleton } from './BookCard';

interface BookGridProps {
  books: Book[];
  loading?: boolean;
  skeletonCount?: number;
  columns?: 2 | 3 | 4 | 5;
}

const columnClasses = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
};

export default function BookGrid({
  books,
  loading = false,
  skeletonCount = 8,
  columns = 4,
}: BookGridProps) {
  if (loading) {
    return (
      <div className={`grid ${columnClasses[columns]} gap-4`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <BookCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${columnClasses[columns]} gap-4`}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
