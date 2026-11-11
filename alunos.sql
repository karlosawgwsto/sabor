CREATE TABLE alunos(
  	id INT AUTO_INCREMENT PRIMARY KEY,
  	nome varchar(255),
  	altura decimal,
  	senha varchar(32)
  );

  INSERT INTO alunos (nome, altura, senha)
  VALUES("Luís Carlos", 1.80, "aluno@#");
  
  SELECT *
  FROM alunos
  WHERE nome = "Luís Carlos";