const formEntrar = document.getElementById("formEntrar");

formEntrar.addEventListener("submit", async(Event) =>{
    Event.preventDefault();

    const dados = new FormData(formEntrar);
    const objeto = Object.fromEntries(dados);

        try {
        const response = await fetch("http://localhost:3000/api/vendedor/entrar", {
            method: "POST",
            headers:{ "Content-Type": "application/json"},
            body: JSON.stringify(objeto)
        });

        const resultado = await response.json();
        
        if(!response.ok){
            throw new Error(resultado.mensagem);
        }

        console.log(resultado);
        //mostra um alerta com uma mensagem
        alert(resultado.mensagem);
        formEntr.reset(); //zera todos os campos do formulario HTML
    } catch (error) {
        console.log(error);

    }
});