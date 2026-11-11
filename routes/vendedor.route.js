const express = require("express");
const router = express.Router();

const VendedorController = require("../controllers/vendedor.controller");

//ROTAS PARA USO DO CONTROLADOR DE VENDEDORES
router.post("/vendedor/entrar", VendedorController.entrar);
router.post("/vendedor/cadastrar", VendedorController.cadastrar);
router.get("/vendedor/listar", VendedorController.listar);
router.post("/vendedor/atualizar/:id_vendedor", VendedorController.atualizar);
router.post("/vendedor/apagar/:id_vendedor", VendedorController.apagar);

module.exports = router;