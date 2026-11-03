import { Link } from 'react-router-dom';
import { BookOpen, Github, Twitter, Instagram } from 'lucide-react';
import WaveDivider from '@/components/common/WaveDivider';

const footerLinks = {
  Explore: [
    { label: 'All Books', href: '/catalogue' },
    { label: 'New Arrivals', href: '/catalogue?sort=newest' },
    { label: 'Best Sellers', href: '/catalogue?sort=bestseller' },
    { label: 'Categories', href: '/catalogue' },
  ],
  Account: [
    { label: 'My Orders', href: '/orders' },
    { label: 'My Cart', href: '/cart' },
    { label: 'Login', href: '/login' },
    { label: 'Register', href: '/register' },
  ],
  Support: [
    { label: 'FAQ', href: '#' },
    { label: 'Returns Policy', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'Shipping Info', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="relative mt-8 bg-gradient-to-b from-[hsl(var(--sand)/0.55)] to-[hsl(var(--sand)/0.9)]">
      <WaveDivider fill="hsl(var(--sand) / 0.55)" className="absolute -top-px left-0 right-0 -translate-y-full" />
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary mb-3">
              <BookOpen className="h-5 w-5" />
              BookVault
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted destination for books across every genre. Discover, read, grow.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="GitHub" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-semibold text-sm mb-3">{heading}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} BookVault. All rights reserved.</p>
          <p>Built with IBM BOB · React · Node.js · PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
