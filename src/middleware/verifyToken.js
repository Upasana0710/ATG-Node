import jwt from 'jsonwebtoken';

export const verifyToken = async(req, res, next) => {
    try{
        const token = req.headers.authorization.split(" ")[1];

        const isCustomAuth = token.length < 500;

        let decodedData;

        if(token && isCustomAuth){
            decodedData = jwt.verify(token, 'test');

            req.user = decodedData.id;
        }else{
            decodedData = jwt.decode(token);

            req.user = decodedData.sub;
        }
        next();
    }catch(error){
        console.log(error);
    }
}