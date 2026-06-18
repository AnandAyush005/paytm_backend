import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";

import dns from "dns"
dns.setServers(['8.8.8.8', '8.8.4.4']);

function connectDB(){
    return mongoose.connect(`${process.env.DATABASE_URL}/paytm`)
}

const userSchema = new mongoose.Schema({

    username : {
        type : String,
        unique : true,
        required : true,
        trim : true,
        minLength : 3,
        maxLength : 30,
        lowercase : true
    },

    password : {
        type : String,
        required : true,
        trim : true,
        minLength : 6
    },

    email : {

        type : String,
        required : true,
        trim : true,
        unique : true,
        
    },

    firstName : {

        type : String,
        required : true,
        trim : true,
        maxLength : 30,

    },

    lastName : {
        type : String,
        required : true,
        trim : true,
        maxLength : 30
    },

    accountDetails : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account"
    }
})


const accountSchema = new mongoose.Schema({


    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },

    balance : {
        type : Number,
        default : 0
    },

    transactions: {
        type: [String],
        default: []
    }

})

userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});



const User = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema);


export {connectDB, User, Account}
