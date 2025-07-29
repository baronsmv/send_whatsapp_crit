$(document).ready(function () {
    const texts = window.dashboardTexts || {
        waitingQR: '⏳ Buscando QR...',
        scanQR: '📱 Escanea el QR para iniciar sesión',
        sessionStarted: '✅ Sesión iniciada',
        restarting: '♻️ Reiniciando...',
        resetSuccess: '✅ Mensajes reiniciados.',
        resetFail: '❌ Error al reiniciar.',
        resetSessionConfirm: '¿Estás seguro que deseas reiniciar la sesión?',
        resetDataConfirm: '¿Estás seguro que deseas reiniciar los mensajes?',
        resettingSession: '🔄 Reiniciando sesión limpia...',
        waitingNewQR: '🕐 Esperando nuevo QR...',
        resetSessionError: '❌ Error al reiniciar sesión limpia',
        sendingStatus: 'Enviando...',
    };

    $("#start-btn").click(() => {
        $("#estado").text(texts.sendingStatus);
        $.post("/ajax/send/", {delay: 5});
    });

    $("#reset-data-btn").click(() => {
        if (confirm(texts.resetDataConfirm)) {
            $("#estado").text(texts.restarting);
            $.post("/ajax/reset/", {}, () => {
                alert(texts.resetSuccess);
                updateStatus();
            }).fail(() => {
                alert(texts.resetFail);
                $("#estado").text("⚠️ Error");
            });
        }
    });

    $('#reset-session-btn').click(() => {
        if (confirm(texts.resetSessionConfirm)) {
            $('#estado').text(texts.resettingSession);
            $('#qr-image').hide();

            $.ajax({
                url: 'http://localhost:3000/reset-clean',
                method: 'POST',
                success: () => {
                    $('#estado').text(texts.waitingNewQR);
                    waitForQR();
                },
                error: () => {
                    $('#estado').text(texts.resetSessionError);
                }
            });
        }
    });

    function waitForQR() {
        $('#estado').text(texts.waitingQR);
        const poll = setInterval(() => {
            $.ajax({
                url: 'http://localhost:3000/qr',
                method: 'GET',
                success: (data) => {
                    if (data.qr) {
                        $('#qr-image').attr('src', data.qr).show();
                        $('#qr-modal').fadeIn();
                        $('#estado').text(texts.scanQR);
                    } else {
                        if ($('#qr-modal').is(':visible')) {
                            $('#qr-modal').fadeOut();
                            $('#qr-image').hide();
                            $('#estado').text(texts.sessionStarted);
                        }
                        clearInterval(poll);
                    }
                },
                error: () => {
                    console.log('🔁 QR aún no disponible...');
                }
            });
        }, 3000);
    }

    function updateStatus() {
        $.get("/ajax/status/", (data) => {
            $("#estado").text(data.estado === "listo" ? "✅ Listo" : data.estado);

            ["por-enviar-list", "enviados-list", "errores-list"].forEach(id => $(`#${id}`).empty());

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
        icon.text(list.hasClass("collapsed") ? "▶️" : "🔽");
    });

    setInterval(updateStatus, 3000);

    // Ejecutar primero:
    waitForQR();
    updateStatus();
});
