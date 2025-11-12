import { Router } from 'express';
import nameController from '#controllers/name.controller.js';
import { protect } from '#middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/trending', nameController.getTrendingNames);
router.get('/count', nameController.getNameCounts);
router.get('/top', nameController.getTopNames);
router.get('/slug/:slug', nameController.getNameBySlug);
router.get('/region/:region', nameController.getNamesByRegion);
router.get('/religion/:religion', nameController.getNamesByReligion);
router.get('/search', nameController.searchNames);
router.get('/meaning/:name', nameController.getNameMeaning);
router.get('/suggestions/parents', nameController.getNamesByParents);
router.get('/gender/:gender', nameController.getNamesByGender);
router.get('/letter/:letter', nameController.getNamesByLetter);
router.get('/length/:length', nameController.getNamesByLength);
router.get('/popularity/:year', nameController.getNamesByPopularity);
router.get('/origin/:origin', nameController.getNamesByOrigin);
router.get('/numerology/:number', nameController.getNamesByNumerology);
router.post('/generate', nameController.generateNames);
router.get('/zodiac/:sign', nameController.getNamesByZodiac);
router.get('/element/:element', nameController.getNamesByElement);
router.get('/analysis/:name', nameController.getLetterAnalysis);
router.get('/similar/:name', nameController.getSimilarNames);
router.post('/track-view/:nameId', nameController.incrementNameView);
router.post('/track-search/:nameId', nameController.incrementSearchAppearance);

// Admin routes
router.use(protect);
router.get('/all', nameController.getAllNames);
router.post('/create', nameController.createName);
router.put('/update/:slug', nameController.updateName);
router.delete('/delete/:id', nameController.deleteName);
router.post('/import', nameController.importNames);
router.put('/trending/update', nameController.updateTrendingNames);
router.get('/statistics', nameController.getNameStatistics);
router.post('/bulk-update', nameController.bulkUpdateNames);

export default router;
