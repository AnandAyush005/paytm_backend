import express, {type Response} from "express";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import "dotenv/config";

import { signInSchema, signUpSchema, updateSchema } from "../middleware/zod.ts";
import { Account, User } from "../db/db.ts";
import authMiddleware , {type AuthRequest} from "../middleware/authMiddleware.ts";


const userRouter = express.Router();

userRouter.post('/signup', async(req : AuthRequest,res : Response)=>{

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

    const createAccount = await Account.create({

        userId : createUser._id,
    })

    if(!createUser || !createAccount){
        return res.status(411).json({
            message : "Unable to create the user or account"
        })
    }

    createUser.accountDetails = createAccount._id;
    await createUser.save();

    res.status(200).json({
        message : "User is signed up",
        id : createUser._id,
        accountId : createAccount._id
    })

})

userRouter.post('/signin', async (req : AuthRequest,res : Response)=>{

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
    }, process.env.JWT_SECRET as string);

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

userRouter.use(authMiddleware);

userRouter.put('/update', async (req : AuthRequest, res : Response) => {
    const { success, data } = updateSchema.safeParse(req.body);

    if (!success) {
        return res.status(403).json({
            message: "Invalid input"
        });
    }

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

userRouter.get('/bulk', async (req : AuthRequest,res : Response)=>{

    const filter = req.query.filter as string || "";

    const findAll = await User.find({
        $or: [
            {
                username: {
                    $regex: filter,
                    $options: "i"
                }
            },
            {
                firstName: {
                    $regex: filter,
                    $options: "i"
                }
            },
            {
                lastName: {
                    $regex: filter,
                    $options: "i"
                }
            }
        ]
    });

    if(findAll.length < 1){
        return res.status(411).json({
            message : "No user with this firstName or lastName is found"
        })
    }

    res.status(200).json({
        
        users : findAll.map((user)=>({
            username : user.username,
            firstName : user.firstName,
            lastName : user.lastName,
            _id : user._id
        })),
    })


})

userRouter.get('/user-details', async(req : AuthRequest, res : Response)=>{

    const id = req.userId;

    const details = await User.findOne({_id : id}).populate('accountDetails', '-_id -userId -transactions');

    if(!details){
        return res.status(500).json({
            message : "Unable to fetch the data"
        })
    }

    res.status(200).json(details)
})


export default userRouter;