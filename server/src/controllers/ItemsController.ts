import {Request, Response} from 'express';
import knex from '../database/conection';

class ItemsController{
    async index(request: Request, response: Response){ 

        const items = await knex('items').select('*');
    
        // usado para colocar o caminho das imagens no campo de imagens do banco de dados 
        // items.map pega todos os dados retornados pela consulta e lista eles, assim
        // pode pegar um dado especifico e alteralo
        // nesse caso esta adicionando a URL da imagem no campo de imagem
        const serializedItems = items.map( item=>{ 
            return {
                id: item.id,
                title: item.title,
                image_url:`http://192.168.100.11:3333/uploads/${item.image}`,
            }
        });
    
        return response.json(serializedItems);
    }
}

export default ItemsController;