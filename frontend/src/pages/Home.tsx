import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Truck, Shield, Gift, Search,
  Feather, Compass, FlaskConical, Cpu, Landmark, Sprout, UserRound, Shapes,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import WaveDivider from '@/components/common/WaveDivider';
import BookGrid from '@/components/books/BookGrid';
import { bookService } from '@/services/bookService';
import { mockCategories } from '@/utils/mockData';
import type { Book } from '@/types';

// ─── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const [covers, setCovers] = useState<Book[]>([]);

  useEffect(() => {
    bookService.getBooks({ limit: 40 })
      .then((res) => {
        const shuffled = [...res.data].sort(() => Math.random() - 0.5);
        setCovers(shuffled.slice(0, 6));
      })
      .catch(() => {/* hero simply renders without covers */});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-200/70 via-sky-100/50 to-transparent pt-16 pb-28 md:pt-24 md:pb-36">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <span className="float-bob absolute top-10 right-[8%] text-3xl opacity-70 hidden md:block" aria-hidden>🐚</span>
      <span className="float-bob absolute bottom-32 left-[5%] text-2xl opacity-60 hidden md:block" style={{ animationDelay: '1.5s' }} aria-hidden>⭐</span>
      <WaveDivider className="absolute bottom-0 left-0 right-0" />

      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full neu-raised-sm px-4 py-1.5 text-sm text-primary font-medium">
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

          {/* Cover grid — random books */}
          <div className="hidden md:grid grid-cols-3 gap-4 rotate-2">
            {covers.map((book, i) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                title={book.title}
                className={`rounded-2xl neu-raised neu-hover p-2 ${i === 1 || i === 4 ? '-mt-4' : ''}`}
              >
                <img
                  src={book.coverUrl}
                  alt={`Cover of ${book.title}`}
                  className="aspect-[3/4] w-full rounded-xl object-cover bg-muted"
                  loading="lazy"
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
    <section className="py-6">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="rounded-full neu-raised-sm p-2.5 text-primary flex-shrink-0">
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
const categoryStyles: Record<string, { icon: LucideIcon; tagline: string; hue: number }> = {
  fiction:       { icon: Feather,      tagline: 'Stories to get lost in', hue: 199 },
  'non-fiction': { icon: Compass,      tagline: 'Real worlds, real ideas', hue: 186 },
  science:       { icon: FlaskConical, tagline: 'Curiosity, explained',    hue: 172 },
  technology:    { icon: Cpu,          tagline: 'Code, craft & future',    hue: 210 },
  history:       { icon: Landmark,     tagline: 'Tides of the past',       hue: 36 },
  'self-help':   { icon: Sprout,       tagline: 'Grow a little each day',  hue: 160 },
  biography:     { icon: UserRound,    tagline: 'Lives worth reading',     hue: 24 },
  children:      { icon: Shapes,       tagline: 'Little readers, big joy', hue: 12 },
};

function CategoryGrid() {
  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <p className="text-sm text-muted-foreground mt-1">Dive into a shelf that suits your mood</p>
        </div>
        <Button variant="ghost" asChild>
          <Link to="/catalogue" className="flex items-center gap-1 text-sm">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-5">
        {mockCategories.map((cat) => {
          const style = categoryStyles[cat.slug] ?? categoryStyles.fiction;
          const Icon = style.icon;
          const { hue } = style;
          return (
            <Link
              key={cat.id}
              to={`/catalogue/${cat.slug}`}
              className="group relative overflow-hidden rounded-3xl neu-raised neu-hover p-5 min-h-[132px] flex flex-col justify-between"
              style={{
                backgroundImage: `linear-gradient(145deg, hsl(${hue} 70% 96%) 0%, hsl(${hue} 60% 90% / 0.85) 100%)`,
              }}
            >
              {/* Faded watermark icon, like a shell pressed into sand */}
              <Icon
                aria-hidden
                strokeWidth={1.25}
                className="absolute -right-5 -bottom-6 h-28 w-28 rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110"
                style={{ color: `hsl(${hue} 55% 55% / 0.16)` }}
              />
              {/* Soft wave crest along the bottom edge */}
              <svg
                aria-hidden
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 h-3 w-full"
              >
                <path d="M0,10 C25,0 50,20 75,10 C100,0 125,20 150,10 C175,0 190,14 200,10 L200,20 L0,20 Z" fill={`hsl(${hue} 70% 80% / 0.55)`} />
              </svg>

              {/* Icon porthole */}
              <div
                className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full neu-inset"
                style={{ color: `hsl(${hue} 65% 34%)` }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>

              <div className="relative z-10 mt-4">
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold text-base" style={{ color: `hsl(${hue} 55% 22%)` }}>{cat.name}</h3>
                  <ArrowRight
                    className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    style={{ color: `hsl(${hue} 65% 34%)` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{style.tagline}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Featured Books ─────────────────────────────────────────────────────────────
function FeaturedBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService.getFeaturedBooks()
      .then(setBooks)
      .catch(() => {/* silently fall back to empty */})
      .finally(() => setLoading(false));
  }, []);

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
      <BookGrid books={books} columns={4} loading={loading} />
    </section>
  );
}

// ─── Best Sellers ──────────────────────────────────────────────────────────────
function BestSellers() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookService.getBooks({ sort: 'bestseller', limit: 4 })
      .then((res) => setBooks(res.data))
      .catch(() => {/* silently fall back to empty */})
      .finally(() => setLoading(false));
  }, []);

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
        <BookGrid books={books} columns={4} loading={loading} />
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
