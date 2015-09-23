$("input.fader").slider();
$("input.fader").slider('setValue', -80);

var sockIO = io();

$("input.fader").on("slide", function(event) {
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

sockIO.on('connect', function() {
$("input.fader").each(function(number, dom) {
    var slider = $(dom);
    var channel   = slider.data("channel");
    var outEvent  = slider.parents(".channel-strip").data("event");
    var parameter = slider.parents(".channel-strip").data("parameter");
    var what = JSON.stringify({
        "channel": channel,
        "setting": outEvent,
        "parameter": parameter
    });
    sockIO.emit("get", what, function(reply){
        console.log("Got reply", reply);
        slider.slider("setValue", reply);
    });
});

});
