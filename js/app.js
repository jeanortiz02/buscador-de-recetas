
function iniciarApp() {

    const selectCategorias = document.querySelector('#categorias');
    const resultado = document.querySelector('#resultado');
    
    if(selectCategorias) {
        selectCategorias.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();

    }
    const favoritosDiv = document.querySelector('.favoritos');
    if(favoritosDiv) {
        obtenerFavoritos();
    }

    const modal = new bootstrap.Modal('#modal', {});


    // Funcion que obtiene categorias
    function obtenerCategorias() {

        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
            .then (respuesta => respuesta.json())
            .then (resultado => mostrarCategorias(resultado.categories))
            .catch(error => console.log(error))
    }

    // Funcion que muestra categoria en caso de no tener categoria el arreglo esta vacio
    function mostrarCategorias(categorias = []) {

        categorias.forEach(categoria => {
            
            const { strCategory } = categoria;
            const option = document.createElement('OPTION');
            option.value = strCategory;
            option.textContent = strCategory;
            selectCategorias.appendChild(option);
            // console.log(option);
        })
    }

    function seleccionarCategoria(e) {
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;
        fetch(url)
            .then(respuesta => respuesta.json())
            .then (resultado => mostrarRecetas(resultado.meals));
    }

    function mostrarRecetas(recetas = []) {
        
        // Limpia el HTML previo
        limpiarHTML(resultado);

        // Creando un Heading que avise si se obtiene resultados
        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'my-5', 'text-black');
        heading.textContent = recetas.length ? 'Resultados' : 'No hay resultados';
        resultado.appendChild(heading);

        // Iterar sobre las recetas
        recetas.forEach(receta => {
            // console.log(receta);

            const {idMeal, strMeal, strMealThumb} = receta;
        

            const recetaContenedor = document.createElement('DIV');
            recetaContenedor.classList.add('col-md-4');


            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaCardImagen = document.createElement('IMG');
            recetaCardImagen.classList.add('card-img-top');
            recetaCardImagen.src = strMealThumb ?? receta.img;
            recetaCardImagen.alt = `Imagen de la receta ${strMeal ?? receta.title}`;
            
            const recetaBody = document.createElement('DIV');
            recetaBody.classList.add('card-body');
            
            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.title;

            const recetaButtom = document.createElement('BUTTON');
            recetaButtom.classList.add('btn', 'btn-danger', 'w-100');
            recetaButtom.textContent = 'Ver Receta';
            // recetaButtom.dataset.bsTarget = '#modal';
            // recetaButtom.dataset.bsToggle = 'modal';
            recetaButtom.onclick = function () {
                seleccionarReceta(idMeal ?? receta.id);
            }

            // Inyectar en el código en el HTML
            recetaBody.appendChild(recetaHeading);
            recetaBody.appendChild(recetaButtom);


            recetaCard.appendChild(recetaCardImagen);
            recetaCard.appendChild(recetaBody);

            recetaContenedor.appendChild(recetaCard);

            resultado.appendChild(recetaContenedor);
            // console.log(recetaButtom);
        })
    }


    function seleccionarReceta(id) {
        // console.log(id);
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`
        fetch(url) 
            .then (respuesta => respuesta.json())
            .then (resultado => mostrarRecetasModal(resultado.meals[0]));
    }

    function mostrarRecetasModal(receta) {
        // console.log(receta);
        
        const { idMeal, strMeal, strInstructions, strMealThumb } = receta;

        // Agrega contenido al modal
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="Receta ${strMeal}"/>
            <h3 class="my-3">Instructions</h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y cantidades</h3>
        `

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');
        modalBody.appendChild(listGroup);


        // Mostrar Ingredientes y cantidades 
        for(let i = 1; i <= 20; i++) {
        
            if (receta[`strIngredient${i}`]){
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                // console.log(`${ingrediente} - ${cantidad}`);

                const ingredienteLi = document.createElement('li');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;
                listGroup.appendChild(ingredienteLi);

            }
        }

        // Botones de cerrar y favoritos
        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);

        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent = existeStorage(idMeal) ? 'Eliminar Favoritos' : 'Guardar Favoritos';
        btnFavorito.onclick = function () {

            if (existeStorage(idMeal)) {
                eliminarFavorito(idMeal);
                btnFavorito.textContent = 'Guardar Favorito';
                mostrarToast('Favorito Eliminado correctamente');
                return;
            }
            guardarFavorito({
                id : idMeal,
                title: strMeal,
                img: strMealThumb
            });
            btnFavorito.textContent = 'Eliminar Favorito';
            mostrarToast('Favorito Agregado correctamente');
        }

        const btnCerrarModal = document.createElement('BUTTON');
        btnCerrarModal.classList.add('btn', 'btn-secondary', 'col');
        btnCerrarModal.textContent = 'Cerrar';

        btnCerrarModal.onclick = function () {
            modal.hide();
        }


        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrarModal);
        
        // Muestra el modal
        modal.show();
    }

    function guardarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));

    }
    function eliminarFavorito (id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevoFavoritos = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(nuevoFavoritos));

        // Actualiza cuando se elimina un favorito 
        if(favoritosDiv) {
            limpiarHTML(favoritosDiv);
            mostrarRecetas(nuevoFavoritos);
        }
    }
    
    function existeStorage (id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some( favorito => favorito.id === id);

        
    }

    function mostrarToast (mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        toastBody.textContent = mensaje;
        const toast = new bootstrap.Toast(toastDiv);

        toast.show();
    }

    function obtenerFavoritos() {

        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        
        if(favoritos.length) {
            mostrarRecetas(favoritos);
            return;
        }

        const nofavoritos = document.createElement('P');
        nofavoritos.classList.add('text-center', 'fs-4', 'font-bold', 'mt-5');
        nofavoritos.textContent = 'No hay Favoritos aun';
        resultado.appendChild(nofavoritos);

    }

    function limpiarHTML(selector) {
        while(selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }
}

// Cuando cargue el documento iniciar APP
document.addEventListener("DOMContentLoaded", iniciarApp);