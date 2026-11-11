const productController = require("./controllers/product.controller.js");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const fs = require("fs"); //!

const uploadDir = path.join(__dirname, '/uploads'); // 3. definir pasta 
//4. verifica se a pasta de de arquivos não existe no servidor
if(!fs.existsSync(uploadDir)){
    fs.mkdir(uploadDir); //5... se não existir ele cria ela
}

//IMPORTA AS ROTAS A SEREM USADAS
const rotasVendedor = require("./routes/vendedor.route.js");
const rotasProduct = require("./routes/product.route.js");
const rotasCooperativa = require("./routes/cooperativa.route.js");
const rotasCooperativaVendedor = require("./routes/cooperativa_vendedor.route.js");
const { url } = require("inspector");
const ProductController = require("./controllers/product.controller.js");

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

//CRIA UM PONTO PARA O USO DAS ROTAS
app.use("/api", rotasVendedor);
app.use("/api", rotasProduct);
app.use("/api", rotasCooperativa);
app.use("/api", rotasCooperativaVendedor);

app.get("/status", async (req, res) => {
    res.json({ mensagem: "Funcionamento", status: 200 });
});

//9. faz o express usar o diretório de uploads 
app.use('/uploads', express.static(uploadDir));

app.listen(3000, () => console.log('ok'));

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));