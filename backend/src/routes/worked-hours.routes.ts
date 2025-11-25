import { Router } from 'express';
import * as workedHoursController from '../controllers/worked-hours.controller';

const router = Router();

router.get('/', workedHoursController.listWorkedHours);
router.post('/', workedHoursController.createWorkedHours);
router.put('/:id', workedHoursController.updateWorkedHours);
router.delete('/:id', workedHoursController.deleteWorkedHours);
router.get('/summary/monthly', workedHoursController.getWorkedHoursSummary);

export default router;

