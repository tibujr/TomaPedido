
var app = {

    //webService: "http://168.121.51.114:81/ServiciosWeb/ServicioUsuarios.asmx?op=LoginUsuario",

    initialize: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    onDeviceReady: function() {
        app.receivedEvent('deviceready');
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
    }
};
