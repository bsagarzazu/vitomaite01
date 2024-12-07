document.addEventListener("DOMContentLoaded", function () {
    const profilePhoto = document.getElementById("profile-photo");
    const userAvatar = document.getElementById("user-avatar");
    const name = document.getElementById("profile-name");
    const gender = document.getElementById("profile-gender");
    const city = document.getElementById("profile-city");
    const age = document.getElementById("profile-age");

    const editHobbiesModal = document.getElementById("edit-hobbies-modal");
    const addHobbiesSelect = document.getElementById("available-hobbies");
    const deleteHobbiesSelect = document.getElementById("user-hobbies");

    const closeBtn = document.getElementById("edit-hobbies-close-btn");
    closeBtn.addEventListener("click", (event) => {
        const modal = document.getElementById("edit-hobbies-modal");
        modal.style.display = "none";
    });

    const user = JSON.parse(sessionStorage.getItem("userLoggedIn"));

    profilePhoto.src = (user.image && !user.image.startsWith("data:image/png;base64,"))
            ? "data:image/png;base64," + user.image
            : user.image || "img/placeholder.jpg";
    name.textContent = "Nombre: " + user.nick;
    gender.textContent = "Género: " + (user.gender === "H" ? "Hombre" : "Mujer");
    city.textContent = user.city;
    age.textContent = "Edad: " + user.age;

    // Parte de la ciudad
    const editCityBtn = document.getElementById("editCity-btn");
    const editCity = document.getElementById("change-city-first");
    const saveCity = document.getElementById("change-city-second");
    const saveCityBtn = document.getElementById("save-city");
    const citySelect = document.getElementById("city");
    editCityBtn.addEventListener("click", (event) => {
        saveCity.style.display = "flex";
        editCity.style.display = "none";
    });
    saveCityBtn.addEventListener("click", (event) => {
        updateUserData(user.email, citySelect.value, true)
                .then(() => {
                    let newUser = JSON.parse(sessionStorage.getItem("userLoggedIn"));
                    city.textContent = newUser.city;

                    saveCity.style.display = "none";
                    editCity.style.display = "flex";
                });
    });

    getUserHobbies(user.email, true).then((selected) => displayHobbies(selected));

    const editHobbiesBtn = document.getElementById("editHobbies-btn");
    editHobbiesBtn.addEventListener("click", (event) => {
        Promise.all([getUserHobbies(user.email, true), getUserHobbies(user.email, false)])
                .then(([selected, unselected]) => {
                    fillHobbies(addHobbiesSelect, unselected);
                    fillHobbies(deleteHobbiesSelect, selected);
                    editHobbiesModal.style.display = "flex";
                });
    });

    const acceptChangesBtn = document.getElementById("accept-hobby-changes-btn");
    acceptChangesBtn.addEventListener("click", (event) => {
        const hobbiesToDelete = Array.from(deleteHobbiesSelect.options)
                .filter(option => option.selected)
                .map(option => option.value);
        const hobbiesToAdd = Array.from(addHobbiesSelect.options)
                .filter(option => option.selected)
                .map(option => option.value);

        getUserHobbies(user.email, true)
                .then((hobbies) => {
                    const newHobbyCount = hobbies.length - hobbiesToDelete.length + hobbiesToAdd.length;
                    if (newHobbyCount < 0 || newHobbyCount > 5) {
                        alert("La nueva cantidad de hobbies debe estar entre 0 y 5");
                    } else {
                        updateUserHobbies(user.email, hobbiesToDelete, false)
                                .then(message => console.log(message));
                        updateUserHobbies(user.email, hobbiesToAdd, true)
                                .then(message => console.log(message));
                        editHobbiesModal.style.display = "none";

                        // Actualizar los hobbies en el perfil
                        getUserHobbies(user.email, true)
                                .then((userHobbies) => {
                                    displayHobbies(userHobbies);
                                });
                    }
                });


    });

    //Modificar la foto
    // Obtener elemento
    const profileImageInput = document.getElementById("profileImageInput");
    const acceptPhotoChangesBtn = document.getElementById("accept-photo-changes-btn");
    const editPhotoModal = document.getElementById("edit-photo-modal");
    const imagePreviewText = document.getElementById("imagePreviewText");
    const profileImageContainer = document.getElementById("profileImageContainer");

    // Abrir modal para cambiar la foto
    document.getElementById("editPhoto-btn").addEventListener("click", () => {
        editPhotoModal.style.display = "block"; // Mostrar el modal
    });

    // Cerrar el modal
    document.getElementById("edit-photo-close-btn").addEventListener("click", () => {
        editPhotoModal.style.display = "none"; // Cerrar el modal
    });

    // Previsualizar imagen seleccionada en el contenedor 'image-container'
    profileImageInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imageUrl = e.target.result; // La imagen en Base64

                // Mostrar la imagen seleccionada en el contenedor
                profileImageContainer.innerHTML = `<img src="${imageUrl}" id="imagePreview" alt="Vista previa de la imagen" />`;
                imagePreviewText.style.display = "none"; // Ocultar texto de previsualización
            };
            reader.readAsDataURL(file);
        }
    });

    // Cuando el usuario hace clic en "Aceptar", actualizar la foto en IndexedDB y cierre el modal
    acceptPhotoChangesBtn.addEventListener("click", () => {
        const newImage = document.getElementById("imagePreview")?.src; // Obtener la imagen en Base64 desde el contenedor

        if (newImage) {
            // Establecer la imagen previsualizada en el perfil
            profilePhoto.src = newImage; // Cargar la imagen en el perfil
            userAvatar.src = newImage; // Cargar la imagen en el perfil 'user-avatar'


            updateUserData(user.email, newImage, false) // El 'false' indica que estamos actualizando la imagen
                    .then((message) => {
                        console.log(message); // Mostrar mensaje de éxito
                        editPhotoModal.style.display = "none"; // Cerrar modal
                    })
                    .catch((error) => {
                        console.error(error); // Mostrar mensaje de error
                    });
            editPhotoModal.style.display = "none";
        } else {
            alert("Por favor selecciona una imagen.");
        }
    });

});

function displayHobbies(hobbies) {
    if (hobbies && hobbies.length > 0) {
        // Extraemos solo los nombres de los hobbies
        const hobbyNames = hobbies.map(hobby => hobby.name);
        document.getElementById("hobbies").textContent = "Aficiones: " + hobbyNames.join(", ");
    } else {
        document.getElementById("hobbies").textContent = "Aficiones: No especificadas";
    }
}

function fillHobbies(selectElement, hobbies) {
    selectElement.innerHTML = '';
    hobbies.forEach(hobby => {
        const option = document.createElement('option');
        option.value = hobby.id;
        option.textContent = hobby.name;
        selectElement.appendChild(option);
    });
}

/*
 * Si includeUserHobbies = true devuelve los hobbyId y hobbyName que tiene el usuario
 * Si includeUserHobbies = false devuelve los hobbyId y hobbyName que NO tiene el usuario
 */
function getUserHobbies(userEmail, includeUserHobbies) {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open("vitomaite01", 1);

        request.onsuccess = (event) => {
            const db = event.target.result;

            // Acceder al objectStore "userHobby"
            const userHobbyStore = db.transaction("userHobby").objectStore("userHobby");
            const index = userHobbyStore.index("byEmail");
            const hobbyRequest = index.openCursor(IDBKeyRange.only(userEmail));

            const hobbyIds = [];
            hobbyRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    hobbyIds.push(cursor.value.hobbyId);
                    cursor.continue();
                } else {
                    // Una vez tengamos todos los hobbyIds, obtenemos los nombres
                    const hobbyStore = db.transaction("hobbies").objectStore("hobbies");
                    const allHobbies = [];
                    const userHobbies = [];

                    // Obtener todos los hobbies disponibles
                    const hobbyCursor = hobbyStore.openCursor();
                    hobbyCursor.onsuccess = (event) => {
                        const hobbyCursorResult = event.target.result;
                        if (hobbyCursorResult) {
                            allHobbies.push({id: hobbyCursorResult.value.hobbyId, name: hobbyCursorResult.value.hobbyName});
                            hobbyCursorResult.continue();
                        } else {
                            // Filtrar los hobbies del usuario y los que no tiene
                            allHobbies.forEach(hobby => {
                                if (hobbyIds.includes(hobby.id)) {
                                    userHobbies.push(hobby); // Hobbies que el usuario tiene
                                }
                            });

                            // Si queremos los hobbies que el usuario tiene
                            if (includeUserHobbies) {
                                resolve(userHobbies);
                            } else {
                                // Si queremos los hobbies que el usuario no tiene
                                const nonUserHobbies = allHobbies.filter(hobby => !hobbyIds.includes(hobby.id));
                                resolve(nonUserHobbies);
                            }
                        }
                    };

                    hobbyCursor.onerror = () => {
                        reject("Error al obtener los hobbies.");
                    };
                }
            };

            hobbyRequest.onerror = () => {
                reject("Error al obtener los hobbies del usuario.");
            };
        };

        request.onerror = () => {
            reject("Error al abrir la base de datos.");
        };
    });
}
/*
 * Si addHobbies = true añade los hobbies pasados como parámetro
 * Si addHobbies = false elimina los hobbies pasados como parámetro
 */
function updateUserHobbies(userEmail, hobbies, addHobbies) {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open("vitomaite01", 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            // Acceder al objectStore "userHobby" que contiene los hobbies del usuario
            const userHobbyStore = db.transaction("userHobby", "readwrite").objectStore("userHobby");

            if (addHobbies) {
                // Si addHobbies es true, añadimos los hobbies para el usuario
                hobbies.forEach(hobbyId => {
                    const hobbyRecord = {
                        userEmail: userEmail,
                        hobbyId: parseInt(hobbyId)
                    };
                    const addRequest = userHobbyStore.add(hobbyRecord);
                    addRequest.onsuccess = () => {
                        // Hobby añadido correctamente
                    };
                    addRequest.onerror = () => {
                        reject("Error al añadir hobby.");
                    };
                });
                resolve("Hobbies añadidos correctamente.");
            } else {
                // Si addHobbies es false, eliminamos los hobbies del usuario
                hobbies.forEach(hobbyId => {
                    const hobbyRequest = userHobbyStore.index("byEmail").openCursor(IDBKeyRange.only(userEmail));

                    hobbyRequest.onsuccess = (event) => {
                        const cursor = event.target.result;
                        if (cursor) {
                            // Verificamos si el hobby actual tiene el mismo ID que el hobby a eliminar
                            if (cursor.value.hobbyId === parseInt(hobbyId)) {
                                userHobbyStore.delete(cursor.primaryKey);  // Eliminar el hobby
                                console.log("Hobby eliminado: " + hobbyId);
                            }
                            cursor.continue();
                        }
                    };

                    hobbyRequest.onerror = () => {
                        reject("Error al eliminar hobby.");
                    };
                });
                resolve("Hobbies eliminados correctamente.");
            }
        };

        request.onerror = () => {
            reject("Error al abrir la base de datos.");
        };
    });
}

/*
 * Si isCity es true cambia la ciudad por data
 * Si isCity es false cambia la imagen por date
 */
function updateUserData(email, data, isCity) {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open("vitomaite01", 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            // Acceder al objectStore "users" que contiene los datos de los usuarios
            const userStore = db.transaction("users", "readwrite").objectStore("users");

            // Crear la clave de búsqueda para el índice por email
            const index = userStore.index("byEmail");
            const userRequest = index.get(email); // Buscar el usuario por email

            userRequest.onsuccess = (event) => {
                const user = event.target.result;

                if (user) {
                    if (isCity) {
                        // Si isCity es true, actualizamos la ciudad
                        user.city = data;
                        alert("Ciudad cambiada");
                    } else {
                        // Si isCity es false, actualizamos la imagen (Base64)
                        user.image = data;
                        alert("Imagen cambiada");
                    }

                    // Actualizamos el objeto usuario con los nuevos datos
                    const updateRequest = userStore.put(user);

                    updateRequest.onsuccess = () => {
                        sessionStorage.setItem("userLoggedIn", JSON.stringify(user));
                        resolve("Usuario actualizado correctamente.");
                    };

                    updateRequest.onerror = () => {
                        reject("Error al actualizar el usuario.");
                    };
                } else {
                    reject("Usuario no encontrado.");
                }
            };

            userRequest.onerror = () => {
                reject("Error al buscar el usuario.");
            };
        };

        request.onerror = () => {
            reject("Error al abrir la base de datos.");
        };
    });
}