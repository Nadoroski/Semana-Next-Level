import express, { request, response } from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errors } from "celebrate";


const app = express();

app.use(cors());
app.use(express.json());

//request obtem dados da função 

//reponse serve para devolvermos a resposta para qq aplicação

app.use(routes);

app.use('/uploads', express.static(path.resolve(__dirname,'..', 'uploads')));

app.use(errors());

app.listen(3333);