const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer"); // 1. chamar o multer para o codigo
const fs = require('fs'); //2. chamar o file stream(leitor de arquivo)

const ProdutoController = require("../controllers/product.controller");

const uploadDir = path.join(__dirname, '..', '/uploads'); // 3. definir pasta 
//4. verifica se a pasta de de arquivos não existe no servidor
if(!fs.existsSync(uploadDir)){
    fs.mkdir(uploadDir); //5... se não existir ele cria ela
}
//6.configura as informações de arquivos para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '_' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
    });
    //7. configura o filtro de arquivos e a pasta de armazenamento
    const upload = multer({
        storage,
        limits: {fileSize: 5 * 1024 * 1024},
        fileFilter: (req, file, cb)=>{
            const ok = ['image/jpg','image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    
            cb(ok ? null : new Error('Apenas JPG, JPEG e PNG'), ok);
        }
    });
    

//ROTAS PARA USO DO CONTROLADOR DE PRODUTOS
router.post("/produto/cadastrar", upload.single("image"), ProdutoController.cadastrar);
router.get("/produto/listar", ProdutoController.listar);
router.post("/produto/atualizar/:id", ProdutoController.atualizar);
router.post("/produto/apagar/:id", ProdutoController.apagar);

module.exports = router;