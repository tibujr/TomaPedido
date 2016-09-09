$(document).ready(function () {

	//var webService = "http://168.121.51.114:81/ServiciosWeb/ServicioUsuarios.asmx/LoginUsuario";
	//var webService = "http://168.121.51.114:81/ServiciosWeb/ServicioUsuarios.asmx/ListarProductos";
	var webService = "http://168.121.51.114:81/ServiciosWeb/ServicioUsuarios.asmx/ListadoProductosJson";

	//var webService = "http://www.w3schools.com/xml/tempconvert.asmx/CelsiusToFahrenheit";

	$("body").on('click', '#aceptarLogin', function(e){

		var datosUsuario = "oswaldos"//$("#usuario").val();
		var datosPassword = "oswaldo123"//$("#clave").val();
			
		/*try{
			
			$.ajax({
				url: webService,
				type: 'POST',
				//dataType: 'xml',
				data: {user: datosUsuario, password:datosPassword},
				success: function(data){
					var dt = convertirJSON(data); 
					console.log(dt)
				},
				error: function(data){
					console.log(data)
			    }
			});

		}catch(er){
			console.log(er)
		}*/
		

		if( true ){
			$.mobile.changePage("#home");
			  
		}else{
			  
		  	/// ejecutar una conducta cuando la validacion falla
		}
		return false;
	})

	function convertirJSON(data)
	{
		var dt = new XMLSerializer().serializeToString(data);
		dt = dt.substring(dt.indexOf("["),(dt.indexOf("]")+1));
		return dt;
	}

	$("body").on('click', '#agregarCliente', function(e){
		//llena los datos a un nuevo pedido y envia al formulario nuevo pedido
		$.mobile.changePage("#FormNuevaVenta");
	});

	$("body").on('click', '#btnBuscarProducto', function(e){
		$.mobile.changePage("#FormBuscarProducto");
	});

	$("body").on('click', '#aceptarBuscarProducto', function(e){
		//obtener codigo del producto y usarlo para agregar a la nueva venta
		$.mobile.changePage("#FormNuevaVenta");
	});

	$("body").on('click', '#aceptarFrmVenta', function(e){
		//obtener codigo del producto y usarlo para agregar a la nueva venta
		Materialize.toast('Venta exitosa.', 3000)
		$.mobile.changePage("#home");
	});

	$("body").on('click', '#aceptarDespacho', function(e){
		Materialize.toast('Despacho exitoso.', 3000)
		$.mobile.changePage("#home");
	});

	$("body").on('click', '#logout', function(e){
		//history.go(0)
		$.mobile.changePage("#login");
	});

	$("body").on('click', '#aceptarSincronizar', function(e){
		//history.go(0)
		Materialize.toast('Sincronizado correctamente.', 3000)
		$.mobile.back();
 		return false;
	});

	$("body").on('click', '#marca-asistencia', function(e){
		//history.go(0)
		Materialize.toast('Asistencia registrada.', 3000)
		//$.mobile.back();
 		return false;
	});
	

	var leyendaOk = true;
	$("body").on('click', '#leyenda-plus', function(e){
		
		if(leyendaOk){
			$( ".item-leyenda" ).show(200)
		  	leyendaOk = false;
		}else{
			$( ".item-leyenda" ).hide( 200 );
			leyendaOk = true;
		}
		
	});


	$("body").on('click', '#btn-Refresh', function(e){
		console.log("refrescar")
	});


	$("body").on('click', '#btnVenderClienteNR', function(e){
		console.log( $("#nom-empNR").val());
		$.mobile.changePage("#FormNuevaVenta");
	});


	$("body").on('click', '.precio-select-dv', function(e){
		$('#modal1').openModal();
	});
	

	$("body").on('change', '#opcion-cliente', function(e){
		var a = $(this).val();
		switch(a) {
		    case "1":
		        $.mobile.changePage("#FormNuevoCliente");
		        break;
		    case "2":
		        $.mobile.changePage("#clienteNoRuta");
		        break;
		    default:
		        break;
		}
	});


	$("body").on('change', '.rdb-tipo-pago', function(e){
		//$("#radio_1").prop("checked", true) 
		var tipo = $(this).val();
		if( tipo == 'adelanto')
		{
			$("#adelanto-cont").show(200);
		}else{
			$("#adelanto-cont").hide(200);
		}
	});

	$("body").on('change', '.rdb-tipo-pago-dpc', function(e){
		//$("#radio_1").prop("checked", true) 
		var tipo = $(this).val();
		if( tipo == 'adelanto')
		{
			$("#adelanto-cont-dpc").show(200);
		}else{
			$("#adelanto-cont-dpc").hide(200);
		}
	});


	$("body").on('change', '.rdb-tipo-nc-doc', function(e){
		//$("#radio_1").prop("checked", true) 
		var tipo = $(this).val();
		if( tipo == 'ruc')
		{
			$(".depen-dni").show(200);
		}else if( tipo == 'dni'){
			$(".depen-dni").hide(200);
		}
	});
	




	/*METODOS QUE SE EJECUTARAN AL INICIAR EL APLICATIVO*/

	inicializar();

	function inicializar(){
		$('.datepicker').pickadate({
		    //selectMonths: true, // Creates a dropdown to control month
		    //selectYears: 15 // Creates a dropdown of 15 years to control year
		});

		$('select').material_select();//iniciar todos los select

		$('input.autocomplete').autocomplete({
		    data: {
		      	"Apple": null,
		      	"Microsoft": null,
		      	"Google": 'http://placehold.it/250x250'
		    }
	  	});

		/*menu cabecera*/
	  	$('.button-collapse').sideNav({
		      menuWidth: 200, // Default is 240
		      edge: 'right', // Choose the horizontal origin
		      closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
		    }
		  );

	}

	/*METODOS QUE SE EJECUTARAN AL INICIAR EL APLICATIVO*/
});
