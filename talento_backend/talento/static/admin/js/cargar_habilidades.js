
(function() {
    var checkJQuery = setInterval(function() {
        if (typeof django !== 'undefined' && django.jQuery) {
            clearInterval(checkJQuery);
            initScript(django.jQuery);
        }
    }, 100);

    function initScript($) {
        console.log("Conexión establecida con django.jQuery correctamente.");

        $(document).ready(function() {
            // Usamos un selector más amplio para detectar el cambio del puesto
            $(document).on('change', 'select[id$="puesto_actual"]', function() {
                const puestoId = $(this).val();
                if (!puestoId) return;

                console.log("Puesto detectado:", puestoId);

                fetch(`/talento/api/habilidades-puesto/${puestoId}/`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.habilidades && data.habilidades.length > 0) {
                            // Localizamos el botón de añadir fila
                            const addButton = $('.add-row a').filter(function() {
                                return $(this).closest('#mochila-group').length > 0;
                            });

                            data.habilidades.forEach((hab) => {
                                if (addButton.length > 0) {
                                    addButton[0].click();
                                    
                                    const totalForms = $('#id_mochila-TOTAL_FORMS').val() - 1;
                                    const selectHabilidad = $(`#id_mochila-${totalForms}-habilidad`);
                                    const nuevaOpcion = new Option(hab.nombre, hab.id, true, true);
                                    selectHabilidad.append(nuevaOpcion).trigger('change');
                                    $(`#id_mochila-${totalForms}-origen`).val(hab.origen);
                                   
                                }
                            });
                            console.log("Habilidades inyectadas: " + data.habilidades.length);
                        }
                    })
                    .catch(err => console.error("Error en Fetch:", err));
            });
        });
    }
})();