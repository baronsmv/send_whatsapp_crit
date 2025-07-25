$(document).ready(function () {
    $("#start-btn").click(function () {
        $("#estado").text(sendingStatus);
        $.post("/ajax/send/", {delay: 5});
    });

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
