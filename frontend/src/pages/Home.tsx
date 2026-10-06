import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Truck, Shield, Gift, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BookGrid from '@/components/books/BookGrid';
import { mockBooks, mockCategories } from '@/utils/mockData';

// ─── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium">
              <BookOpen className="h-4 w-4" />
              Over 50,000 books in stock
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Your Next Great{' '}
              <span className="text-primary">Read</span>{' '}
              Starts Here
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Explore thousands of books across fiction, technology, science, history and more.
              Fast delivery, great prices, and gift points on every order.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by title, author, or ISBN…"
                  className="pl-10 h-11"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-11">Search</Button>
            </form>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/catalogue">Browse Catalogue <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/catalogue?sort=bestseller">Best Sellers</Link>
              </Button>
            </div>
          </div>

          {/* Featured cover grid */}
          <div className="hidden md:grid grid-cols-3 gap-3 rotate-2">
            {mockBooks.slice(0, 6).map((book, i) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                className={`rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow ${i === 1 || i === 4 ? '-mt-4' : ''}`}
              >
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-full aspect-[3/4] object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      `https://placehold.co/120x160/e5e7eb/94a3b8?text=${encodeURIComponent(book.title.slice(0, 6))}`;
                  }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust Badges ──────────────────────────────────────────────────────────────
const trustItems = [
  { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹499' },
  { icon: Shield, title: 'Secure Payment', desc: '100% safe transactions' },
  { icon: Gift, title: 'Gift Points', desc: 'Earn on every purchase' },
  { icon: BookOpen, title: '50,000+ Books', desc: 'Across all genres' },
];

function TrustBadges() {
  return (
    <section className="border-y bg-muted/30 py-6">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2.5 text-primary flex-shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Category Grid ─────────────────────────────────────────────────────────────
const categoryColors = [
  'bg-blue-50 hover:bg-blue-100 text-blue-700',
  'bg-green-50 hover:bg-green-100 text-green-700',
  'bg-purple-50 hover:bg-purple-100 text-purple-700',
  'bg-orange-50 hover:bg-orange-100 text-orange-700',
  'bg-pink-50 hover:bg-pink-100 text-pink-700',
  'bg-teal-50 hover:bg-teal-100 text-teal-700',
  'bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
  'bg-red-50 hover:bg-red-100 text-red-700',
];

function CategoryGrid() {
  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Browse by Category</h2>
        <Button variant="ghost" asChild>
          <Link to="/catalogue" className="flex items-center gap-1 text-sm">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {mockCategories.map((cat, i) => (
          <Link
            key={cat.id}
            to={`/catalogue/${cat.slug}`}
            className={`rounded-xl p-4 text-center text-sm font-medium transition-colors cursor-pointer ${categoryColors[i % categoryColors.length]}`}
          >
            <div className="text-2xl mb-1">
              {['📚', '📖', '🔬', '💻', '🏛️', '🌱', '👤', '🧒'][i % 8]}
            </div>
            {cat.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Featured Books ─────────────────────────────────────────────────────────────
function FeaturedBooks() {
  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Featured Books</h2>
          <p className="text-sm text-muted-foreground mt-1">Handpicked titles our readers love</p>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/catalogue" className="flex items-center gap-1 text-sm">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <BookGrid books={mockBooks} columns={4} />
    </section>
  );
}

// ─── Best Sellers ──────────────────────────────────────────────────────────────
function BestSellers() {
  const topBooks = [...mockBooks].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 4);

  return (
    <section className="bg-muted/30 py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Best Sellers</h2>
            <p className="text-sm text-muted-foreground mt-1">Most popular across all genres</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/catalogue?sort=bestseller" className="flex items-center gap-1 text-sm">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <BookGrid books={topBooks} columns={4} />
      </div>
    </section>
  );
}

// ─── Newsletter ────────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section className="container py-16">
      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Stay in the Loop</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Get notified about new arrivals, exclusive deals, and personalised book recommendations.
        </p>
        {submitted ? (
          <p className="text-primary font-semibold">🎉 Thanks for subscribing!</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="h-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="h-11 whitespace-nowrap">Subscribe</Button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div>
      <Hero />
      <TrustBadges />
      <CategoryGrid />
      <FeaturedBooks />
      <BestSellers />
      <Newsletter />
    </div>
  );
}
