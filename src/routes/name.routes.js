import { Router } from 'express';
import nameController from '#controllers/name.controller.js';
import { protect, validatePassKey } from '#middleware/auth.middleware.js';

const router = Router();

router.get('/trending', nameController.getTrendingNames);
router.get('/top-100', nameController.getTopNames);
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

router.use(protect);
router.use(validatePassKey('739639336427396'));
router.post('/create', nameController.createName);
router.put('/update/:id', nameController.updateName);
router.delete('/delete/:id', nameController.deleteName);
router.post('/import', nameController.importNames);
router.put('/trending/update', nameController.updateTrendingNames);

export default router;
