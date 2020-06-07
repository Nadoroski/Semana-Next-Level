import React, {useEffect, useState, ChangeEvent, FormEvent} from 'react';
import './styles.css';
import logo from '../../assets/logo.svg';
import {Link, useHistory} from 'react-router-dom';
import {FiArrowLeft} from 'react-icons/fi';
import { Map,TileLayer,Marker } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import DropZone from '../../components/Dropzone';

// criar um state para um array ou objeto
// manualmente informar o tipo da variavel

// interfaces criadas para informar o tipo das variaveis utilizadas para o TS
interface Item{
    id: number;
    title: string;
    image_url: string;
}
interface IBGEUFResponse{
    sigla: string;
}
interface IBGECityResponse{
    nome: string;
}

const CreatePoint = () => {

    // Const de items coletados pelos pontos
    const [items, setItems]= useState<Item[]>([]);

    //Const de Uf's para montar o select
    const [ufs, setUfs] = useState<string[]>([]);

    //Const de Cities para montar o select
    const [cities, setCities] = useState<string[]>([]);

    //Const para informar qual a UF selecionada pelo usuario
    const [selecteduf, setSelectedUf]= useState('0');

    //Const para informar qual a City selecionada pelo usuario
    const [selectedCity, setSelectedCity]= useState('0');

    //Const para informar qual a posição clicada no mapa
    const [selectedPosition, setSelectedPosition]=useState<[number, number]>([0, 0]);
    
    //Const para informar a posição inicial do usuario
    const [initialPosition, setInitialPosition]=useState<[number, number]>([0, 0]);

    //Const para guardar os dados adicionados pelo usuario
    const [formData, setFormData]=useState({
        name:'',
        email:'',
        whatsapp:''
    })

    //Const para guardar os itens selecionados pelo usuario
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    //Const para voltar a pagina
    const history = useHistory();

    //Const para pegar a imagem do estabelecimento
    const[selectedFile, setSelectedFile] = useState<File>();

    //useEffect usado para receber os item (nome e imagem) do beck-end
    useEffect(() => {
        api.get('items').then(response=>{
            setItems(response.data)
        })
    }, [])
    
    //useEffect usado para pegar todos os estados da API do IBGE
    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response=>{
            const UfInitials = response.data.map(uf=>uf.sigla);
            
            setUfs(UfInitials);
        })
    })
    
    //useEffect usado para pegar todas as cidades de um estado especifico utilizando API do IBGE
    useEffect(() => {
        //caso não tenha sido selecionado em um estado
        if(selecteduf === '0'){
            return;
        }

        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selecteduf}/municipios`).then(response=>{
            const cityNames = response.data.map(city=>city.nome);
            
            setCities(cityNames);
        })

    },[selecteduf])

    //useEffect usado para pegar a posição do usuario para carregar no mapa
    useEffect(()=>{
        navigator.geolocation.getCurrentPosition(position=>{
            
            const {latitude, longitude} = position.coords;

            setInitialPosition([latitude,longitude]);
        })
    },[])

    //Função para setar na variavel SelectedUF qual a UF que o cliente deseja colocar em seu cadastro
    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;

        setSelectedUf(uf);
    }

    //Função para setar na variavel SelectedCity qual a city i cliente deseja colocar em seu cadastro
    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;

        setSelectedCity(city);
    }

    //Função para que o usuario adicione um marker no mapa
    function handleMapClick(event: LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])
    }

    //Função para pegar os dados adicionados pelo usuario
    function handleInputChange(event:ChangeEvent<HTMLInputElement>){
        //name = nome do input - value = valor adicionado pelo usuario
        const {name, value} = event.target; 

        //ele vai adicionar os dados confome o nome dos inputs
        //que no caso são os mesmos nomes utilizados nas variaveis 
        setFormData({...formData, [name]: value})
    }
    // os '...' é um spreed operator, ele copia tudo o que tem dentro de formData e adiciona novamente 
    // no objeto para adicionar uma nova ou modificar

    //Função para pegar o id dos itens selecionados para coleta pelo usuario
    function handleSelectItem(id: number){
        //const para verificar se o usuario ja clicou naquele item
        const alredySelected = selectedItems.findIndex(item => item === id);
        
        if (alredySelected >= 0) {
            //Const para filtrar os id's e remover o id que já havia sido selecionado
            const filteredItems = selectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        }else{
            setSelectedItems([...selectedItems, id])
        }

    }

    async function handleSubmit(event: FormEvent){
        event.preventDefault();

        const {name, email, whatsapp} = formData;
        const uf = selecteduf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));
        
        if(selectedFile){
            data.append('image', selectedFile);
        }

        // const data={
        //     name, 
        //     email,
        //     whatsapp,
        //     uf,
        //     city,
        //     latitude,
        //     longitude,
        //     items,
        // }

        await api.post('points',data);

        alert('Seu ponto de coleta foi criado');
        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>
            
                <Link to="/">
                    <FiArrowLeft/>
                    Voltar para Home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <DropZone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={handleInputChange}></input>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={handleInputChange}></input>
                        </div>
                        <div className="field">
                            <label htmlFor="name">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange}></input>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                    <TileLayer 
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' 
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>

                            <select 
                                name="uf" 
                                id="uf"  
                                value={selecteduf} 
                                onChange={handleSelectUf}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>

                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>

                            <select 
                                name="city" 
                                id="city"
                                value={selectedCity}
                                onChange={handleSelectCity}>
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>

                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens a baixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                onClick={() => handleSelectItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' :  ''}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                        
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    )
}

export default CreatePoint;