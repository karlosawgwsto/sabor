use sabor_tapajos;

CREATE TABLE `produtos` (
  `id_produto` int NOT NULL AUTO_INCREMENT,
  `nome_produto` varchar(255) NOT NULL,
  `image_produto` text,
  `valor_produto` decimal(10,2) NOT NULL,
  `descricao_produto` text,
  `medida_produto` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id_produto`)
);


create table cooperativas(
id_cooperativa int auto_increment primary key,
nome_cooperativa varchar(255) not null,
localidade_cooperativa text,
telefone_cooperativa varchar(45),
email_cooperativa varchar(255)
);

create table vendedores(
id_vendedor int auto_increment primary key,
nome_vendedor varchar(255) not null,
telefone_vendedor varchar(45),
email_vendedor varchar(45),
senha_vendedor varchar(255) not null,
localidade_vendedor varchar(255),
imagem_vendedor text
);

create table cooperativas_vendedores(
	id_coopeartiva_vendedor int auto_increment Primary key,
	id_cooperativa int not null,
	id_vendedor int not null,

	constraint fk_cooperativa foreign key (id_cooperativa)
	references cooperativas(id_cooperativa)
	on delete cascade
	on update cascade,

	constraint fk_vendedor foreign key (id_vendedor)
	references vendedores(id_vendedor)
	on delete cascade
	on update cascade
);

-- testando o banco de dados

-- 1. tabela produtos
insert into produtos(nome_produto, valor_produto, descricao_produto, medida_produto)
values('leite de vaca', 15.99, 'leite natural', 'litro'),
('uvas', 19.99, 'fruta natural', 'quilo'),
('banana', 9.99, 'fruta natural', 'palma');

select *
from produtos;

update produtos
set valor_produto = 12.99,
	descricao_produto= 'bananas naturais'
where id_produto = 3;

delete
from produtos
where id_produto = 2;

-- 2. tabela cooperativas
insert into cooperativas(nome_cooperativa, localidade_cooperativa)
values('rei da manga coop', 'ramal da manga doce'),
('cenoura de ouro coop', 'ramal dos coelhos'),
('cooperartiva dos laranjais', 'PA 156');

select *
from cooperativas;

update cooperativas
set email_cooperativa = 'laranjais@coop.com'
where nome_cooperativa = 'cooperativa dos laranjais';

delete 
from cooperativas
where id_cooperativa = 1;

-- 3 tabela vendedores
insert into vendedores(nome_vendedor, telefone_vendedor, senha_vendedor)
values('jose ze', '93991302023', 'jose123');

select *
from vendedores;

update vendedores
set localidade_vendedor ='ramal 01'
where id_vendedor = 4;


-- 4 tabela cooperativas_vendedores
insert into cooperativas_vendedores(id_cooperativa, id_vendedor)
value(1, 1);

update cooperativas_vendedores
set id_cooperativa = 3,
	id_vendedor = 2
where id_cooperativa_vendedor = 1;

delete
from cooperativas_vendedores
where id_cooperativa_vendedor = 1;

select *
from cooperativas_vendedores as cv
inner join cooperativas as c on cv.id_cooperativa = c.id_cooperativa

inner join vendedores as v on cv.id_vendedor = v.id_vendedor;

select *
from vendedores;
