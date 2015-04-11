$("input.fader").slider();
$("input.fader").slider('setValue', -80);

var auxInput = $("#aux");
var sockIO = io();

$("#next").on("click",function() {
    var inputValue = auxInput.val();
    if (inputValue < 4) {
        auxInput.val(++inputValue);
    }
    $("input.fader").each(function (index, el) {
        $(el).slider('setValue', -80);
    });
    $(".channel-strip").data("parameter", auxInput.val());
});

$("#prev").on("click",function() {
    var inputValue = auxInput.val();
    if (inputValue > 1) {
        auxInput.val(--inputValue);
    }
    $(".channel-strip").data("parameter", auxInput.val());
});

$("input.fader").on("slideStop", function(event) {
    var slider = $(event.currentTarget);
    var channel   = slider.data("channel");
    var outEvent  = slider.parents(".channel-strip").data("event");
    var parameter = slider.parents(".channel-strip").data("parameter");
    var value = event.value;
    console.log("Setting Channel "+channel+" ("+outEvent+" "+parameter+") to "+value);
    sockIO.emit(outEvent,
        JSON.stringify(
                { "channel": channel,
                  "parameter": parameter,
                  "value": value
                }
        )
    );
});
