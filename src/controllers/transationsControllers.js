import {db,objectId} from "../../dbStrategy/mongo.js"
import {transSchema} from "../../schemas/transSchemas.js";
import { validateSchema } from "../../assets/validateFunctions.js";


import bcrypt from "bcrypt";
import { stringify } from "uuid";

export async function createTrasantion (req,res){
    const transation = req.body;
    const {id,name,value,description,date} =transation
    const postEhValido = validateSchema(transSchema,transation)

    if(postEhValido){
        return res.sendStatus(422)
    }

    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ', '');
    if(!token){
        return res.status(401).send("token inválido")
    }

    const sessions = await db.collection("sessions").findOne({"id":objectId(id),token})
    if(!sessions){
        return res.status(401).send("sessão não encontrada")
    }

    const user = await db.collection("user").findOne({_id : objectId(id) })
   
    const valueCripto = bcrypt.hashSync(toString(value),10)
    try {
        await db.collection("transactions").insertOne({...transation,value:valueCripto})
        res.status(201).send("transação concluída")
    } catch (error) {
        res.sendStatus(500)
    }
}