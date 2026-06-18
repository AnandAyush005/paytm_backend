import jwt from "jsonwebtoken";
import "dotenv/config";

async function authMiddleware(req:any, res:any, next:any) {
    try {
        const authHeader = req.headers.token;

        const token = authHeader?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "User is not logged in"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as jwt.JwtPayload;

        req.userId = decoded.id;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

export default authMiddleware;