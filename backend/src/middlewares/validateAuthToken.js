import jsonwebtoken from "jsonwebtoken"
import {config} from "../config.js"

export const validateAuthToken = (allowedUserTypes = []) =>{
    return (req,res,next) =>{
         try {
            //1- extraer el token de las cookies

             const {authToken} = req.cookies;
            if(!authToken){
                res.json({message: "No auth token found, you must log"})
                
            }
            
            //3- extraer la informacion del token 
            const decoded = jsonwebtoken.verify(authToken, config.JWT.secret)

            //4- verificar si el rol puede ingresar o no 
            if(!allowedUserTypes.includes(decoded.userType)){

                return res.json({message: "Acces denied" })
            }
            next()
           
         } catch (error) {
console.log("error"+ error)

            
         }
    }

}