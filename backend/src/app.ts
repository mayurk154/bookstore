import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-key';

app.use(helmet());
app.use(cors({ origin: 'http://127.0.0.1:5173', credentials: true }));
app.use(express.json());

// ─── In-memory mock data ────────────────────────────────────────────────────

const categories = [
  { id: 'cat-1', name: 'Fiction',      slug: 'fiction' },
  { id: 'cat-2', name: 'Non-Fiction',  slug: 'non-fiction' },
  { id: 'cat-3', name: 'Science',      slug: 'science' },
  { id: 'cat-4', name: 'Technology',   slug: 'technology' },
  { id: 'cat-5', name: 'History',      slug: 'history' },
  { id: 'cat-6', name: 'Self-Help',    slug: 'self-help' },
  { id: 'cat-7', name: 'Biography',    slug: 'biography' },
  { id: 'cat-8', name: 'Children',     slug: 'children' },
];

const publishers = [
  { id: 'pub-1', name: 'Penguin Random House' },
  { id: 'pub-2', name: 'HarperCollins' },
  { id: 'pub-3', name: 'Simon & Schuster' },
  { id: 'pub-4', name: 'Macmillan' },
  { id: 'pub-5', name: 'Oxford University Press' },
];

const books = [
  // ── Fiction ────────────────────────────────────────────────────────────────
  {
    id: 'book-1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald',
    publisher: publishers[0], price: 499, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
    description: 'A story of the Jazz Age told through Nick Carraway, who is fascinated by his neighbour Jay Gatsby and his obsession with the beautiful former debutante Daisy Buchanan.',
    isbn: '9780743273565', pages: 180, language: 'English',
    rating: 4.2, reviewCount: 2841, stock: 15,
    categories: [categories[0]], isFeatured: true,
  },
  {
    id: 'book-2', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari',
    publisher: publishers[1], price: 799, discountPct: 25,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
    description: 'A bold survey of human history, from the Stone Age to the present, asking why Homo sapiens has come to dominate the earth.',
    isbn: '9780062316097', pages: 443, language: 'English',
    rating: 4.5, reviewCount: 5102, stock: 8,
    categories: [categories[1], categories[4]], isFeatured: true,
  },
  {
    id: 'book-3', title: 'Clean Code', author: 'Robert C. Martin',
    publisher: publishers[2], price: 1299, discountPct: 15,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
    description: 'A handbook of agile software craftsmanship. Even bad code can function, but if it isn\'t clean, it can bring a development organisation to its knees.',
    isbn: '9780132350884', pages: 431, language: 'English',
    rating: 4.7, reviewCount: 3988, stock: 12,
    categories: [categories[3]], isFeatured: true,
  },
  {
    id: 'book-4', title: 'To Kill a Mockingbird', author: 'Harper Lee',
    publisher: publishers[0], price: 399, discountPct: 10,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780061743528-L.jpg',
    description: 'Set in the American South during the 1930s, the novel deals with serious issues of rape and racial inequality while maintaining the perspective of a child.',
    isbn: '9780061743528', pages: 281, language: 'English',
    rating: 4.6, reviewCount: 4512, stock: 20,
    categories: [categories[0]], isFeatured: false,
  },
  {
    id: 'book-5', title: 'A Brief History of Time', author: 'Stephen Hawking',
    publisher: publishers[3], price: 599, discountPct: 18,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780553380163-L.jpg',
    description: 'One of the great popular science books ever written — exploring the origins of the universe, the nature of time, and the ultimate fate of the cosmos.',
    isbn: '9780553380163', pages: 212, language: 'English',
    rating: 4.4, reviewCount: 6720, stock: 5,
    categories: [categories[2]], isFeatured: true,
  },
  {
    id: 'book-6', title: 'Atomic Habits', author: 'James Clear',
    publisher: publishers[1], price: 699, discountPct: 22,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
    description: 'How to build good habits, break bad ones, and make small changes that deliver remarkable results.',
    isbn: '9780735211292', pages: 320, language: 'English',
    rating: 4.8, reviewCount: 9201, stock: 30,
    categories: [categories[5]], isFeatured: true,
  },
  {
    id: 'book-7', title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt',
    publisher: publishers[2], price: 1199, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg',
    description: 'Examines the core process of software development and includes many valuable suggestions that help programmers work more effectively.',
    isbn: '9780135957059', pages: 352, language: 'English',
    rating: 4.6, reviewCount: 2987, stock: 9,
    categories: [categories[3]], isFeatured: false,
  },
  {
    id: 'book-8', title: 'Steve Jobs', author: 'Walter Isaacson',
    publisher: publishers[2], price: 899, discountPct: 30,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781451648539-L.jpg',
    description: 'The exclusive biography of Steve Jobs, based on more than forty interviews conducted over two years.',
    isbn: '9781451648539', pages: 630, language: 'English',
    rating: 4.3, reviewCount: 7841, stock: 14,
    categories: [categories[6]], isFeatured: false,
  },

  // ── Fiction (continued) ───────────────────────────────────────────────────
  {
    id: 'book-9', title: '1984', author: 'George Orwell',
    publisher: publishers[0], price: 349, discountPct: 12,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
    description: 'A dystopian novel set in a totalitarian society ruled by Big Brother, where individual thought is a crime and the past is constantly rewritten.',
    isbn: '9780451524935', pages: 328, language: 'English',
    rating: 4.7, reviewCount: 11230, stock: 25,
    categories: [categories[0]], isFeatured: true,
  },
  {
    id: 'book-10', title: 'The Alchemist', author: 'Paulo Coelho',
    publisher: publishers[1], price: 399, discountPct: 15,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg',
    description: 'A philosophical novel about a young Andalusian shepherd who dreams of finding a treasure near the Egyptian pyramids and sets off on a journey of self-discovery.',
    isbn: '9780062315007', pages: 208, language: 'English',
    rating: 4.5, reviewCount: 8430, stock: 18,
    categories: [categories[0]], isFeatured: false,
  },
  {
    id: 'book-11', title: 'Pride and Prejudice', author: 'Jane Austen',
    publisher: publishers[0], price: 299, discountPct: 0,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg',
    description: 'A romantic novel of manners that follows the Bennet family and the headstrong Elizabeth\'s relationship with the proud Mr. Darcy.',
    isbn: '9780141439518', pages: 432, language: 'English',
    rating: 4.6, reviewCount: 7621, stock: 22,
    categories: [categories[0]], isFeatured: false,
  },
  {
    id: 'book-12', title: 'The Catcher in the Rye', author: 'J. D. Salinger',
    publisher: publishers[2], price: 349, discountPct: 8,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg',
    description: 'A coming-of-age story narrated by Holden Caulfield, a teenager from New York City who is expelled from prep school and has a brief breakdown.',
    isbn: '9780316769174', pages: 277, language: 'English',
    rating: 4.1, reviewCount: 5901, stock: 16,
    categories: [categories[0]], isFeatured: false,
  },

  // ── Non-Fiction ───────────────────────────────────────────────────────────
  {
    id: 'book-13', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman',
    publisher: publishers[0], price: 849, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg',
    description: 'Kahneman reveals the two systems that drive the way we think: the fast, intuitive System 1 and the slower, more deliberate System 2.',
    isbn: '9780374533557', pages: 499, language: 'English',
    rating: 4.6, reviewCount: 7102, stock: 14,
    categories: [categories[1]], isFeatured: true,
  },
  {
    id: 'book-14', title: 'Educated', author: 'Tara Westover',
    publisher: publishers[0], price: 599, discountPct: 18,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg',
    description: 'A memoir about a young woman who, kept out of school, leaves her survivalist family and eventually earns a PhD from Cambridge University.',
    isbn: '9780399590504', pages: 352, language: 'English',
    rating: 4.7, reviewCount: 8920, stock: 11,
    categories: [categories[1], categories[6]], isFeatured: false,
  },
  {
    id: 'book-15', title: 'Becoming', author: 'Michelle Obama',
    publisher: publishers[1], price: 699, discountPct: 25,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg',
    description: 'In her memoir, former First Lady Michelle Obama invites readers into her world, chronicling her experiences from her childhood on the South Side of Chicago.',
    isbn: '9781524763138', pages: 448, language: 'English',
    rating: 4.8, reviewCount: 12450, stock: 20,
    categories: [categories[1], categories[6]], isFeatured: true,
  },
  {
    id: 'book-16', title: 'The Body Keeps the Score', author: 'Bessel van der Kolk',
    publisher: publishers[3], price: 749, discountPct: 15,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780670785933-L.jpg',
    description: 'A pioneering researcher transforms our understanding of traumatic stress, revealing how it literally reshapes both brain and body.',
    isbn: '9780670785933', pages: 464, language: 'English',
    rating: 4.7, reviewCount: 6310, stock: 13,
    categories: [categories[1]], isFeatured: false,
  },

  // ── Science ───────────────────────────────────────────────────────────────
  {
    id: 'book-17', title: 'The Gene: An Intimate History', author: 'Siddhartha Mukherjee',
    publisher: publishers[2], price: 899, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781476733500-L.jpg',
    description: 'An epic, moving history of the gene and a response to the defining question of our era: what does it mean to be human?',
    isbn: '9781476733500', pages: 608, language: 'English',
    rating: 4.5, reviewCount: 3870, stock: 10,
    categories: [categories[2]], isFeatured: false,
  },
  {
    id: 'book-18', title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson',
    publisher: publishers[3], price: 499, discountPct: 10,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780393609394-L.jpg',
    description: 'Over a series of brief, witty, and well-illustrated essays, Tyson introduces the fundamental concepts of astrophysics.',
    isbn: '9780393609394', pages: 224, language: 'English',
    rating: 4.4, reviewCount: 5540, stock: 18,
    categories: [categories[2]], isFeatured: true,
  },
  {
    id: 'book-19', title: 'The Selfish Gene', author: 'Richard Dawkins',
    publisher: publishers[4], price: 649, discountPct: 12,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780198788607-L.jpg',
    description: 'Dawkins\' brilliant analysis of evolution at the level of the gene, showing how self-interest is built into our very nature.',
    isbn: '9780198788607', pages: 360, language: 'English',
    rating: 4.5, reviewCount: 4210, stock: 9,
    categories: [categories[2]], isFeatured: false,
  },

  // ── Technology ────────────────────────────────────────────────────────────
  {
    id: 'book-20', title: 'The Design of Everyday Things', author: 'Don Norman',
    publisher: publishers[1], price: 999, discountPct: 18,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780465050659-L.jpg',
    description: 'A powerful primer on how and why some products satisfy customers while others only frustrate them.',
    isbn: '9780465050659', pages: 368, language: 'English',
    rating: 4.5, reviewCount: 4180, stock: 12,
    categories: [categories[3]], isFeatured: false,
  },
  {
    id: 'book-21', title: 'Deep Work', author: 'Cal Newport',
    publisher: publishers[2], price: 749, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg',
    description: 'Rules for focused success in a distracted world. Newport argues that the ability to perform deep work is becoming increasingly rare and increasingly valuable.',
    isbn: '9781455586691', pages: 296, language: 'English',
    rating: 4.6, reviewCount: 5870, stock: 17,
    categories: [categories[3], categories[5]], isFeatured: true,
  },
  {
    id: 'book-22', title: 'You Don\'t Know JS: Scope & Closures', author: 'Kyle Simpson',
    publisher: publishers[4], price: 849, discountPct: 15,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781449335588-L.jpg',
    description: 'A deep dive into the core mechanisms of the JavaScript language. Part of the You Don\'t Know JS series.',
    isbn: '9781449335588', pages: 98, language: 'English',
    rating: 4.6, reviewCount: 2140, stock: 14,
    categories: [categories[3]], isFeatured: false,
  },
  {
    id: 'book-23', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann',
    publisher: publishers[4], price: 1499, discountPct: 22,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781449373320-L.jpg',
    description: 'The big ideas behind reliable, scalable, and maintainable systems — a must-read for backend engineers.',
    isbn: '9781449373320', pages: 616, language: 'English',
    rating: 4.9, reviewCount: 3760, stock: 8,
    categories: [categories[3]], isFeatured: true,
  },

  // ── History ───────────────────────────────────────────────────────────────
  {
    id: 'book-24', title: 'Guns, Germs, and Steel', author: 'Jared Diamond',
    publisher: publishers[3], price: 749, discountPct: 15,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780393354324-L.jpg',
    description: 'A fascinating account of why Western civilisation came to dominate the world, and what the future might hold for the world\'s peoples.',
    isbn: '9780393354324', pages: 480, language: 'English',
    rating: 4.4, reviewCount: 5980, stock: 12,
    categories: [categories[4]], isFeatured: false,
  },
  {
    id: 'book-25', title: 'The Diary of a Young Girl', author: 'Anne Frank',
    publisher: publishers[0], price: 349, discountPct: 8,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780553296983-L.jpg',
    description: 'The diary written by Anne Frank while she and her family were in hiding from 1942 to 1944 in German-occupied Netherlands.',
    isbn: '9780553296983', pages: 283, language: 'English',
    rating: 4.8, reviewCount: 9900, stock: 22,
    categories: [categories[4], categories[6]], isFeatured: false,
  },
  {
    id: 'book-26', title: 'A People\'s History of the United States', author: 'Howard Zinn',
    publisher: publishers[1], price: 899, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062397348-L.jpg',
    description: 'Tells American history from the perspective of ordinary people rather than political and military leaders.',
    isbn: '9780062397348', pages: 784, language: 'English',
    rating: 4.6, reviewCount: 4310, stock: 10,
    categories: [categories[4]], isFeatured: false,
  },

  // ── Self-Help ─────────────────────────────────────────────────────────────
  {
    id: 'book-27', title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey',
    publisher: publishers[2], price: 699, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781982137274-L.jpg',
    description: 'A business and self-help book presenting an approach to being effective in achieving goals by aligning yourself to principles.',
    isbn: '9781982137274', pages: 372, language: 'English',
    rating: 4.5, reviewCount: 8210, stock: 25,
    categories: [categories[5]], isFeatured: false,
  },
  {
    id: 'book-28', title: 'Man\'s Search for Meaning', author: 'Viktor E. Frankl',
    publisher: publishers[0], price: 399, discountPct: 10,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780807014271-L.jpg',
    description: 'A Holocaust memoir and a work of psychology that introduces logotherapy — a form of psychotherapy based on finding meaning in life.',
    isbn: '9780807014271', pages: 200, language: 'English',
    rating: 4.8, reviewCount: 10540, stock: 20,
    categories: [categories[5]], isFeatured: true,
  },
  {
    id: 'book-29', title: 'The Power of Now', author: 'Eckhart Tolle',
    publisher: publishers[1], price: 499, discountPct: 15,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781577314806-L.jpg',
    description: 'A guide to spiritual enlightenment that teaches the importance of living in the present moment and detaching from your mind.',
    isbn: '9781577314806', pages: 236, language: 'English',
    rating: 4.4, reviewCount: 6870, stock: 15,
    categories: [categories[5]], isFeatured: false,
  },

  // ── Biography ─────────────────────────────────────────────────────────────
  {
    id: 'book-30', title: 'Leonardo da Vinci', author: 'Walter Isaacson',
    publisher: publishers[2], price: 999, discountPct: 25,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781501139154-L.jpg',
    description: 'A biography of Leonardo da Vinci that reveals a man, like Einstein, whose genius bridged art and science, humanity and universe.',
    isbn: '9781501139154', pages: 624, language: 'English',
    rating: 4.6, reviewCount: 4920, stock: 11,
    categories: [categories[6]], isFeatured: false,
  },
  {
    id: 'book-31', title: 'Long Walk to Freedom', author: 'Nelson Mandela',
    publisher: publishers[0], price: 799, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780316548182-L.jpg',
    description: 'The autobiography of Nelson Mandela — from his childhood in rural South Africa to his years in prison and his eventual presidency.',
    isbn: '9780316548182', pages: 656, language: 'English',
    rating: 4.7, reviewCount: 5610, stock: 14,
    categories: [categories[6], categories[4]], isFeatured: true,
  },
  {
    id: 'book-32', title: 'The Story of My Experiments with Truth', author: 'Mahatma Gandhi',
    publisher: publishers[4], price: 349, discountPct: 0,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780807059098-L.jpg',
    description: 'Gandhi\'s autobiography covering his life from early childhood to 1921, including his experiments with truth, non-violence, and brahmacharya.',
    isbn: '9780807059098', pages: 480, language: 'English',
    rating: 4.5, reviewCount: 3870, stock: 18,
    categories: [categories[6]], isFeatured: false,
  },

  // ── Children ──────────────────────────────────────────────────────────────
  {
    id: 'book-33', title: 'The Little Prince', author: 'Antoine de Saint-Exupéry',
    publisher: publishers[0], price: 299, discountPct: 10,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780156012195-L.jpg',
    description: 'A poetic tale in which a pilot stranded in the desert meets a young prince who has fallen to Earth from a tiny asteroid.',
    isbn: '9780156012195', pages: 96, language: 'English',
    rating: 4.8, reviewCount: 13400, stock: 30,
    categories: [categories[7], categories[0]], isFeatured: true,
  },
  {
    id: 'book-34', title: 'Charlotte\'s Web', author: 'E. B. White',
    publisher: publishers[1], price: 349, discountPct: 12,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780064400558-L.jpg',
    description: 'The story of a pig named Wilbur and his friendship with a barn spider named Charlotte, a classic tale of friendship and loss.',
    isbn: '9780064400558', pages: 184, language: 'English',
    rating: 4.7, reviewCount: 8760, stock: 20,
    categories: [categories[7]], isFeatured: false,
  },
  {
    id: 'book-35', title: 'Harry Potter and the Philosopher\'s Stone', author: 'J. K. Rowling',
    publisher: publishers[2], price: 549, discountPct: 18,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781408855652-L.jpg',
    description: 'A young boy discovers he is a wizard and begins his education at Hogwarts School of Witchcraft and Wizardry.',
    isbn: '9781408855652', pages: 352, language: 'English',
    rating: 4.9, reviewCount: 22100, stock: 35,
    categories: [categories[7], categories[0]], isFeatured: true,
  },
  {
    id: 'book-36', title: 'The Jungle Book', author: 'Rudyard Kipling',
    publisher: publishers[4], price: 249, discountPct: 0,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780141325293-L.jpg',
    description: 'A collection of stories set in India about Mowgli, a boy raised by wolves, and his adventures in the jungle.',
    isbn: '9780141325293', pages: 256, language: 'English',
    rating: 4.4, reviewCount: 4200, stock: 16,
    categories: [categories[7]], isFeatured: false,
  },
  {
    id: 'book-37', title: 'Ikigai: The Japanese Secret to a Long and Happy Life', author: 'Héctor García & Francesc Miralles',
    publisher: publishers[1], price: 499, discountPct: 20,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780143130727-L.jpg',
    description: 'Brings to the West the Japanese concept of ikigai, which translates to "the happiness of always being busy" and may be the secret to long life.',
    isbn: '9780143130727', pages: 208, language: 'English',
    rating: 4.3, reviewCount: 7180, stock: 22,
    categories: [categories[5]], isFeatured: false,
  },
  {
    id: 'book-38', title: 'Zero to One', author: 'Peter Thiel & Blake Masters',
    publisher: publishers[2], price: 799, discountPct: 22,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780804139021-L.jpg',
    description: 'Notes on startups, or how to build the future. Thiel argues that doing what we already know takes the world from 1 to n, but every new creation goes from 0 to 1.',
    isbn: '9780804139021', pages: 224, language: 'English',
    rating: 4.5, reviewCount: 6340, stock: 17,
    categories: [categories[3], categories[1]], isFeatured: true,
  },
  {
    id: 'book-39', title: 'Homo Deus: A Brief History of Tomorrow', author: 'Yuval Noah Harari',
    publisher: publishers[1], price: 849, discountPct: 22,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062464316-L.jpg',
    description: 'Examines what might happen to the world when old myths are coupled with new godlike technologies such as artificial intelligence and genetic engineering.',
    isbn: '9780062464316', pages: 464, language: 'English',
    rating: 4.4, reviewCount: 5020, stock: 10,
    categories: [categories[1], categories[2]], isFeatured: false,
  },
  {
    id: 'book-40', title: 'The Art of War', author: 'Sun Tzu',
    publisher: publishers[4], price: 249, discountPct: 0,
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781590302255-L.jpg',
    description: 'An ancient Chinese military treatise dating from the 5th century BC, attributed to Sun Tzu, whose influence extends into business and management.',
    isbn: '9781590302255', pages: 288, language: 'English',
    rating: 4.6, reviewCount: 8910, stock: 28,
    categories: [categories[4], categories[1]], isFeatured: false,
  },
];

// In-memory stores
const users: Array<{ id: string; name: string; email: string; passwordHash: string; giftPoints: number }> = [];
const orders: Array<{
  id: string; userId: string; items: unknown[]; totalAmount: number;
  status: string; createdAt: string; address: unknown; paymentMethod: string;
}> = [];

// ─── Auth middleware ─────────────────────────────────────────────────────────

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorised' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string };
    (req as express.Request & { userId: string }).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400).json({ message: 'All fields required' }); return; }
  if (users.find(u => u.email === email)) { res.status(409).json({ message: 'Email already registered' }); return; }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: `user-${Date.now()}`, name, email, passwordHash, giftPoints: 100 };
  users.push(user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, giftPoints: user.giftPoints } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: 'Invalid credentials' }); return;
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, giftPoints: user.giftPoints } });
});

app.post('/api/auth/logout', authenticate, (_req, res) => {
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = users.find(u => u.id === userId);
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  res.json({ id: user.id, name: user.name, email: user.email, giftPoints: user.giftPoints });
});

// ─── Books routes ─────────────────────────────────────────────────────────────

app.get('/api/books/featured', (_req, res) => {
  res.json(books.filter(b => b.isFeatured));
});

app.get('/api/books/recommendations', (_req, res) => {
  res.json([...books].sort(() => Math.random() - 0.5).slice(0, 4));
});

app.get('/api/books', (req, res) => {
  let result = [...books];
  const { q, category, brand, sort } = req.query as Record<string, string>;
  if (q) result = result.filter(b => b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase()));
  if (category) result = result.filter(b => b.categories.some((c: { slug: string }) => c.slug === category));
  if (brand) result = result.filter(b => b.publisher.id === brand);
  if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
  res.json({ data: result, total: result.length, page: 1, limit: result.length, totalPages: 1 });
});

app.get('/api/books/:id', (req, res) => {
  const book = books.find(b => b.id === req.params.id);
  if (!book) { res.status(404).json({ message: 'Book not found' }); return; }
  res.json(book);
});

// ─── Categories & brands ──────────────────────────────────────────────────────

app.get('/api/categories', (_req, res) => res.json(categories));
app.get('/api/brands', (_req, res) => res.json(publishers));

// ─── Orders routes ────────────────────────────────────────────────────────────

app.get('/api/orders', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  res.json(orders.filter(o => o.userId === userId));
});

app.post('/api/orders', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { items, address, paymentMethod, giftPointsUsed = 0 } = req.body;
  if (!items?.length || !address || !paymentMethod) {
    res.status(400).json({ message: 'items, address and paymentMethod are required' }); return;
  }
  const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  const discount = giftPointsUsed * 0.5;
  const order = {
    id: `ord-${Date.now()}`,
    userId,
    items,
    totalAmount: Math.max(0, subtotal - discount),
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    address,
    paymentMethod,
  };
  orders.push(order);
  // Award gift points (5% of total)
  const user = users.find(u => u.id === userId);
  if (user) {
    user.giftPoints = user.giftPoints - giftPointsUsed + Math.floor(order.totalAmount * 0.05);
  }
  res.status(201).json(order);
});

app.get('/api/orders/:id', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const order = orders.find(o => o.id === req.params.id && o.userId === userId);
  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
  res.json(order);
});

app.patch('/api/orders/:id/cancel', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const order = orders.find(o => o.id === req.params.id && o.userId === userId);
  if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
  const hoursSince = (Date.now() - new Date(order.createdAt).getTime()) / 3_600_000;
  if (hoursSince > 48) { res.status(400).json({ message: 'Cannot cancel order after 48 hours' }); return; }
  if (order.status === 'cancelled') { res.status(400).json({ message: 'Order already cancelled' }); return; }
  order.status = 'cancelled';
  res.json(order);
});

// ─── Addresses ────────────────────────────────────────────────────────────────

const addresses: Array<{ id: string; userId: string; label: string; street: string; city: string; state: string; pincode: string; isDefault: boolean }> = [];

app.get('/api/addresses', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  res.json(addresses.filter(a => a.userId === userId));
});

app.post('/api/addresses', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const { label, street, city, state, pincode, isDefault = false } = req.body;
  if (isDefault) addresses.filter(a => a.userId === userId).forEach(a => { a.isDefault = false; });
  const addr = { id: `addr-${Date.now()}`, userId, label, street, city, state, pincode, isDefault };
  addresses.push(addr);
  res.status(201).json(addr);
});

// ─── Payments (mock) ──────────────────────────────────────────────────────────

app.post('/api/payments', authenticate, (req, res) => {
  const { orderId, method } = req.body;
  const fail = Math.random() < 0.05; // 5% chance of failure for realism
  setTimeout(() => {
    if (fail) {
      res.status(402).json({ status: 'failed', message: 'Payment declined' });
    } else {
      res.json({ status: 'success', transactionId: `txn-${Date.now()}`, orderId, method });
    }
  }, 800);
});

// ─── Gift points ──────────────────────────────────────────────────────────────

app.get('/api/gift-points', authenticate, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = users.find(u => u.id === userId);
  res.json({ points: user?.giftPoints ?? 0, valuePerPoint: 0.5 });
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── Start ────────────────────────────────────────────────────────────────────

// Only bind the port when run directly (not during tests)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`✅ Bookstore API running at http://127.0.0.1:${PORT}`);
  });
}

export default app;
