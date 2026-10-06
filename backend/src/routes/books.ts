import { Router } from 'express';
import {
  getBooks,
  getBook,
  getFeaturedBooks,
  getRecommendations,
  getCategories,
  getBrands,
} from '../controllers/booksController';

const router = Router();

router.get('/featured',        getFeaturedBooks);
router.get('/recommendations', getRecommendations);
router.get('/',                getBooks);
router.get('/:id',             getBook);

export default router;
