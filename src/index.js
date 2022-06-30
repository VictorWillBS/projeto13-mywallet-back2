import express,{json}from "express";
import cors from "cors";
import {MongoClient}from "mongodb";
import dotenv from "dotenv";
import {v4 as uuid} from "uuid";
import joi from "joi"
import bcrypt from "bcrypt";
import chalk from "chalk"

dotenv.config()
const app = express();
app.use(json());
app.use(cors());
const mongoClient = new MongoClient(process.env.MONGO_URI)
let db;

    await mongoClient.connect()
    db = mongoClient.db("my_wallet");
    

function validateSchema(schema,toValid){
    const {error}= schema.validate(toValid)
    return error
    
}


// Sign-up Route 
const signUpSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required()
})

const signInSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
})

app.post("/sign-up",async (req,res)=>{
    const {name,email,password} = req.body;
    const userData = {name,email,password};
    const cadastroEhValido = validateSchema(signUpSchema,userData);
    const criptPassword = bcrypt.hashSync(password,10);
    const usuarioJaCadastrado =  await db.collection("user").findOne({email});

    if(cadastroEhValido|| usuarioJaCadastrado){
        res.sendStatus(422)
        return
    }

    try {
        await db.collection("user").insertOne({...userData, password:criptPassword})
        res.sendStatus(201)    
    } catch (error) {
        res.sendStatus(500)
    }


})


app.post("/sign-in",async (req,res)=>{

    //FALTA FAZER CONDICAO DE SO CRIA TOKEN SE O TOKEN ANTIGO TIVER MAIS DE 1 HORA
    //USAR O TIME PRA FAZER ESSA COND
    
    const time= Date.now()

    const {email,password} = req.body;
    const loginData = {email,password}
    const loginEhValido =validateSchema(signInSchema,loginData)
    const userCadastro = await db.collection("user").findOne({email})
    const senhaEhValida = bcrypt.compareSync(password,userCadastro.password)
    const token = uuid()
    if(loginEhValido||!userCadastro){
        return res.sendStatus(422)
    }
    
    if(!senhaEhValida){
        res.status(401).send("Senha ou Email inválidos")
        return
    }

    try {
        await db.collection("user-token").insertOne({"email":userCadastro.email, token,time})
        res.status(201).send(token)
        
    } catch (error) {
        res.sendStatus(500)
        
    }


})



app.listen(5000,()=>{
    console.log(chalk.green("Servidor Funcionando"))
})