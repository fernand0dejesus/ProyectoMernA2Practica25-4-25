import jsonwebtoken, { decode } from "jsonwebtoken"; //Token
import bcryptjs from "bcryptjs"; //Encriptar

import clientsModel from "../models/customers.js";
import employeesModel from "../models/employee.js";

import { sendEmail, HTMLRecoveryEmail } from "../utils/mailPasswordRecovery.js";
import { config } from "../config.js";
import { verify } from "crypto";

//1- Crear un array de funciones
const passwordRecoveryController = {};

passwordRecoveryController.requestCode = async (req, res) => {
  const { email } = req.body;

  try {
    let userFound;
    let userType;

    userFound = await clientsModel.findOne({ email });
    if (userFound) {
      userType = "client";
    } else {
      userFound = await employeesModel.findOne({ email });
      if (userFound) {
        userType = "employee";
      }
    }

    if (!userFound) {
      res.json({ message: "User not found" });
    }

    //Generar un código un aleatorio
    // (El que se va a enviar)
    const code = Math.floor(10000 + Math.random() * 90000).toString();

    //Guardamos todo en un token
    const token = jsonwebtoken.sign(
      //1-¿Que voy a guardar?
      { email, code, userType, verified: false },
      //2-secret key
      config.JWT.secret,
      //3-¿Cuando expira?
      { expiresIn: "20M" }
    );

    res.cookie("tokenRecoveryCode", token, { maxAge: 20 * 60 * 1000 });

    //ULTIMO PASO => enviar el correo con el código
    await sendEmail(
      email,
      "You verification code", //Asunto
      "Hello! Remember dont forget your pass", //Cuerpo del mensaje
      HTMLRecoveryEmail(code) //HTML
    );
    res.json({ message:"email sent"})
  } catch (error) {
    console.log("error" + error);
  }
};

//funcion para verificar codigo
passwordRecoveryController.verifyCode = async(req,res) =>{
  const {code } = req.body;

  try {
    //sacar el token de las cookies 
    const token = req.cookies.tokenRecoveryCode

    //ectraer la informacion del token 
    const decoded = jsonwebtoken.verify(token, config.JWT.secret)

    console.log("este es el codigo "+ code + "este es el codigo guardado" + decoded.code)

    if(decoded.code !== code){
      return res.json({message: "Invalid code"})
    }
  //marcar el token como verificado
  const newToken = jsonwebtoken.sign(
    //que vamos a guargar
    {
      email: decoded.email,
      code:decoded.code,
      userType: decoded.userType,
      verified: true 

    },
    //secret key
    config.JWT.secret,
    //cuando expira 
    {expiresIn: "20M"}
  )
  res.cookie("tokenRecoveryCode", newToken,{maxAge: 20 * 60 * 1000 })

  //ultimo paso => enviar el corrreo con el codigo
  res.json({message: "verification code successfull"});


  res.json({message: "correo enviado"});

  } catch (error) {
    console.log("error" + error)
    
  }
}
export default passwordRecoveryController;
