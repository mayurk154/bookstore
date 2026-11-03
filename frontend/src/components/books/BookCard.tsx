import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Book } from '@/types';
import { formatPrice, discountedPrice } from '@/utils';
import { Badge } from '@/components/ui/badge';

interface BookCardProps {
  book: Book;
  className?: string;
}

export default function BookCard({ book, className }: BookCardProps) {
  const finalPrice = discountedPrice(book.price, book.discountPct);
  const hasDiscount = book.discountPct > 0;

  return (
    <Link
      to={`/books/${book.id}`}
      className={`group flex flex-col gap-3 ${className ?? ''}`}
    >
      {/* Tile — cover only */}
      <div className="relative rounded-2xl neu-raised neu-hover p-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                `https://placehold.co/240x320/d6ecf7/4a8aa8?text=${encodeURIComponent(book.title.slice(0, 10))}`;
            }}
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 text-xs">
              -{book.discountPct}%
            </Badge>
          )}
        </div>
      </div>

      {/* Info — below the tile */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2" title={book.title}>
          {book.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 pt-1">
          <Star className="h-3 w-3 fill-amber-300 text-amber-400" />
          <span className="text-xs font-medium">{book.rating}</span>
          <span className="text-xs text-muted-foreground">({book.reviewCount.toLocaleString()})</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-bold text-base">{formatPrice(finalPrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(book.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="rounded-2xl neu-raised p-2">
        <div className="aspect-[3/4] rounded-xl bg-muted" />
      </div>
      <div className="px-1 flex flex-col gap-2">
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-1/2 mt-2" />
        <div className="h-5 bg-muted rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}
