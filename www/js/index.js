
var app = {
    
    //battery:null,

    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
        window.addEventListener('batterystatus', app.onBatteryStatus, false);
        //app.receivedEvent('deviceready');
        app.onGPSOnOffChange();
    },




    onGPSOnOffChange: function() {

        var urlP = app.urlPost;
        var avai = "No";

        cordova.plugins.diagnostic.registerLocationStateChangeHandler(function (state) {

            console.log("Locationsxx state changed to1: " + state);

            /*avai = ""+state+"";

            if(localStorage.getItem('usu_gps') != null){ //usu != 0

                if(state == "location_off"){
                    app.onllenarAlertPopupPrincipal("img/error.png", "ACTIVAR GPS");
                }
            }else{*/
                app.onGPSOnOffLogin();
            /*}*/

        }, function (error) {
            console.error("Locationsxx Errors: " + error);
        }); 
        
    },

    onGPSOnOffLogin: function() {

        cordova.plugins.diagnostic.isGpsLocationAvailable(function(available){

            if (!available) {
                console.log("activar GPS")
            }

        }, function(error){
            
            alert("no");
        });   
        
    },






    onBatteryStatus: function(ev) {
        app.battery = {
            level: ev.level / 100,
            is_charging: ev.isPlugged
        };
    },

    receivedEvent: function(id) {

        /*$.ajax({
          url: app.webService,
          data: {user:'oswaldos', password:'oswaldo123'},
          dataType: "xml",
        }).done(function(data) {
            console.log("ok")
            console.log(data);
        });*/

        /*$.ajax({
            type: 'POST',
            dataType: 'xml', 
            data: {user:'oswaldos', password:'oswaldo123'},
            url: app.webService,
            success : function(data) {
                console.log("ok");
               $("#err").html(data);
            },
            error: function(data){
                console.log("error");
                $("#err").html( JSON.stringify(data) );
            }
        });*/
    },

    getFecha: function() {
        var dt = new Date();
        var fech = dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate();
        return fech;
    },

    getHora: function() {
        var dt = new Date();
        var fech = dt.getHours()+':'+dt.getMinutes()+':'+dt.getSeconds();
        return fech;
    },


    getFechaHora: function() {
        var dt = new Date();
        var fech = dt.getFullYear()+'-'+(dt.getMonth()+1)+'-'+dt.getDate()+' '+dt.getHours()+':'+dt.getMinutes()+':'+dt.getSeconds();
        return fech;
    }

};

app.initialize();
