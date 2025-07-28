$(document).ready(function () {

    waitForQR();

    $("#start-btn").click(function () {
        $("#estado").text(sendingStatus);
        $.post("/ajax/send/", {delay: 5});
    });

    $("#reset-data-btn").click(function () {
        if (confirm("¿Estás seguro que deseas reiniciar los mensajes?")) {
            $("#estado").text("♻️ Reiniciando...");
            $.post("/ajax/reset/", {}, function () {
                alert("✅ Mensajes reiniciados.");
                updateStatus();
            }).fail(function () {
                alert("❌ Error al reiniciar.");
                $("#estado").text("⚠️ Error");
            });
        }
    });

    $('#reset-session-btn').click(function () {
        if (confirm("¿Estás seguro que deseas reiniciar la sesión?")) {
            $('#estado').text('🔄 Reiniciando sesión limpia...');
            $('#qr-image').hide();

            $.ajax({
                url: 'http://localhost:3000/reset-clean',
                method: 'POST',
                success: function () {
                    $('#estado').text('🕐 Esperando nuevo QR...');
                    waitForQR();
                },
                error: function () {
                    $('#estado').text('❌ Error al reiniciar sesión limpia');
                }
            });
        }
    });

    function waitForQR() {
        $('#estado').text('⏳ Buscando QR...');
        const poll = setInterval(function () {
            $.ajax({
                url: 'http://localhost:3000/qr',
                method: 'GET',
                success: function (data) {
                    if (data.qr) {
                        $('#qr-image').attr('src', data.qr);
                        $('#qr-modal').fadeIn();
                        $('#estado').text('📱 Escanea el QR para iniciar sesión');
                    } else {
                        // Si ya no hay QR y el modal está visible, ciérralo
                        if ($('#qr-modal').is(':visible')) {
                            $('#qr-modal').fadeOut();
                            $('#estado').text('✅ Sesión iniciada');
                        }
                        clearInterval(poll);
                    }
                },
                error: function () {
                    console.log('🔁 QR aún no disponible...');
                }
            });
        }, 3000);
    }

    function updateStatus() {
        $.get("/ajax/status/", function (data) {
            $("#estado").text(data.estado === "listo" ? "✅ Listo" : data.estado);

            $("#por-enviar-list").empty();
            $("#enviados-list").empty();
            $("#errores-list").empty();

            data.por_enviar.forEach(item => {
                $("#por-enviar-list").append(`<li>📱 ${item.numero}</li>`);
            });

            data.enviados.forEach(item => {
                $("#enviados-list").append(`<li>📱 ${item.numero}</li>`);
            });

            data.errores.forEach(item => {
                $("#errores-list").append(`<li>⚠️ ${item.numero}: ${item.error}</li>`);
            });
        });
    }

    $(".toggle-header").click(function () {
        const list = $(this).next(".toggle-list");
        const icon = $(this).find(".toggle-icon");

        list.toggleClass("collapsed");

        if (list.hasClass("collapsed")) {
            icon.text("▶️");
        } else {
            icon.text("🔽");
        }
    });

    setInterval(updateStatus, 3000);
});
