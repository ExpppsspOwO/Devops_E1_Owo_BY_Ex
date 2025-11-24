const db = require('../db/knex')
const bcrypt = require('bcrypt'); //12345678
const jwt = require("jsonwebtoken");//สร้าง token

exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log("1]. Login Req.body:", req.body);
    try {
        const user = await db('users').where('email', email).first();
        console.log(user);
        if (!user) {
            return res.status(401).json({message: "Invalid email or password"})
        }
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        const token = jwt.sign(
            {id: user.id, email: user.email,role: user.role},
            process.env.JWT_SECRET || "Testing123" ,
            {expiresIn:process.env.JWT_EXPIRES_IN || "1h"}
        )
        console.log(token)
        res.json({
        message:"Login successful",
        token: token,
        user:{
            id: user.id,
            email: user.email,
            name_th: user.name_th,
            role: user.role,
        },
    })
    }   catch(error){
        res.status(500).json({
            message: error.message,
        })
    }
}