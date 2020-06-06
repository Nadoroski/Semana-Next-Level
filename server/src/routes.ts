// Nete arquivo ficará todas as rotas que seram utilizadas na aplicação
import express, { request, response } from 'express';
import PointsController from './controllers/PointsController';
import ItemsController from './controllers/ItemsController';

const routes = express.Router();
const pointsController = new PointsController();
const itemsController = new ItemsController();

// sempre usar o await quando for fazer uma query para o banco de dados
// ao usar o await é obrigatorio usar o async 

routes.get('/items', itemsController.index);
routes.post('/points', pointsController.create);
routes.get('/points/:id', pointsController.show);
routes.get('/points', pointsController.index);

export default routes;