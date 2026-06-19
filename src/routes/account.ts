import express, { type Request, type Response } from "express"
import mongoose from "mongoose";
import authMiddleware from "../middleware/authMiddleware.js";
import { Account, User } from "../db/db.js";
import { transferSchema } from "../middleware/zod.js";
const accountRouter = express.Router();

// extend Request to include userId set by authMiddleware
interface AuthRequest extends Request {
    userId?: string
}

accountRouter.use(authMiddleware);

accountRouter.get('/balance', async (req: AuthRequest, res : Response)=>{

    const id = req.userId as string;

    const getAccount = await Account.findOne({
        userId : id
    });

    if(!getAccount){
        return res.status(500).json({
            message : "Unable to fetch the user's detail"
        })
    }

    res.status(200).json({
        userId : id,
        Balance : "₹" + getAccount.balance
    })


    
})

accountRouter.post('/addBalance', async(req : AuthRequest, res : Response)=>{

    const id = req.userId;
    const amount = Number(req.body.amount);

    const update = await Account.findOneAndUpdate({
        userId : id
    },{
        $inc : {balance : amount},
        $push : {transactions : `₹${amount} is credited by you`}
    },{
        new : true
    })

    if(!update){
        return res.status(500).json({
            message : "Unable to update the user balance"
        })
    }

    res.status(200).json({
        message :  `$₹{amount} is added in your bank account`,
        newBalance : update.balance
    })
})

accountRouter.post('/transfer', async (req: AuthRequest, res: Response) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { success, data } = transferSchema.safeParse(req.body);

        if (!success) {
            await session.abortTransaction();
            return res.status(403).json({
                message: "Invalid input"
            });
        }

        const receiver = await User.findOne({
            username: data.username
        }).session(session);

        if (!receiver) {
            await session.abortTransaction();
            return res.status(404).json({
                message: "Payee not found"
            });
        }

        const senderId = req.userId;

        if (receiver._id.toString() === senderId) {
            await session.abortTransaction();
            return res.status(403).json({
                message: "You cannot send money to yourself"
            });
        }

        const senderAccount = await Account.findOne({
            userId: senderId
        }).session(session);

        const receiverAccount = await Account.findOne({
            userId: receiver._id
        }).session(session);

        if (!senderAccount || !receiverAccount) {
            await session.abortTransaction();
            return res.status(500).json({
                message: "Account not found"
            });
        }

        if (senderAccount.balance < data.amount) {
            await session.abortTransaction();
            return res.status(411).json({
                message: "Insufficient balance"
            });
        }

        senderAccount.balance -= data.amount;
        receiverAccount.balance += data.amount;

        senderAccount.transactions.push(
            `Transferred ₹${data.amount} to ${data.username}`
        );

        receiverAccount.transactions.push(
            `Received ₹${data.amount} from ${senderId}`
        );

        await senderAccount.save({ session });
        await receiverAccount.save({ session });

        await session.commitTransaction();

        res.status(200).json({
            message: "Transfer successful"
        });

    } catch (error) {
        await session.abortTransaction();

        res.status(500).json({
            message: "Transfer failed"
        });

    } finally {
        session.endSession();
    }
});

accountRouter.get('/passbook', async(req : AuthRequest,res: Response)=>{

    const id = req.userId;

    const findAccount = await Account.findOne({
        userId : id
    })

    if(!findAccount){
        return res.status(404).json({
            message : "Unable to fetch the account details"
        })
    }

    res.status(200).json({
        balance: "₹" + findAccount.balance,
        transactions: findAccount.transactions
    })

})

export default accountRouter;