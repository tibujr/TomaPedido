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
		$.mobile.changePage("#home");
	});

	$("body").on('click', '#aceptarDespacho', function(e){
		$.mobile.changePage("#home");
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

	$("body").on('change', '#opcion-cliente', function(e){
		var a = $(this).val();
		console.log(a)
		switch(a) {
		    case "1":
		        $.mobile.changePage("#FormNuevoCliente");
		        break;
		    default:
		        break;
		}
	});


	$("body").on('change', '.rdb-tipo-pago', function(e){
		//$("#radio_1").prop("checked", true) 
		var a = $(this).val();
		if( $(this).val() == 'adelanto')
		{
			$("#adelanto-cont").show(200);
		}else{
			$("#adelanto-cont").hide(200);
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
	}

	/*METODOS QUE SE EJECUTARAN AL INICIAR EL APLICATIVO*/
});
