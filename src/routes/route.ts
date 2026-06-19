import express from "express";
import userRouter from "./user.ts";
import accountRouter from "./account.ts";
const router = express.Router();

router.use('/user', userRouter)
router.use('/account', accountRouter)


export default router;