import {Request, Response} from 'express';
import knex from '../database/conection';

class PointsController {

    async index(request: Request, response: Response){

        // utiliza-se o query por ser um  filtro
        const {city, uf, items} = request.query;

        const parsedItems = String(items).split(',').map(item => Number(item.trim()));

        const points= await knex('points')
            .join('point_items','points.id','=','point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');
        
        return response.json(points);
    }

    async show(request: Request, response: Response){
        const {id} = request.params;

        const point = await knex('points').where('id', id).first();

        //para caso não tenha encontrado nada
        // quando retornamos o status que começa com 4 quer dizer que aconteceu um erro com o usuario
        if(!point){
            return response.status(400).json({message: 'Point not found'});
        }

        /**
         * SELECT * 
         * FROM items it
         * JOIN point_items pi ON it.id = pi.item_id
         * WHERE pi.point_id = {id}
         */
        const items = await knex('items')
        .join('point_items','items.id', '=', 'point_items.item_id')
        .where('point_items.point_id', id)
        .select('items.title');

        return response.json({ point, items });
    }

    async create(request: Request, response: Response){
        // ao escrever entre {} do lado esquedo do igual eu estou desestruturando os dados que vem da pagina 
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;

        // a transanction é utilizada quando temos duas tabelas onde uma depende da outra
        // ou dois inserts seguidos
        // caso o segundo insert não de certo ele da um roll back no primeiro 
        // impedindo que ele salve os dados no banco
        const trx = await knex.transaction();

        const point ={
            name,
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };

        // quando o nome da variavel é igual ao nome do objeto eu posso utlizar a short sintaxe
        // que no caso não preciso coloca 'name: name' apenas o nome da variavel
        // no knex sempre depois que ele executa o metodo insert ele retorna os ids que foram inseridos
        const insertedIds = await trx('points').insert(point);

        const point_id = insertedIds[0];

        // point_items eu irei pegar o id das duas tabelas, no caso pega os id's dos items e o id do ponto de coleta 
        const pointItems = items.map((item_id: number) =>{
            return {
                item_id,
                point_id,
            }
        });

        await trx('point_items').insert( pointItems);

        await trx.commit();

        return response.json({
            id: point_id,
            ... point,
        });
    }

}

export default PointsController;