import { password } from "bun";
import z from "zod";

const signUpSchema = z.object({

    username : z.string().min(3).max(30).trim(),
    password : z.string().min(6).trim(),
    email : z.email(),
    firstName : z.string().trim().max(30).min(3),
    lastName : z.string().trim().max(30).min(3),
})

const signInSchema = z.object({

    username : z.string().min(3).max(30).trim(),
    password : z.string().min(6).trim()
})

const updateSchema = z.object({
    password : z.string().min(6).trim().optional(),
    firstName : z.string().trim().max(30).min(3).optional(),
    lastName : z.string().trim().max(30).min(3).optional(),

})

export {signInSchema, signUpSchema, updateSchema}