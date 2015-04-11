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
    var aux = auxInput.val();
    var channel = $(event.currentTarget).data("channel");
    var value = event.value;
    console.log("Setting Channel "+channel+" Aux "+aux+" to "+value+"dB");
    sockIO.emit('aux', 
        JSON.stringify(
                { "channel": channel, 
                  "aux": aux, 
                  "value": value
                }
        )
    );
});