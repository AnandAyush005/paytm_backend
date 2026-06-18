import express from "express";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import "dotenv/config";

import { signInSchema, signUpSchema, updateSchema } from "../middleware/zod.ts";
import { User } from "../db/db.ts";
import authMiddleware from "../middleware/authMiddleware.ts";


const userRouter = express.Router();

userRouter.post('/signup', async(req,res)=>{

    const {success, data} = signUpSchema.safeParse(req.body);

    if(!success){
        return res.status(403).json({
            message : "Invalid input"
        })
    }

    const user = await User.findOne({
        $or: [
            { username: data.username },
            { email: data.email }
        ]
    });

    if(user){
        return res.status(403).json({
            message : "User with username or email is already registered"
        })
    }


    const createUser = await User.create({

        ...data
       
    })

    if(!createUser){
        return res.status(411).json({
            message : "Unable to create the user"
        })
    }


    res.status(200).json({
        message : "User is signed up",
        id : createUser._id
    })

})

userRouter.post('/signin', async (req,res)=>{

    const {success, data} = signInSchema.safeParse(req.body);

    if(!success){
        return res.status(403).json({
            message : "Invalid input"
        })
    }

    const findUser = await User.findOne({
        username : data.username
    })

    if(!findUser){
        return res.status(404).json({
            message : "User not found"
        })
    }

    const isMatch = await bcrypt.compare(data.password, findUser.password);

    if(!isMatch){
        return res.status(404).json({
            message : "Invalid credentials"
        })
    }

    const token : string = jwt.sign({
        id : findUser._id
    }, `${process.env.JWT_SECRET}`);

    if(!token){
        return res.status(500).json({
            message : "Unable to generate the token"
        })
    }

    res.status(200).json({
        message : "User logged in",
        token : 'Bearer ' + token
    })


})

userRouter.put('/update', authMiddleware, async (req, res) => {
    const { success, data } = updateSchema.safeParse(req.body);

    if (!success) {
        return res.status(403).json({
            message: "Invalid input"
        });
    }

    //@ts-ignore
    const findUser = await User.findById(req.userId);

    if (!findUser) {
        return res.status(404).json({
            message: "No user found"
        });
    }

    if (data.firstName) findUser.firstName = data.firstName;
    if (data.lastName) findUser.lastName = data.lastName;
    if (data.password) findUser.password = data.password;

    await findUser.save();

    res.status(200).json({
        message: "User updated successfully"
    });
});

export default userRouter;