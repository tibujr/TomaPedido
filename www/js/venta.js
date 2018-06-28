/*document.addEventListener('deviceready', function() {

	var db = window.sqlitePlugin.openDatabase({name: 'test.db', location: 'default'});
 	db.transaction(function(tr) {
   	tr.executeSql("SELECT upper('Hola que tal') AS upperString", [], function(tr, rs) {
     	alert("Resultado upperString : " + rs.rows.item(0).upperString);
   	});

	})
 })
*/

$(document).ready(function (){

	var webService = "http://168.121.238.14:81/AMWEB/Service1.asmx/";

	var arregloRuta = new Array(); //arreglo para busqueda de empresas de ruta
	//var arregloTodoclientes = new Array(); //arreglo para busqueda clientes asignados al vendedor
	//var arregloTodoDatosclientes = new Array(); //ARREGLO QUE ALMACENA TODOS LOS CLIENTE

	var arregloTodoProductos = new Array(); //arreglo para busqueda productos en phone
	var arregloPrecioProductoAdd = new Array(); //arreglo para almacenar precios de

	var arregloPedidosNV = new Array();//almacena todos los pedidos que se van agregando a la venta

	var idClienteVenta = null;
	

	/*FUNCIONES DE BOTONES CELULAR*/

	document.addEventListener("backbutton", onBackKeyDown, false);

	function onBackKeyDown() {
	    //Handle the back button
	}

	/* FIN FUNCIONES DE BOTONES CELULAR*/

	/* METODOS QUE SE EJECUTARAN AL INICIAR EL APLICATIVO */

	inicializar();

	function inicializar()
	{
		metodosMaterialize();
		if( localStorage.getItem('usu_tp') == null || localStorage.getItem('usu_tp') == "null" ){
			localStorage.setItem('primer_login', true); //indicando que NO tiene sesion
		}
		else{
			localStorage.setItem('primer_login', false); //indicando que YA tiene sesion
			var data = 	{
							usuario: localStorage.getItem('mail_tp'),
			 				clave: localStorage.getItem('clave_tp')
			 			}
		    login(data);
		}
	}

	

	function metodosMaterialize()
	{
		$('.datepicker').pickadate({
		    //selectMonths: true, // Creates a dropdown to control month
		    //selectYears: 15 // Creates a dropdown of 15 years to control year
		});

		$('select').material_select();//iniciar todos los select

		/*menu cabecera*/
	  	$('.button-collapse').sideNav({
	      	menuWidth: 200, // Default is 240
	      	edge: 'right', // Choose the horizontal origin
	      	closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
    	});
	}

	/* FIN METODOS QUE SE EJECUTARAN AL INICIAR EL APLICATIVO */


	$("body").on('click', '#aceptarLogin', function(e){

		var data = 	{
						usuario: $("#usuario").val(),
						clave: $("#clave").val()
					};
		if(data.usuario != "" && data.clave != ""){
			login( data );
		}else{
			Materialize.toast("Usuario y clave necesarios.", 3000);
		}

		return false;
	});

	function abrirAlerta(msj)
	{
		$("#modalMensaje").openModal({
			 dismissible: false,
			 ending_top: '25%'
		});

		$("#mensaje-alerta").html(msj);
	}

	function cerrarAlerta()
	{
		$("#modalMensaje").closeModal();
	}

	function login(data)
	{
		try{
			$.ajax({
				url: webService+"Login",
				type: 'GET',
				dataType: 'json',
				data: {user: data.usuario, password:data.clave},
				beforeSend:function (){ 
					abrirAlerta("Verificando usuario...");
				},
				success: function(dataR){
					if(dataR != undefined)
					{
						if( dataR.respuesta == "true" || dataR.respuesta == true){
							$("#nombre-usuario-tp").html( dataR.alias.trim().substring(0,16)+".."); //asignando nombre
							localStorage.setItem('usu_tp', dataR.codigoVendedor.trim());
							localStorage.setItem('nombre_tp', dataR.alias.trim());
							localStorage.setItem('mail_tp', data.usuario.trim());
							localStorage.setItem('clave_tp', data.clave.trim());
							localStorage.setItem('perfil_tp', dataR.perfil.toLowerCase().trim() );
							cargarDatosLoginOK(dataR.codigoVendedor);//metodo que se ejecuta despues del login OK
							$.mobile.changePage("#home");
						}else{
							cerrarAlerta();
							Materialize.toast('Usuario o contraseña incorrecta.', 3000);
							return false;
						}
					}else{
						Materialize.toast('Error L00001. Comunicate con el administrador', 5000);
						return false;
					}
				},
				error: function(dataR){
					cerrarAlerta();
					if( localStorage.getItem('primer_login') == true || localStorage.getItem('primer_login') == "true"){
						alert( webService+"Login :" + JSON.stringify( dataR ));
						//Materialize.toast('Error L00002. Problemas de conexion con el servidor login().', 5000);
						return false;
					}else{
						cargarArregloProducto();
						cargarClientesRutaPhone();
						Materialize.toast('Verificar conexion a internet, se cargó la ultima ruta activa.', 5000);
						$.mobile.changePage("#home"); //si falla conexion carga la ultima lista de ruta 
					}
					
			    }
			});

		}catch(er){
			//alert(er);
			Materialize.toast('Error L00003. Error general, reiniciar APP.', 5000);
			return false;
		}
	}

	/* 	----------	BASE DE DATOS 	----------	 */
	function crearBaseDatos(){
		try{
			//var db = null;
			document.addEventListener('deviceready', complementoBD, errorBD);
		}
		catch(er){
			alert("ebd: "+er)
		}
	}

	function complementoBD(){
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
		    tx.executeSql('CREATE TABLE IF NOT EXISTS cliente (codCliente, razonSocial, ruc, clasificacion, giro, direccion_p, contacto, celContacto, deuda REAL, fechaDeuda, despacho, fechaUltimaVisita, contactoUltimaVisita, atendido, ruta, tipo)');
		    tx.executeSql('CREATE TABLE IF NOT EXISTS direccionCliente (codigoDir, codigoCliente, direccion)');
		    tx.executeSql('CREATE TABLE IF NOT EXISTS combo (codigo, codClase, descripcion, dpd)');
		    tx.executeSql('CREATE TABLE IF NOT EXISTS producto (codigoProd, nombreProducto, precio, precioCredito REAL, stock integer, undMedida, corte)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS productoCorte (codigoCorte, codigoProd, precio REAL, corte integer)');

			//nueva venta
			tx.executeSql('CREATE TABLE IF NOT EXISTS cabeceraVenta (codCabecera integer primary key autoincrement, codigoServer, codCliente, dirEntrega, tipoPago, tipoVenta, totalPagar REAL, igv, horaInicio, fechaHora, longitude, latitude, batery, accuracy)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS detalleVenta (codDetalleVenta integer primary key autoincrement, codCabecera integer, codigoProd, precio, cantidad integer, importe REAL)');

			//despacho
			tx.executeSql('CREATE TABLE IF NOT EXISTS factura (codFactura integer primary key autoincrement, codFacturaServer, codCliente, codVentaServer, importeFactura, estado, fechaHora)'); // estado = ("si": puede dejar el pedido sin cobrar la factura,"no": debe cobrar obligatoriamente la factura);
	  		
	  		//cobranza

	  	}, function(error) {
	  		alert("Error al crear tablas.")
		    //alert('Transaction ERROR: ' + error.message);
	  	}, function() {
		    //alert('Populated database OK');
	  	});
	}

	function errorTransac(er){
		alert(er)
	}

	function errorBD(er)
	{
		alert(er)
	}

	/* 	----------	FIN BASE DE DATOS 	----------	 */

	function cargarDatosLoginOK()
	{
		if( localStorage.getItem('primer_login') == true || localStorage.getItem('primer_login') == "true") //CAMBIAR != POR == ************************************************************************************
		{
			crearBaseDatos(); // CREA LA BASE DE DATOS SQLITE
			limpiarTablasTemporales();// LIMPIA TABLAS DESPUES DE CERRAR SESION

			localStorage.setItem('fecha_cartera', app.getFecha());

			cargarTodosClienteServer();

			if(localStorage.getItem('perfil_tp') == "venta")
			{
				cargarTodosProductoServer();//venta
				//cargarCortesProductoServer();//venta  //ya no se cargaran todos los cortes al inicio
			}
			else if(localStorage.getItem('perfil_tp') == "supervisor")// supervisor
			{
				//PUEDE HACER TODO -- VENDER Y COBRAR
				cargarTodosProductoServer();//venta
				//cargarCortesProductoServer();//venta //ya no se cargaran todos los cortes al inicio
			}
			else if(localStorage.getItem('perfil_tp') == "cobranza")
			{

			}
			else if(localStorage.getItem('perfil_tp') == "despacho")
			{
				cargarFacturaDespachoServer();//despacho
			}
		}
		else{
			cargarArregloProducto(); //CARGA LOS PRODUCTOS DE BDPHONE
			cargarCombosPhone(); //CARGA LOS COMBOS DE BDPHONE
			if( localStorage.getItem('fecha_cartera') != app.getFecha() )
			{
				limpiarTablasTemporales();
				localStorage.setItem('fecha_cartera', app.getFecha()); //asignamos fecha día
				cargarClientesRutaServer();
			}
			else{
				cargarClientesRutaPhone();
			}
		}
	}

	function limpiarTablasTemporales()
	{
		limpiarVentasBDPhone();//LIMPIAR LAS VENTAS DEL DIA ANTERIOR
		//LIMPIAR LAS FACTURAS *********

		limpiarCamposMostrar();//LIMPIA LOS CAMPOS DE BUSQUEDA
	}

	function limpiarCamposMostrar()
	{
		$("#ventasDiaCont").html(""); //LIMPIA LAS VENTAS DEL DIA A MOSTRAR
		$("#cont-clientes-ruta").html(""); //LIMPIA LOS CLIENTES DE RUTA A MOSTRAR
		$("#cont-clientes-todo").html(""); //LIMPIA TODOS CLIENTES A MOSTRAR
		$("#cont-lst-buscar-producto").html(""); //LIMPIA LA BUSQUEDA DE PRODUCTOS
	}

	function limpiarVentasBDPhone()
	{
		var vn = null;
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM cabeceraVenta');//tx.executeSql("DELETE FROM cabeceraVenta WHERE codigoServer = '"+vn]+"';", []);
			tx.executeSql('DELETE FROM detalleVenta');
	  	}, function(error){
	  		alert("Error al limpiar ventas.");
	  	}, function() {
		    //alert('Populated database OK');
	  	});
	}

	function cargarTodosClienteServer()//CARGAR TODA LA LISTA DE LOS CLIENTES DEL SERVIDOR AL TELEFONO********
	{
		//arregloTodoDatosclientes = []; //CLIENTE CON TODOS LOS DATOS
		try{
			$.ajax({
				url: webService+"ListadoClienteVendedor",
				type: 'POST',
				dataType: 'json',
				data: {codigoVendedor: localStorage.getItem('usu_tp')},
				beforeSend:function (){ 
					$("#mensaje-alerta").html("cargando lista de clientes...");
				},
				success: function(dataR){
					//arregloTodoDatosclientes = dataR; //para obtener el detalle del cliente cuando busca
					//llenarArregloClientes(dataR, ["codCliente","razonSocial"]) //arreglo para buscar clientes
					llenarClientesBDPhone(dataR); // 1) LLENA LOS CLIENTES A LA BD PHONE

					cargarDireccionesMultipleServer();//CARGA DESPUES DE CARGAR DIRECCIONES
				},
				error: function(dataR){
					Materialize.toast('Error C00001. Ruta de todos clientes servidor esta fallando.', 5000);
					return false;
			    }
			});

		}catch(er){
			Materialize.toast('Error C00002. Error general, reiniciar APP.', 5000);
			console.log(er)
			return false;
		}
	}

	/*function llenarArregloClientes(data, parametro)// sirve para buscar clientes
	{
		arregloTodoclientes = [];
		if(data.length > 0)
		{
			for (var i = 0; i < data.length; i++) {
				arregloTodoclientes.push({codigo: data[i][parametro[0]].toUpperCase().trim(), descripcion: data[i][parametro[1]].toUpperCase().trim()});		
			}
		}
	}*/

	function cargarDireccionesMultipleServer()//CARGAR TODAS LAS DIRECCIONES DE LOS CLIENTES QUE TIENEN MAS DE 2 DIRECCIONES DEL SERVIDOR AL TELEFONO********
	{
		try{
			$.ajax({
				url: webService+"ListarDireccionesMultiples",
				type: 'POST',
				dataType: 'json',
				data: {codigoVendedor: localStorage.getItem('usu_tp')},
				beforeSend:function (){
					$("#mensaje-alerta").html("Cargando direcciones de clientes...");
				},
				success: function(dataR){
					llenarDireccionesBDPhone(dataR); // 1) LLENA LOS CLIENTES A LA BD PHONE
					cargarTodosCombosServer();
				},
				error: function(dataR){
					Materialize.toast('Error F00001. Error de conexion con el servidor web cargarDireccionesMultipleServer().', 3000);
					return false;
			    }
			});

		}catch(er){
			//Materialize.toast('Error C00002. Error general, reiniciar APP.', 5000);
			console.log(er)
			return false;
		}
	}

	function cargarTodosCombosServer()
	{
		try{
			$.ajax({
				url: webService+"cargarTodosCombosServer",
				type: 'POST',
				dataType: 'json',
				data: {},
				beforeSend:function (){
					$("#mensaje-alerta").html("Cargando datos de configuración...");
				},
				success: function(dataR){
					llenarCombosBDPhone(dataR); // 2) LLENA LOS COMENTARIOS A LA BD
				},
				error: function(dataR){
					Materialize.toast('Error F00001. Error de conexion con el servidor web cargarTodosCombosServer().', 3000);
					return false;
			    }
			});

		}catch(er){
			Materialize.toast('Error CMB002. Error general, reiniciar APP.', 5000);
			console.log(er)
			return false;
		}
	}

	function cargarTodosProductoServer()
	{
		try{
			$.ajax({
				url: webService+"ListarTodosProducto",
				type: 'POST',
				dataType: 'json',
				data: {},
				beforeSend:function (){
					$("#mensaje-alerta").html("Cargando productos...");
				},
				success: function(dataR){
					llenarArregloProductos(dataR, ["codigoProd","nombreProducto"]); //arreglo para buscar clientes
					llenarProductosBDPhone(dataR);
				},
				error: function(dataR){
					Materialize.toast('Error F00001. Error de conexion con el servidor web cargarTodosProductoServer().', 3000);
					return false;
			    }
			});
		}catch(er){
			//Materialize.toast('Error C00002. Error general, reiniciar APP.', 5000);
			console.log(er)
			return false;
		}
	}

	function llenarArregloProductos(data, parametro)// llena arreglo para buscar productos
	{
		arregloTodoProductos = [];
		if(data.length > 0)
		{
			for (var i = 0; i < data.length; i++) {
				arregloTodoProductos.push({codigo: data[i][parametro[0]].toUpperCase().trim(), descripcion: data[i][parametro[1]].toUpperCase().trim() });		
			}
		}
	}

	function cargarCortesProductoServer()
	{
		try{
			$.ajax({
				url: webService+"ListarCortesProductos",
				type: 'POST',
				dataType: 'json',
				data: {},
				beforeSend:function (){
					$("#mensaje-alerta").html("Cargando cortes de productos...");
				},
				success: function(dataR){
					llenarCorteProductosBDPhone(dataR);
				},
				error: function(dataR){
					Materialize.toast('Error F00001. Error de conexion con el servidor web cargarCortesProductoServer().', 3000);
					return false;
			    }
			});
		}catch(er){
			//Materialize.toast('Error C00002. Error general, reiniciar APP.', 5000);
			console.log(er)
			return false;
		}
	}

	function cargarFacturaDespachoServer()
	{
		try{
			$.ajax({
				url: webService+"listarFacturasCliente",
				type: 'POST',
				dataType: 'json',
				data: {codigoVendedor: localStorage.getItem('usu_tp')},
				beforeSend:function (){
					$("#mensaje-alerta").html("Cargando facturas...");
				},
				success: function(dataR){
					llenarFacturaDespachoBDPhone(dataR);
				},
				error: function(dataR){
					Materialize.toast('Error F00001. Error de conexion con el servidor web cargarFacturaDespachoServer().', 3000);
					return false;
			    }
			});
		}catch(er){
			//Materialize.toast('Error C00002. Error general, reiniciar APP.', 5000);
			console.log(er)
			return false;
		}
	}

	function llenarClientesBDPhone(data)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM cliente');
		    for (var i = 0; i < data.length; i++) 
			{
				tx.executeSql('INSERT INTO cliente VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [data[i].codCliente, data[i].razonSocial, data[i].ruc, data[i].clasificacion, data[i].giro, data[i].direccion_p, data[i].contacto, data[i].celContacto, data[i].deuda, data[i].fechaDeuda, data[i].despacho, data[i].fechaUltimaVisita, data[i].contactoUltimaVisita, data[i].atendido, data[i].ruta, data[i].tipo]);
         	}	
         	cargarClientesRutaPhone();//si no se pone dentro no funciona
	  	}, function(error){
	  		alert("Error al almacenar datos del cliente.");
		}, function() {});
	}

	function llenarCombosBDPhone(data)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM combo');
		    for (var i = 0; i < data.length; i++) 
			{
				tx.executeSql('INSERT INTO combo VALUES (?,?,?,?)', [data[i].codigo, data[i].codClase, data[i].descripcion, data[i].dpd]);
         	}	
         	cargarCombosPhone();
	  	}, function(error){
	  		alert("Error al almacenar datos de combos.");
		    //alert('Transaction ERROR: ' + error.message);
	  	}, function() {});
		
	}

	function llenarDireccionesBDPhone(data)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM direccionCliente');
		    for (var i = 0; i < data.length; i++) 
			{
				tx.executeSql('INSERT INTO direccionCliente VALUES (?,?,?)', [data[i].codigoDir, data[i].codigoCliente, data[i].direccion]);
         	}	
	  	}, function(error){
	  		alert("Error al almacenar direcciones del cliente.");
		    //alert('Transaction ERROR: ' + error.message);
	  	}, function() {
		    //alert('Populated database OK');
	  	});
	}

	function llenarProductosBDPhone(data)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM producto');
		    for (var i = 0; i < data.length; i++) 
			{
				tx.executeSql('INSERT INTO producto VALUES (?,?,?,?,?,?,?)', [ data[i].codigoProd.trim(), data[i].nombreProducto.trim(), data[i].precio, data[i].precioCredito, data[i].stock, data[i].undMedida.trim(), data[i].corte.trim()]);
         	}	
	  	}, function(error){
	  		alert("Error al almacenar productos en la base de datos.");
		    //alert('Transaction ERROR: ' + error.message);
	  	}, function() {
		    //alert('Populated database OK');
	  	});
	}

	function llenarCorteProductosBDPhone(data)
	{
		//productoCorte (codigoCorte, codigoProd, precio, corte)
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM productoCorte');
		    for (var i = 0; i < data.length; i++) 
			{
				tx.executeSql('INSERT INTO productoCorte VALUES (?,?,?,?)', [data[i].codigoCorte, data[i].codigoProd, data[i].precio, data[i].corte]);
         	}	
         	//alert("corte ok");
	  	}, function(error){
	  		alert("Error al almacenar corte de productos en la base de datos.");
		    //alert('Transaction ERROR: ' + error.message);
	  	}, function() {
		    //alert('Populated database OK');
	  	});
	}

	function llenarFacturaDespachoBDPhone(data)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('DELETE FROM factura');
		    for (var i = 0; i < data.length; i++) 
			{
				//factura (codFactura integer primary key autoincrement, codFacturaServer, codCliente, codVentaServer, importeFactura, estado, fechaHora)
				tx.executeSql('INSERT INTO factura (codFacturaServer, codCliente, codVentaServer, importeFactura, estado, fechaHora) VALUES (?,?,?,?,?,?)', [data[i].codFacturaServer, data[i].codCliente, data[i].codVentaServer, data[i].importeFactura, data[i].estado, data[i].fechaHora]);
			}	
	  	}, function(error){
	  		alert("Error al almacenar facturas en la base de datos. "+error);
	  	}, function() {});
	}

	/*function cargarArregloClientes()
	{
		var data = new Array();
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM cliente',[],function(tx,result){
			    for(var i=0; i<result.rows.length; i++){
			       	data.push( result.rows.item(i) );
			    }
				//llenarArregloClientes(data, ["codCliente","razonSocial"]) //arreglo para buscar clientes
				//arregloTodoDatosclientes = data;
			});
	  	}, function(error){
	  		alert("Error al llamar datos de la Base de Datos, AC.")
	  	}, function(){});
	}*/

	function cargarArregloProducto()
	{
		var data = new Array();
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM producto',[],function(tx,result){
			    for(var i=0; i<result.rows.length; i++){
			       	data.push( result.rows.item(i) );
			    }
				llenarArregloProductos(data, ["codigoProd","nombreProducto"])
			});
	  	}, function(error){
	  		alert("Error al llamar datos de la Base de Datos, PR.")
	  	}, function(){});
	}

	function cargarClientesRutaPhone()
	{
		var data = new Array();
		$.support.cors = true;

		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM cliente WHERE ruta=?',[true],function(tx,result){
				if(result.rows.length > 0){
					for(var i=0; i<result.rows.length; i++){
			       		data.push( result.rows.item(i) );
				    }
					mostrarClientesRuta(data);
				}
				else{
					Materialize.toast('Error CLP0001. No tienes clientes en ruta para hoy.', 3000); //CLP0001 no encuentra clientes ruta.
				}
			    
			});
	  	}, function(error){
	  		alert("Error al llamar datos de la BDPhone, CRP.")
	  	}, function(){});
	}

	function cargarClientesRutaServer() // CARGA USUARIOS DE LA RUTA DEL DIA SOLO EN EL CASO DE CAMBIAR DE DIA ***********
	{
		try{
			$.ajax({
				url: webService+"ListarClienteVendedorRuta",
				type: 'POST',
				dataType: 'json',
				data: {codigoVendedor: localStorage.getItem('usu_tp')},
				beforeSend:function (){
					$("#mensaje-alerta").html("Cargando clientes de ruta...");
				},
				success: function(dataR){
					//actualizaClientesRutaPhone(dataR);	
					cambiarEstadoClienteRutaPhone(dataR);
				},
				error: function(dataR){
					cerrarAlerta();
					Materialize.toast('Error al cargar clientes de ruta.', 3000);
					$.mobile.changePage("#home");
			    }
			});
		}catch(er){
			alert("Error CLS0001. Error al cargar clientes de ruta del día.");
			return false;
		}
		
	}

	/*function actualizaClientesRutaPhone(data)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM cliente',[],function(tx,result){
				for(var i=0; i<result.rows.length; i++){
					fila=result.rows.item(i)
			       	tx.executeSql("UPDATE cliente SET atendido = 'no', ruta='"+false+"' WHERE codCliente = '"+fila['codCliente']+"';", []); //actualiza el cliente como no ruta y no atendido
			    }
			    cambiarEstadoClienteRutaPhone(data);
			});
	  	}, function(error){
	  		alert("error al actualizar clientes ruta actualizaClientesRutaPhone(). "+error)
	  	}, function(){});
	}*/

	function cambiarEstadoClienteRutaPhone(data)//ACTUALIZA ESTADO EN TABLA CLIENTES PHONE; SI NO ENCUENTRA EL CLIENTE AGREGAR A LA BD PHONE
	{
		//cargarArregloClientes(); //LLENA ARREGLO DE CLIENTES EXISTENTES
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) 
		{
			tx.executeSql("UPDATE cliente SET atendido = 'no', ruta='"+false+"' ;", []);//cambiamos a todos como no atendido y ruta(false);

			for (var i = 0; i < data.length; i++) {
				if(data[i].tipoR == "existente")// EL PARAMETRO "tipoR" VA DECIDIR SI SE AGREGA LA EMPRESA O SOLO ACTUALIZA
				{
					tx.executeSql("UPDATE cliente SET ruta='"+true+"', deuda='"+data[i].deuda+"', fechaDeuda='"+data[i].fechaDeuda+"', despacho='"+data[i].despacho+"', fechaUltimaVisita='"+data[i].fechaUltimaVisita+"', contactoUltimaVisita='"+data[i].contactoUltimaVisita+"' WHERE codCliente = '"+data[i].codCliente+"';", []); // actualizamos cliente existente
				}
				else if(data[i].tipoR == "nuevo")
				{
					/*var validar = false;//PARA VALIDAR SI EL CLIENTE ES NUEVO
					for (var j = 0; j < arregloTodoDatosclientes.length; j++) 
					{
						if (arregloTodoDatosclientes[j].codCliente == data[i].codCliente) {
							validar = true;
						}
					}

					if(validar == false){ //si no existe se agrega*/
						//validar si el cliente se encuentra en la bdphone
						tx.executeSql('INSERT INTO cliente VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [data[i].codCliente, data[i].razonSocial, data[i].ruc, data[i].clasificacion, data[i].giro, data[i].direccion_p, data[i].contacto, data[i].celContacto, data[i].deuda, data[i].fechaDeuda, data[i].despacho, data[i].fechaUltimaVisita, data[i].contactoUltimaVisita, data[i].atendido, data[i].ruta, data[i].tipo]);
					//}
				}
			}
			cargarClientesRutaPhone();
	  	}, function(error){
	  		alert("error al actualizar clientes ruta cambiarEstadoClienteRutaPhone(). "+error)
	  	}, function(){});
	}

	function cargarCombosPhone()
	{
		mostrarCombos("CS0001", "#tipo-entrega-dpc", false); //combo tipo de entrega
		mostrarCombos("CS0002", "#cbo-comentario-dpc", true); //combo comentario despacho opcion -> no cobrar
		mostrarCombos("CS0003", "#cbo-comentario-cbz", true);	//combo comentario cobranza opcion -> no pagó
	}

	function mostrarCombos(codClase, idCombo, index)
	{
		$(idCombo).html("");
		if(index == true){ $(idCombo).append('<option value="0">Sin comentarios</option>'); }

		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT codigo, descripcion FROM combo WHERE codClase=?',[codClase],function(tx,result){
				for(var i=0; i<result.rows.length; i++){
					fila=result.rows.item(i)
			       	$(idCombo).append('<option value="'+fila['codigo']+'">'+fila['descripcion']+'</option>');
			    }
			    $(idCombo).material_select();
			});
	  	}, function(error){
	  		alert("Error al llamar combo de la Base de Datos Phone.")
	  	}, function(){});
	}

	function mostrarClientesRuta(data)//MOSTRAR CLIENTES EN RUTA AL VENDEDOR****
	{
		cerrarAlerta();
		// ESTADOS DATA.ATENDIDO (SI = TIENE VENTA ESE DÍA, NO = NO TIENE VENTA, FALLA = TIENE VENTA PERO UNA FALLA EN EL ENVIO) **********
		// CREAR UN AUTOCOMPLETE PARA BUSCAR (codigo, RZ)
		$("#cont-clientes-ruta").html("")
		arregloRuta = []; //limpia
		if( data.length > 0 )
		{
			for (var i = 0; i < data.length; i++) 
			{
				arregloRuta.push({codigo:data[i].codCliente.toUpperCase().trim(), descripcion:data[i].razonSocial.toUpperCase().trim()});
				var strNI = crearItemCliente(data[i], ["nv","nd","nc","na"], "item-lista-ruta", "itm");
				$("#cont-clientes-ruta").append(strNI);
			}
		}
		else{
			Materialize.toast('No se encontraron datos empresas de RUTA,.', 3000);
			return false;
		}
	}

	function crearItemCliente(data, arrId, clase, id) //CREA ITEMPS
	{
		var strNI = '<li id="'+id+'-'+data.codCliente.toUpperCase()+'" class="'+clase+'"><div class="collapsible-header"><i class="material-icons" id="estado-cli-ruta-'+data.codCliente.toUpperCase()+'">';
				if(data.atendido == "si"){strNI += 'done';}else if(data.atendido == "falla"){strNI += 'warning';}
			    strNI += '</i><span class="razonSocialVentaGeneral"><p class="codClienteVentaGeneral">'+data.codCliente.toUpperCase()+'</p> '+ data.razonSocial.toUpperCase().substring(0,15)+'... </span><div class="estadoEmpresa"><span class="conVenta"></span>';
			    if(data.despacho == true || data.despacho == "true"){strNI += '<span class="conDespacho"></span>';}
			    if(data.deuda > 0){strNI += '<span class="conDeuda"></span>';}
			    strNI += '</div></div><div class="collapsible-body bgGray"><div style="text-align: center;">';
			    
			    if(localStorage.getItem('perfil_tp') == "venta" || localStorage.getItem('perfil_tp') == "supervisor"){ strNI += '<a class="waves-effect botonOpciones accent-color btn-clientes-venta" id="'+arrId[0]+'-'+data.codCliente+'" href="javascript:void(0)">VENDER</a>'; }
			    if(localStorage.getItem('perfil_tp') == "despacho" || localStorage.getItem('perfil_tp') == "supervisor"){ strNI += '<a class="waves-effect botonOpciones accent-color btn-clientes-despacho" id="'+arrId[1]+'-'+data.codCliente+'" href="javascript:void(0)">DESPACHAR</a>'; }
			    if(localStorage.getItem('perfil_tp') == "cobranza" || localStorage.getItem('perfil_tp') == "supervisor"){ strNI += '<a class="waves-effect botonOpciones accent-color btn-clientes-cobrar" id="'+arrId[2]+'-'+data.codCliente+'" href="javascript:void(0)">COBRAR</a>'; }
			    
			    strNI += '<a class="waves-effect botonOpciones btn-clientes-noActuar" id="'+arrId[3]+'-'+data.codCliente+'" href="javascript:void(0)" style="background: #ff9a00;">NO ACTUAR</a></div><div class="contenedor-demp">';
			    if(data.giro != "" && data.giro != null){ strNI += '<div class="cont-detEmp"><div class="para-detEmp">Giro:</div><div class="val-detEmp">'+data.giro+'</div></div>'; }
				if(data.clasificacion != "" && data.clasificacion != null){ strNI += '<div class="cont-detEmp"><div class="para-detEmp">Clasificación:</div><div class="val-detEmp">'+data.clasificacion+'</div></div>'; }
				if(data.direccion_p != "" && data.direccion_p != null){ strNI += '<div class="cont-detEmp"><div class="para-detEmp">Dirección:</div><div class="val-detEmp">'+data.direccion_p+'</div></div>'; }
				if(data.contacto != "" && data.contacto != null){ strNI += '<div class="cont-detEmp"><div class="para-detEmp">Contacto:</div><div class="val-detEmp">'+data.contacto+' <br> '+data.celContacto+'</div></div>'; }
				if(data.deuda > 0){strNI += '<div class="cont-detEmp"><div class="para-detEmp">Deuda:</div><div class="val-detEmp">S/ 203 <br> (18/07/2016)</div></div>';}
				if(data.despacho == true || data.despacho == "true"){strNI +='<div class="cont-detEmp"><div class="para-detEmp">Despacho pendiente:</div><div class="val-detEmp">SI</div></div>';}
				if(data.fechaUltimaVisita != "" && data.fechaUltimaVisita != null ){ strNI += '<div class="cont-detEmp"><div class="para-detEmp">Ultima visita:</div><div class="val-detEmp">'+data.fechaUltimaVisita; }
				if(data.contactoUltimaVisita != "" && data.contactoUltimaVisita != null ){strNI +=' <br> '+data.contactoUltimaVisita}
				strNI += '</div></div></div></div></li>';
		return strNI;
		//<div class="col s12"><a id="noCliente" class="col s12 waves-effect waves-light btn-large" style="background: #FF5252;">SIN VENTA</a></div>
	}

	$("body").on('keyup', '#buscar-ruta', function(){
		var bus = $(this).val().toUpperCase().trim();
		buscarClienteRuta("#itm-", ".item-lista-ruta", arregloRuta, bus);
	});

	function buscarClienteRuta(id, clase, arreglo, buscar)
	{
		if(buscar.length == 0){
			$(clase).show(200);
		}else{
			if(arreglo.length > 0)
			{
				for (var i = 0; i < arreglo.length; i++) 
				{
					if(arreglo[i].descripcion.indexOf(buscar) != -1 || arreglo[i].codigo.indexOf(buscar) != -1)
					{
						$(id+arreglo[i].codigo).show(200);
					}
					else{
						$(id+arreglo[i].codigo).hide(200);
					}
				}
			}
		}
	}

	$("body").on('click', '#btnBuscarClieteNR', function(){
		var bus = $("#buscarAllCliente").val().toUpperCase().trim();
		buscarClientePhone(bus);
	});

	function buscarClientePhone(palabra)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql("SELECT * FROM cliente WHERE codCliente like '%"+palabra+"%' OR razonSocial like '%"+palabra+"%' ;",[],function(tx,result){
				if(result.rows.length > 0)
				{
					for (var i = 0; i < result.rows.length; i++) {
						fila = result.rows.item(i);
						var strNI = crearItemCliente(fila, ["tnv","tnd","tnc","tnca"], "" ,"itmt");
						$("#cont-clientes-todo").append(strNI);
					}
				}else{
					$("#cont-clientes-todo").html("NO SE ENCONTRARON COINCIDENCIAS");
				}
			});
		}, function(error){
		  	alert("Error al cargar clientes. "+error);
		}, function() {});
	}

	$("body").on('keyup', '#buscarAllProducto', function(){
	//$("#buscarAllProducto").keyup(function(){
		var bus = $(this).val().toUpperCase().trim();
		buscarProducto(arregloTodoProductos, bus);
	});

	function buscarProducto(arreglo, buscar)
	{
		var na = new Array();
		$("#cont-lst-buscar-producto").html("")
		if(buscar.length > 0 && arreglo.length > 0)
		{
			for (var i = 0; i < arreglo.length; i++) 
			{
				if(arreglo[i].descripcion.indexOf(buscar) != -1 || arreglo[i].codigo.indexOf(buscar) != -1)
				{
					$("#cont-lst-buscar-producto").append('<p><input class="with-gap rdb-tipo-nc-doc" name="rdb-lst-prod" id="rdb-prod-'+arreglo[i].codigo+'" type="radio" value="'+arreglo[i].codigo+'" /><label for="rdb-prod-'+arreglo[i].codigo+'">'+arreglo[i].codigo+'<br>'+arreglo[i].descripcion+'</label></p>');
				}
			}	
		}
	}

	$("body").on('click', '.btn-clientes-despacho', function(e){
		try{
			var idStr = $(this).attr("id");
			var id = idStr.split("-");
			limpiarFormularioDespacho();
			iniciarDespacho( id[1] );
		}catch(er){
			alert(er);
		}
	});

	function limpiarFormularioDespacho()
	{
		$("#nom-emp-des").html( "" );
		$("#nom-con-des").html( "" );
		$("#nom-emp-des").html( "" );
		$("#contFacturaDespacho").html( "" );
	}

	function iniciarDespacho(codCliente)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM cliente WHERE codCliente=?',[codCliente],function(tx,result){
				if(result.rows.length > 0)
				{
					fila = result.rows.item(0);
					if(fila['despacho'] == "true" || fila['despacho'] == true)
					{
						cargarFacturaDespahoPhone(codCliente, fila); //fila = fata cliente
					}else{
						Materialize.toast('Cliente no tiene despacho pendiente.', 3000);
					}
				}
			});
		}, function(error){
		  	alert("Error al cargar información del cliente iniciarDespacho. "+error);
		}, function() {});
	}

	function cargarFacturaDespahoPhone(codCliente, dataCliente)
	{
		var dataF = new Array();
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM factura WHERE codCliente=?',[codCliente],function(tx,result){
				if(result.rows.length > 0)
				{
					for (var i = 0; i < result.rows.length; i++) {
						dataF.push( result.rows.item(i) );
					}
					llenarFormularioDespacho(codCliente, dataCliente, dataF); //dataF = data factura
					$.mobile.changePage("#VistaDespachar");
				}
			});
		}, function(error){
		  	alert("Error al cargar información de las facturas. "+error);
		}, function() {});
	}

	function llenarFormularioDespacho(codCliente, dataCliente, dataFactura)
	{
		$("#nom-emp-des").html( dataCliente['razonSocial'] );
		$("#nom-con-des").html( dataCliente['contacto'] );

		var totalPagar = 0;
		for(var i = 0; i < dataFactura.length; i++) {
			var str = crearItemFactura( dataFactura[i] );
			totalPagar += parseFloat(dataFactura[i].importeFactura);
			totalPagar = parseFloat(totalPagar.toFixed(8));
			$("#contFacturaDespacho").append(str);
		}

		$("#totalFacturaDespacho").html( formatNumber.new(totalPagar, "S/ ") );
	}

	function crearItemFactura(data)
	{
		var str = '<li><p><input type="checkbox" class="filled-in" id="fac-dv-cod-'+data['codFactura']+'" checked="checked" />';
            str += '<label for="fac-dv-cod-'+data['codFactura']+'">'+data['codFacturaServer'];
            if( data['estado'] == "si" )
            { 
            	str += '<span class="pagoContado">';
            }
            else if( data['estado'] == "no" )
            { 
            	str += '<span class="pagoCredito">';
            }
            str += '</span></label></p><span class="precio-fac-dpc">S/ '+data['importeFactura']+'</span></li>';
		return str;
	}

	$("body").on('click', '.btn-clientes-cobrar', function(e){
		$.mobile.changePage("#VistaCobrar");
	});

	$("body").on('click', '.btn-clientes-noActuar', function(e){
		//$.mobile.changePage("#VistaCobrar");
		$("#modalNoActuar").openModal()
		console.log("no actuar")
	});
	
	$("body").on('click', '.btn-clientes-venta', function(e){
		var idStr = $(this).attr("id");
		var id = idStr.split("-")
		localStorage.setItem('horaInicio_tp', app.getHora());//hora de inicio de la venta
		validarIniciarNuevaVenta( id[1] );
	});

	function validarIniciarNuevaVenta(codCliente)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM cliente WHERE codCliente=?',[codCliente],function(tx,result){
				if(result.rows.length > 0)
				{
					fila = result.rows.item(0);
					switch( fila['atendido'] ){
					    case "si":
					        Materialize.toast('Cliente ya ha sido atendido.', 3000);
					        break;
					    case "no":
					        cargarDireccionesClientePhone(codCliente, fila); //fila = datosCliente
					        break;
				        case "falla":
					        Materialize.toast('Tiene una venta por sincronizar con el cliente.', 3000);
					        break;
					    default:
					        break;
					}
				}
			});
		}, function(error){
		  	alert("Error al cargar información del cliente. "+error);
		}, function() {});
	}

	function cargarDireccionesClientePhone(codCliente, dataCliente)
	{
		//codigoDir, codigoCliente, direccion
		var dataD = new Array();
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM direccionCliente WHERE codigoCliente=?',[codCliente],function(tx,result){
				if(result.rows.length > 0)
				{
					for (var i = 0; i < result.rows.length; i++) {
						dataD.push( result.rows.item(i) );
					}
				}else{
					dataD = [];
				}
				iniciarNuevaVenta(codCliente, dataCliente, dataD); //dataD = DataDirecciones
			});
		}, function(error){
		  	alert("Error al actualizar respuesta server. "+error);
		}, function() {});
	}

	var clienteRuta = true; //valida si el cliente que le esta viendiendo esta en ruta.

	function iniciarNuevaVenta(codCliente, dataCliente, dataDirec)
	{
		idClienteVenta = codCliente; //OBTENEMOS CODIGO DEL CLIENTE NUEVA VENTA
		limpiarFormularioNuevaVenta()//limpiar todos los datos 

		$("#id-cliente-nv").val(idClienteVenta);
		$("#ruc-cliente-nv").val(dataCliente['ruc']);//ruc para realizar la consulta de corte producto

		$("#razon-social-nv").val(dataCliente['razonSocial'])

		if(dataDirec.length > 0)
		{
			$("#select-direcccion-nv").show();
			$("#input-direcccion-nv").hide();

			var strCbo = 	'<select id="sel-direccion-nv">';
			for (var i = 0; i < dataDirec.length; i++) {
				strCbo += '<option value="'+dataDirec[i].codigoDir+'">'+dataDirec[i].direccion+'</option>';
            }
            strCbo += '</select><label>Dirección de entrega</label>';
            $("#select-direcccion-nv").html(strCbo);
			$("#sel-direccion-nv").material_select();
		}
		else{
			$("#select-direcccion-nv").hide();
			$("#input-direcccion-nv").show();

			$("#inp-direccion-nv").val(dataCliente['direccion_p'])
		}

		clienteRuta = dataCliente['ruta']; //indicamos si el cliente esta en ruta o no

		if(dataCliente['tipo'] == "empresa")
		{
			$("#rdb-factura").prop("checked", true);
		}
		else if(dataCliente['tipo'] == "persona")
		{
			$("#rdb-boleta").prop("checked", true);
		}

		$.mobile.changePage("#FormNuevaVenta");
	}

	function limpiarFormularioNuevaVenta()
	{
		arregloPedidosNV = []; //limpia arreglo de ventas
		$("#id-cliente-nv").val(0);
		$("#ruc-cliente-nv").val(0);
		$("#razon-social-nv").val("");
		$("#inp-direccion-nv").val("");
		$("#sel-direccion-nv").html("");
		$("#rdb-efectivo").prop("checked", true);
		$("#rdb-boleta").prop("checked", true);
		$("#cont-lst-prod-add").html("");
		$("#codigo-producto-nv").val("");
		$("#precio-prod-imp-lst").html(0)
	}

	$("body").on('click', '#agregarCliente', function(e){
		//llena los datos a un nuevo pedido y envia al formulario nuevo pedido
		//$.mobile.changePage("#FormNuevaVenta");

		var obj =  {
					codVendedor: localStorage.getItem('usu_tp'),
					numeroDocumento: $("#ndoc-ncli").val(),
					nombre: $("#cliente-ncli").val(),
					direccion: $("#direccion-ncli").val(),
					codClase: $("#opcion-clase-cliente").val()
					};
		guardarNuevoCliente(obj);
	});

	function guardarNuevoCliente(dataNC)
	{
		try{
			$.ajax({
				url: webService+"guardarNuevoCliente",
				type: 'POST',
				dataType: 'json',
				data: {datos: dataNC},
				beforeSend:function (){
					abrirAlerta("Guardando cliente...");
				},
				success: function(dataR){
					cerrarAlerta();
					Materialize.toast('Cliente guardado con éxito.', 3000);
					$.mobile.changePage("#home"); //QUE VAYA A NUEVA VENTA
				},
				error: function(dataR){
					cerrarAlerta();
					Materialize.toast('Error al guardar cliente en el servidor.', 3000);
					return false;
			    }
			});
		}catch(er){
			alert("Error NC0001. Error al guardar nuevo cliente guardarNuevoCliente().");
			return false;
		}
	}

	$("body").on('click', '#btnBuscarProducto', function(e){
		$.mobile.changePage("#FormBuscarProducto");
	});

	$("body").on('click', '#aceptarBuscarProducto', function(e){
		//obtener codigo del producto y usarlo para agregar a la nueva venta
		var codProd = $("input[name=rdb-lst-prod]:checked").val()
		if(codProd != undefined){
			$("#codigo-producto-nv").val(codProd);
			//console.log(codProd)
			$.mobile.back();
			//$.mobile.changePage("#FormNuevaVenta");
		}
		else{
			Materialize.toast('Debe seleccionar un producto.', 3000);
		}
		
	});

	$("body").on('click', '#aceptarFrmVenta', function(e){
		if (arregloPedidosNV.length > 0)
		{
			/*try{
				//cordova.plugins.diagnostic.isGpsLocationAvailable( function(available){
				//cordova.plugins.diagnostic.isLocationEnabled( function(available){
				cordova.plugins.diagnostic.isGpsLocationEnabled( function(available){
				    if(!available) {
						alert("Por favor activar GPS");       
				    }else{*/
						navigator.geolocation.getCurrentPosition(geolocationOk,geolocationError,{ maximumAge: 10000, timeout: 30000, enableHighAccuracy: true });
					/*}
		       }, function(error){
		       	alert("Error general, por favor reportar al administrador.");
		       });
			}catch(er){
				alert( JSON.stringify(er));
			} */
		}
		else{
			Materialize.toast('No hay productos en la lista.', 3000);
			return false;
		}
	});

	function diagnosticOk()
	{

	}

	function getLocation()//
	{
		var dataLocalizacion = {
								fechaHora: app.getFechaHora(), 
								longitude: "-12.122741666666665", 
								latitude: "-77.02855833333334",
								batery: 0.87, 
								accuracy: 7.0000
							};
		return dataLocalizacion
	}

	function geolocationError(error)
	{
		alert('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
	}

	function geolocationOk(position)
	{
		var dataLocalizacion = {
								fechaHora: app.getFechaHora(), 
								longitude: position.coords.longitude, 
								latitude: position.coords.latitude,
								batery: app.battery.level, 
								accuracy: position.coords.accuracy
							};
		previoGuardarNuevaVentaPhone(dataLocalizacion);
	}

	function previoGuardarNuevaVentaPhone(dataLocalizacion)
	{
		var dirEntrega = $("#inp-direccion-nv").val();
		if(dirEntrega == "")
		{
			dirEntrega = $("#sel-direccion-nv option:selected").text();
		}

		if(dirEntrega != ""){
			var codCliente = $("#id-cliente-nv").val();
		
			var tipoPago = $("input[name=rdb-tipo-pago-nv]:checked").val();
			var tipoVenta = $("input[name=rdb-tipo-venta-nv]:checked").val();

			var dataCabeceraVenta = {
										//codigoVendedor: localStorage.getItem('usu_tp'),
										//nombrevendedor: localStorage.getItem('nombre_tp'),
										codCliente: codCliente, 
										dirEntrega: dirEntrega, //por ahora no**
										//clienteRuta: clienteRuta,//VARIABLE GLOBAL QUE INDICA SI EL CLIENTE ESTA EN RUTA.
										tipoPago:tipoPago, //EFECTIVO, CREDITO
										tipoVenta:tipoVenta, //BOLETA o FACTURA
										igv: true //siempre va ser precio con IGV

									};
			//alert( JSON.stringify(dataLocalizacion) );
			guardarNuevaVentaPhone(dataCabeceraVenta, dataLocalizacion);
		}
		else{
			Materialize.toast('Verificar dirección de entrega.', 3000);
			return false;
		}
	}

	function guardarNuevaVentaPhone(dataC, dataL)
	{
		var detalleV = arregloPedidosNV; //para guardar el detalle de venta
		guardarCabeceraVentaPhone(dataC, dataL, detalleV);//GUARDAR CABECERA EN LA BD PHONE
		limpiarFormularioNuevaVenta();
	}

	function guardarCabeceraVentaPhone(dataC, dataL, detalleV)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql("UPDATE cliente SET fechaUltimaVisita = '"+app.getFecha()+"' WHERE codCliente = '"+dataC.codCliente+"';", []); //ACTUALIZAR FECHA ULTIMA VISITA CLIENTE
		    tx.executeSql('INSERT INTO cabeceraVenta (codCliente, dirEntrega, tipoPago, tipoVenta, igv, horaInicio, fechaHora, longitude, latitude, batery, accuracy) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [dataC.codCliente, dataC.dirEntrega, dataC.tipoPago, dataC.tipoVenta, dataC.igv, localStorage.getItem('horaInicio_tp'), dataL.fechaHora, dataL.longitude, dataL.latitude, dataL.batery, dataL.accuracy]);
         	tx.executeSql('SELECT * FROM cabeceraVenta ORDER BY codCabecera DESC LIMIT 1 ',[],function(tx,result){
					fila=result.rows.item(0);
					guardarDetalleVentaPhone(fila['codCabecera'], detalleV, dataC, dataL);//GUARDAR EL DETALLE EN LA BD PHONE  Y ACTUALIZAR EL TOTAL A PAGAR
			});
	  	}, function(error){
	  		//alert("Error al guardar cabecera venta en el telefono.");
	  		alert(error)
	  	}, function() {});

	}

	function guardarDetalleVentaPhone(codCabecera, detalleV, dataC, dataL)
	{
		var totalPagar = 0;
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
		    for (var i = 0; i < detalleV.length; i++) 
			{
				var precio = detalleV[i].precio;
				if(detalleV[i].precioN > 0 ){ precio = detalleV[i].precioN; }
				tx.executeSql('INSERT INTO detalleVenta (codCabecera, codigoProd, precio, cantidad, importe) VALUES (?,?,?,?,?)', [codCabecera, detalleV[i].codigo, precio, detalleV[i].cantidad, detalleV[i].importe]);
         		
         		totalPagar += parseFloat(detalleV[i].importe);
				totalPagar = parseFloat(totalPagar.toFixed(8));
         	}
         	tx.executeSql("UPDATE cabeceraVenta SET totalPagar = '"+formatNumber.new(totalPagar)+"' WHERE codCabecera = '"+codCabecera+"';", []); //ACTUALIZAR EL TOTAL A PAGAR

         	//DATOS QUE SE ENVIARAN AL SERVER - ALTOMAYO
         	var dataCServer= { //cabecera nueva
								codigoVendedor: localStorage.getItem('usu_tp'),
								nombreVendedor: localStorage.getItem('nombre_tp'),
								codCliente: dataC.codCliente,
								rutax: clienteRuta,//clienteRuta variable global
								total: totalPagar,
								horaInicio: localStorage.getItem('horaInicio_tp'),
								fecha: app.getFechaHora()
							};	
							//arregloPedidosNV = codigo: codigo, nombre:nombre, precio: precio, precioN:0, cantidad:cantidad, importe:importe
         	guardarNuevaVentaServer(codCabecera, dataCServer, dataL, detalleV);//guardarNuevaVentaServer(codCabecera, dataC, dataL, detalleV);
	  	}, function(error){
	  		alert("Error al almacenar detalle de venta."+ error);
	  	}, function() {});
	}

	function guardarNuevaVentaServer(codCabecera, dataC, dataL, detalleV)//dataC, dataL, detalleV
	{
		try{
			$.ajax({
				url: webService+"GuardarNuevaVenta",
				type: 'POST',
				dataType: 'json',
				data: {codigoVendedor:localStorage.getItem('usu_tp'), cabecera:JSON.stringify(dataC), localizacion:JSON.stringify(dataL), detalle:JSON.stringify(detalleV)}, //enviar los arreglos en string
				beforeSend:function (){ 
					abrirAlerta("Guardando venta en el servidor...");
				},
				success: function(dataR){
					switch(dataR['respuesta']) {
					    case "ok": // ok = sin problemas
					        actualizarRespuestaVentaServer(codCabecera, dataC.codCliente, dataR['codVenta']);
							Materialize.toast('La venta se ha guardado con éxito.', 3000);
					        break;
					    case "error": //existeVenta = el cliente ya a sido atendido ese día
					    	actualizarRespuestaVentaServer(codCabecera, dataC.codCliente, null);//luego vemos que acción realizara esta opcion*****(eliminar venta phone, enviar correo, etc.)
					    	alert("ocurrio un error al momento de guardar la venta en el servidor");
					        break;
					    default:
					        break;
					}
				},
				error: function(dataR){
					actualizarRespuestaVentaServer(codCabecera, dataC.codCliente, null);
					Materialize.toast('Error al enviar venta al servidor, por favor sincronizar luego.', 4000);
					return false;
			    }
			});
		}catch(er){
			alert("Error NV00001. Problemas con el metodo guardarNuevaVentaServer().");
			return false;
		}
	}

	function actualizarRespuestaVentaServer(codCabecera, codCliente, codVenta)
	{
		//CAMBIAR ATENDIDO A "si" o "falla" o "no" --> DEPENDE SI GUARDA A LA BD SERVER****
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			if(codVenta != null)
			{
		    	tx.executeSql("UPDATE cabeceraVenta SET codigoServer ='"+codVenta+"' WHERE codCabecera = '"+codCabecera+"' ;", []);//agrega codigoVenta del servidor a la tabla detalleVenta del BDPhone
		    	tx.executeSql("UPDATE cliente SET atendido = 'si' WHERE codCliente = '"+codCliente+"' ;", []);//actualizar atendido = "si", que indica que el cliente ha sido atendido con exito
			}
			else{
				tx.executeSql("UPDATE cliente SET atendido = 'falla' WHERE codCliente = '"+codCliente+"' ;", []);//actualizar atendido = "falla", que indica que el cliente ha sido atendido pero no llego al servidor
			}
			cargarClientesRutaPhone() //vuelve a cargar la lista principal de clientes en ruta con sus estados
			$.mobile.changePage("#home");
			//$.mobile.back(); //guarde o no guarde en el servidor debe regresar a la pantalla anterior***********

		}, function(error){
		  	alert("Error al actualizar respuesta server. : "+ error);
		}, function() {});

		
	}

	$("body").on('click', '#cancelarFrmVenta', function(e){
		if (confirm('¿Desea cancelar lo venta?')) {
		    limpiarFormularioNuevaVenta();
		    $.mobile.back();
		    $(".collapsible-body").css({ display: 'none' });
		    Materialize.toast('Venta cancelada.', 3000)
		} else {
		    //alert('Why did you press cancel? You should have confirmed');
		}
		
	});

	$("body").on('click', '#aceptarDespacho', function(e){
		Materialize.toast('Despacho exitoso.', 3000)
		$.mobile.changePage("#home");
	});



	$("body").on('click', '#logout', function(e){
		if (confirm('Se eliminaran todos los registros del teléfono,¿Seguro que desea salir?')) {
		    localStorage.setItem('primer_login', true);
			localStorage.setItem('usu_tp', null);
			//localStorage.clear(); //limpia toda la variable
			$.mobile.changePage("#login");
		}
	});

	$("body").on('click', '#aceptarSincronizar', function(e){
		var obj = {
					vCliente: $("#chk-sinc-cliente").is(':checked'),
					vProducto: $("#chk-sinc-producto").is(':checked')
				  };
		sincronizarDatosServer(obj);
	});

	function sincronizarDatosServer(obj)
	{
		if(obj.vCliente || obj.vProducto){
			abrirAlerta("Sincronizando clientes...");
			if(obj.vCliente)
			{
				sincronizarClienteServer();
			}
			else if(obj.vProducto)
			{
				sincronizarProductoServer();
			}
		}else{
			Materialize.toast('Seleccione lo que desea sincronizar.', 3000);
			return false;
		}
	}

	function sincronizarClienteServer(obj)
	{
		try{
			$.ajax({
				url: webService+"sincronizarCliente",
				type: 'POST',
				dataType: 'json',
				data: {codigoVendedor:localStorage.getItem('usu_tp') },
				beforeSend:function (){
					$("#mensaje-alerta").html("Sincronizando clientes...");
				},
				success: function(dataR){
					if(dataR.length > 0){
						sincronizarClientePhone(dataR);
					}else{
						Materialize.toast('No se encontraron cambios de clientes en el servidor.', 3000);
					}
					
					if(obj.vProducto){
						sincronizarProductoServer(obj);
					}else{
						cerrarAlerta();
					}
				},
				error: function(e){
					Materialize.toast('Error al conectarse con el servidor sincronizarClienteServer().', 3000);
					cerrarAlerta();
			    }
			});
		}catch(er){
			alert("Error NV00001. Problemas con el metodo selectinformacionProductoCorteServer.");
			return false;
		}
	}

	function sincronizarClientePhone(data)
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			for (var i = 0; i < data.length; i++) {
				//cliente (codCliente, razonSocial, ruc, clasificacion, giro, direccion_p, 
				//contacto, celContacto, deuda REAL, fechaDeuda, despacho, fechaUltimaVisita, contactoUltimaVisita, atendido, ruta, tipo)
				if(data[i].tipoR == "nuevo"){
					tx.executeSql('INSERT INTO cliente VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [data[i].codCliente, data[i].razonSocial, data[i].ruc, data[i].clasificacion, data[i].giro, data[i].direccion_p, data[i].contacto, data[i].celContacto, data[i].deuda, data[i].fechaDeuda, data[i].despacho, data[i].fechaUltimaVisita, data[i].contactoUltimaVisita, data[i].atendido, data[i].ruta, data[i].tipo]);
				}else if(data[i].tipoR == "editar"){
					tx.executeSql("UPDATE cliente SET razonSocial = '"+data[i].razonSocial+"', ruc = '"+data[i].ruc+"', clasificacion= '"+data[i].clasificacion+"', giro= '"+data[i].giro+"', direccion_p= '"+data[i].direccion_p+"', contacto = '"+data[i].contacto+"', celContacto = '"+data[i].celContacto+"', deuda = '"+data[i].deuda+"', fechaDeuda = '"+data[i].fechaDeuda+"', despacho = '"+data[i].despacho+"', fechaUltimaVisita = '"+data[i].fechaUltimaVisita+"', contactoUltimaVisita = '"+data[i].contactoUltimaVisita+"', atendido = '"+data[i].atendido+"', ruta = '"+data[i].ruta+"', tipo = '"+data[i].tipo+"' WHERE codCliente = '"+data[i].codCliente+"' ;", []);
				}else if(data[i].tipoR == "eliminar"){
					tx.executeSql("DELETE FROM cliente WHERE codCliente = '"+data[i].codCliente+"';", []);
				}
			};
			
		}, function(error){
		  	alert("Error al actualizar respuesta server actualizarRespuestaFallaVentaServer().");
		}, function() {});
	}

	function sincronizarProductoServer(obj)
	{
		try{
			$.ajax({
				url: webService+"sincronizarProducto",
				type: 'POST',
				dataType: 'json',
				data: { },
				beforeSend:function (){
					$("#mensaje-alerta").html("Sincronizando productos...");
				},
				success: function(dataR){
					if(dataR.length > 0){
						sincronizarProductoPhone(dataR);
					}else{
						Materialize.toast('No se encontraron cambios de productos en el servidor.', 3000);
					}
					
					cerrarAlerta();
				},
				error: function(e){
					Materialize.toast('Error al conectarse con el servidor sincronizarProductoServer().', 3000);
					cerrarAlerta();
			    }
			});
		}catch(er){
			alert("Error NV00001. Problemas con el metodo selectinformacionProductoCorteServer.");
			return false;
		}
	}

	function sincronizarProductoPhone(data)
	{

	}

	$("body").on('click', '#marca-asistencia', function(e){
		Materialize.toast('Asistencia registrada.', 3000);
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

	function limpiarSearchClienteNoRuta()
	{
		$("#buscarAllCliente").val("");
		$("#cont-clientes-todo").html("");
	}

	$("body").on('click', '#btnCancelarBusquedaCliente', function(e){
		limpiarSearchClienteNoRuta();
		$.mobile.back();
	});


	$("body").on('click', '#btn-Refresh', function(e){
		console.log("refrescar")
	});


	$("body").on('click', '#btnVenderClienteNR', function(e){
		console.log( $("#nom-empNR").val());
		$.mobile.changePage("#FormNuevaVenta");
	});


	$("body").on('click', '.precio-select-dv', function(e){
		//$('#modalPrecio').openModal();
	});
	
	$("body").on('click', '#btnAddProductoLista', function(e){
		var cod = $("#codigo-producto-nv").val();
		var existe = false;

		if(arregloTodoProductos.length > 0)
		{
			for (var i = 0; i < arregloTodoProductos.length; i++) {
				if( arregloTodoProductos[i].codigo == cod)
				{
					existe = true;
					break;
				}
			}
		}
		
		if(existe == true)
		{
			var veriProd = false;
			if(arregloPedidosNV.length > 0){
				for (var i = 0; i < arregloPedidosNV.length; i++) {
					if(arregloPedidosNV[i].codigo == cod){veriProd = true; break;}
				}
			}
			if(veriProd == false)
			{
				$("#codigo-producto-nv").val("");
				selectinformacionProducto(cod, "agregar", 0); //"agregar" = opcion que cumplira luego de el select
				//$('#modalAddProd').openModal();
			}
			else{
				$("#cant-lst-"+cod).focus();
				Materialize.toast('El producto ya esta en la lista.', 3000);
				return false;
			}
		}
		else{
			Materialize.toast('El código no existe.', 3000);
		}	
	});

	function selectinformacionProducto(cod, opcion, cant) //cod = codigoProducto; opcion = que ara el metodo
	{
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql('SELECT * FROM producto WHERE codigoProd=?',[cod],function(tx,result){
				fila = result.rows.item(0);
				selectinformacionProductoCorteServer(cod, opcion, cant, fila); //fila = datos del producto
			});
	  	}, function(error){
	  		alert("Error al llamar datos de la BDPhone, selectinformacionProducto().")
	  	}, function(){});

		//return dataProducto;

		/*CREATE TABLE IF NOT EXISTS producto (codigoProd, nombreProducto, precio, precioCredito REAL, stock integer, undMedida, corte)');
			tx.executeSql('CREATE TABLE IF NOT EXISTS productoCorte (codigoCorte, codigoProd, precio REAL, corte integer)');*/
	}

	function selectinformacionProductoCorteServer(cod, opcion, cant, dataProducto)//cod = codigoProducto; opcion = que ara en el metodo
	{
		var ruc = $("#ruc-cliente-nv").val();
		try{
			$.ajax({
				url: webService+"ListarPrecio",
				type: 'POST',
				dataType: 'json',
				data: {Ruc:ruc, CodProd:cod},
				beforeSend:function (){
					abrirAlerta("Cargando stock de producto...");
				},
				success: function(dataR){
					cerrarAlerta();
					if(opcion == "agregar")
					{
						if(dataR[0].stock != null)
						{ 
							if(dataR[0].stock > 0)
							{
								$("#cant-prod-add").focus();
								$('#modalAddProd').openModal();
								informacionProductoAgregar(cod, dataProducto, dataR); //data = arreglo de cortes del producto
							}
							else{
								alert("Producto NO cuenta con stock.");
								return false;
							}
						}else{
							alert("No se pudo obtener datos del producto.");
							return false;
						}
					}
					else if(opcion == "editar"){
						//actualizarCantidadProductoListaNV(cod, dataProducto, dataR); //data = arreglo de cortes del producto
						actualizarArregloPrecioProductoAdd(cod, dataProducto, dataR, cant);
					}
				},
				error: function(e){
					cerrarAlerta();
					var corteOF = new Array();
					corteOF.push({corte:1, Precio:dataProducto.precio, stock:10000});
					Materialize.toast('Problemas de conexion, precio y stock referenciales.', 3000);
					if(opcion == "agregar")
					{
						$("#cant-prod-add").focus();
						$('#modalAddProd').openModal();
						informacionProductoAgregar(cod, dataProducto, corteOF);
					}
					else if(opcion == "editar"){
						actualizarArregloPrecioProductoAdd(cod, dataProducto, corteOF, cant);
						//return false;
					}
			    }
			});
		}catch(er){
			alert("Error NV00001. Problemas con el metodo selectinformacionProductoCorteServer.");
			return false;
		}
	}

	function informacionProductoAgregar(cod, dataProducto, dataCorte) //cod = codigoProducto
	{
		limpiarAgregarProducto();

		$("#nombre-prod-add").html(dataProducto.nombreProducto);
		$("#cod-prod-add").val(cod);
		if(dataCorte[0].stock != null){ $("#stock-prod").val(dataCorte[0].stock); }else{ $("#stock-prod").val(dataProducto.stock);}//stock prioritario servidor, luego phone

		$("#unidad-prod").val(dataProducto.undMedida);

		if(dataProducto.corte == false || dataProducto.corte == "false")
		{
			arregloPrecioProductoAdd.push({corte:dataProducto.corte, precio:dataProducto.precio, precioCredito:dataProducto.precioCredito});
			var str = '<div class="info-item-pre"><span>Fijo</span><span class="precio-gen">'+dataProducto.precio+'</span></div>'+
					  '<div class="info-item-pre"><span>Credito</span><span class="precio-gen">'+dataProducto.precioCredito+'</span></div>';
			$("#cont-info-precio").append(str);
		}
		else{
			var str = "";
			for (var i = 0; i < dataCorte.length; i++) 
			{
				arregloPrecioProductoAdd.push({corte:dataProducto.corte, precio:dataCorte[i].Precio, ncorte:dataCorte[i].corte});

				str += '<div class="info-item-pre"><span>'+dataCorte[i].corte+' a '; 
				if( dataCorte[i+1] != undefined ){ str += dataCorte[i+1].corte-1 }else{ str += " más"}
				str += '</span><span class="precio-gen">'+dataCorte[i].Precio+'</span></div>';
			}
			$("#cont-info-precio").append(str);
		}
	}

	function limpiarAgregarProducto()
	{
		arregloPrecioProductoAdd = []; // limpiar arreglo de precios temporales
		$("#stock-prod").val("");
		$("#unidad-prod").val("");
		$("#cant-prod-add").val("");
		$("#importe-prod").val("");
		$("#cod-prod-add").val(0);
		$("#precio-prod-add").val(0);
		$("#cont-info-precio").html("");
		//$("#precio-prod-imp-lst").html("0");
	}

	$("body").on('keyup', '#cant-prod-add', function(){
	//$("#cant-prod-add").keyup(function(){
		var cant = $(this).val();
		var codProd = $("#cod-prod-add").val();
		var importe = calcularPrecioImporte(cant);
		$("#importe-prod").val(importe);
		$("#precio-prod-add").val(importe/cant);
	});

	function calcularPrecioImporte(cantidad)
	{
		var importe = 0;
		if (arregloPrecioProductoAdd.length > 0) 
		{
			if(arregloPrecioProductoAdd[0].corte == true || arregloPrecioProductoAdd[0].corte == "true")
			{
				importe = parseFloat( ( arregloPrecioProductoAdd[0].precio * cantidad ).toFixed(8));
				for (var i = 0; i < arregloPrecioProductoAdd.length; i++) 
				{
					if(arregloPrecioProductoAdd[i+1] != undefined)
					{
						if(cantidad >= arregloPrecioProductoAdd[i+1].ncorte)
						{
							importe = parseFloat( ( arregloPrecioProductoAdd[i+1].precio * cantidad ).toFixed(8));
						}
					}
				}
			}
			else{
				var tDesc = $("input[name=rdb-tipo-pago-nv]:checked").val();
				if( tDesc == "efectivo")
				{
					importe =  parseFloat( ( arregloPrecioProductoAdd[0].precio * cantidad ).toFixed(8));
				}
				else if( tDesc == "credito"){
					importe =  parseFloat( ( arregloPrecioProductoAdd[0].precioCredito * cantidad ).toFixed(8));
				}
			}
		}
		return importe;
	}

	$("body").on('click', '#btn-aceptar-add-prod', function(e){
		
		var codigo = $("#cod-prod-add").val();
		var nombre = $("#nombre-prod-add").html();
		var precio = parseFloat($("#precio-prod-add").val());
			precio = parseFloat(precio.toFixed(8));
		var cantidad = parseInt($("#cant-prod-add").val());
		var importe = parseFloat($("#importe-prod").val());
			importe = parseFloat(importe.toFixed(8));
		
		if(cantidad > 0)
		{
			var stockV = $("#stock-prod").val();
			if (cantidad <= stockV ) {
				agregarItemListaPedido(codigo, nombre, precio, cantidad, importe);
				$("#modalAddProd").closeModal();
			}else{
				$("#cant-prod-add").focus();
				Materialize.toast('La cantidad supera el stock, verificar.', 3000);
				return false;
			}
		}else{
			$("#cant-prod-add").focus();
			Materialize.toast('Debe ingresar una cantidad.', 3000);
			return false;
		}

		limpiarAgregarProducto(); //limpia todo despues de agregar;
	});

	$("body").on('click', '#btn-cancelar-add-prod', function(e){
		limpiarAgregarProducto(); //limpia todo despues de agregar;
	});

	function agregarItemListaPedido(codigo, nombre, precio, cantidad, importe)
	{
		arregloPedidosNV.push({codigo: codigo, nombre:nombre, precio: precio, precioN:0, cantidad:cantidad, importe:importe});
		var str = '<tr id="rmv-nv-'+codigo+'">'+
                    '<td><span class="delete-producto" id="del-prod-'+codigo+'">X</span></td>'+
                    '<td><b>'+codigo+'</b><br>'+nombre.substring(0,5)+'...</td>'+
                    '<td class="precio-select-dv"><span id="precio-lst-'+codigo+'">'+formatNumber.new(precio)+'</span></td>'+
                    '<td class="inputChico"><input type="number" value="'+cantidad+'" class="text-cant-itm-nv" id="cant-lst-'+codigo+'" style="text-align: right;"></td>'+
                    '<td style="text-align: right;" id="importe-lst-'+codigo+'">'+formatNumber.new(importe)+'</td>'+
                 '</tr>';

        var total = 0.00;
        for (var i = 0; i < arregloPedidosNV.length; i++) {
        	total +=  parseFloat(arregloPedidosNV[i].importe);
        	total = parseFloat(total.toFixed(8));//maximo decimales 8 --> para eliminar decimales cuando quedan .200000000000001 ********************
        };

        $("#cont-lst-prod-add").append(str);
        $("#precio-prod-imp-lst").html(formatNumber.new(total, "S/ ")); 
	}

	var formatNumber = {
	 	separador: ",", // separador para los miles
	 	sepDecimal: '.', // separador para los decimales
	 	formatear:function (num){
		  	num +='';
		  	var splitStr = num.split('.');
		  	var splitLeft = splitStr[0];
		  	var splitRight = splitStr.length > 1 ? this.sepDecimal + splitStr[1] : '';
		  	var regx = /(\d+)(\d{3})/;
		  	while (regx.test(splitLeft)) {
		  		splitLeft = splitLeft.replace(regx, '$1' + this.separador + '$2');
		  	}
		  	return this.simbol + splitLeft  +splitRight;
		 },
		 new:function(num, simbol){
		  	this.simbol = simbol ||'';
		  	return this.formatear(num);
	 	}

	 	/*	EJEMPLOS
	 		formatNumber.new(123456779.18, "$") // retorna "$123.456.779,18"
			formatNumber.new(123456779.18) // retorna "123.456.779,18"
			formatNumber.new(123456779) // retorna "$123.456.779"
		*/
	}

	$("body").on('click', '.delete-producto', function(e){
		var str = $(this).attr("id");
		str = str.split("-");
		var	id = str[2];
		$("#eli-prod-cod").html(id)
		$("#mensaje-confirm").openModal();
	});

	$("body").on('click', '#btn-quitar-lst-prod', function(e){
		var id = $("#eli-prod-cod").html();
		eliminarProductoListaNV(id);
	});

	function eliminarProductoListaNV(id)
	{
		var na = arregloPedidosNV;
		var total = 0.00;
		if(na.length > 0)
		{
			arregloPedidosNV = [];
			for (var i = 0; i < na.length; i++) {
				if(na[i].codigo != id)
				{
					total +=  parseFloat(na[i].importe);
        			total = parseFloat(total.toFixed(8));//maximo decimales 8 --> para eliminar decimales cuando quedan .200000000000001 ********************

					arregloPedidosNV.push({codigo: na[i].codigo, nombre:na[i].nombre, precio:na[i].precio, precioN:0, cantidad:na[i].cantidad, importe:na[i].importe});
				}else{
					$("#rmv-nv-"+id).remove();
				}
			}
			$("#precio-prod-imp-lst").html(formatNumber.new(total, "S/ "));
		}
	}

	var mProd = false;
	$("body").on('keyup', '.text-cant-itm-nv', function(){
		var str = $(this).attr("id");
		str = str.split("-");
		var	id = str[2];
		var cant = parseInt($(this).val());
		if(cant > 0)
		{
			if(mProd == false){
				mProd = true;
				selectinformacionProducto(id, "editar", cant);//opcion = indica la accion dentro de la funcion; "editar" -> llama a actualizarCantidadProductoListaNV
			}else{
				actualizarCantidadProductoListaNV(id, cant);
			}
			
		}
	});

	$("body").on('focusout', '.text-cant-itm-nv', function(){
		var val = $(this).val();
		if( val == 0 || val == "" )
		{
			Materialize.toast('Ingrese una cantidad correcta.', 3000);
			$(this).focus();
		}else{
			mProd = false;
		}
	});

	function actualizarArregloPrecioProductoAdd(id, dataProducto, dataCorte, cant)
	{
		arregloPrecioProductoAdd = [];

		if(dataProducto.corte == false || dataProducto.corte == "false")
		{
			arregloPrecioProductoAdd.push({corte:dataProducto.corte, precio:dataProducto.precio, precioCredito:dataProducto.precioCredito});
		}
		else{
			for (var i = 0; i < dataCorte.length; i++) 
			{
				arregloPrecioProductoAdd.push({corte:dataProducto.corte, precio:dataCorte[i].Precio, ncorte:dataCorte[i].corte});
			}
		}

		actualizarCantidadProductoListaNV(id, cant);
	}

	function actualizarCantidadProductoListaNV(id, cant)
	{
		var total = 0.00;
		for (var i = 0; i < arregloPedidosNV.length; i++) 
		{
			if(arregloPedidosNV[i].codigo == id)
			{
				arregloPedidosNV[i].cantidad = cant;
				if(arregloPedidosNV[i].precioN > 0)
				{
					arregloPedidosNV[i].importe = parseFloat((cant * arregloPedidosNV[i].precioN).toFixed(8));
				}
				else{
					arregloPedidosNV[i].importe = calcularPrecioImporte(cant);//parseFloat((cant * arregloPedidosNV[i].precio).toFixed(8));
				}
				total +=  parseFloat(arregloPedidosNV[i].importe);
				total = parseFloat(total.toFixed(8));
				$("#importe-lst-"+id).html(arregloPedidosNV[i].importe);

				var nPrecio = parseFloat((arregloPedidosNV[i].importe/cant).toFixed(8))

				arregloPedidosNV[i].precio = nPrecio;
				$("#precio-lst-"+id).html( nPrecio );
			}
			else{
				total +=  parseFloat(arregloPedidosNV[i].importe);
    			total = parseFloat(total.toFixed(8));
			}
		}
		$("#precio-prod-imp-lst").html(formatNumber.new(total, "S/ "));
	}

	/*botones de menu opciones*/

	var fallasVenta = false;
	var ventaFallaCab = new Array();
	var ventaFallaDet = new Array();

	$("body").on('click', '#btnSincronizarVenta', function(e){
		if(fallasVenta == true)
		{
			sincronizarVentaFallaPhone();
		}else{
			Materialize.toast('No existen ventas con fallas.', 3000);
		}
	});

	function sincronizarVentaFallaPhone()
	{
		try{
			if(ventaFallaCab.length > 0)
			{
				for(var i = 0; i < ventaFallaCab.length; i++) 
				{
					if (ventaFallaCab[i].codigoServer == null)
					{
						var dataCab = { 
										codigoVendedor: localStorage.getItem('usu_tp'),
										nombreVendedor: localStorage.getItem('nombre_tp'),
										codCliente: ventaFallaCab[i].codCliente,
										rutax: clienteRuta,
										total: ventaFallaCab[i].totalPagar,
										horaInicio: ventaFallaCab[i].horaInicio,
										fecha: ventaFallaCab[i].fechaHora
									 };
						var dataDet = new Array();

						for (var j = 0; j < ventaFallaDet.length; j++) 
						{
							if(ventaFallaCab[i].codCabecera == ventaFallaDet[j].codCabecera) 
							{
								dataDet.push({codigo: ventaFallaDet[j].codigoProd, nombre:"", precio: ventaFallaDet[j].precio, precioN:0, cantidad:ventaFallaDet[j].cantidad, importe:ventaFallaDet[j].importe});
								
							}
						}

						//fechaHora, longitude, latitude, batery, accuracy
						var dataLocalizacion = {
								fechaHora: ventaFallaCab[i].fechaHora, 
								longitude: ventaFallaCab[i].longitude, 
								latitude: ventaFallaCab[i].latitude,
								batery: ventaFallaCab[i].batery, 
								accuracy: ventaFallaCab[i].accuracy
							};

						guardarFallaVentaServer(ventaFallaCab[i].codCabecera, dataCab, dataLocalizacion, dataDet)
					}
				}
			}
		}catch(er)
		{
			alert(er);
		}
	}

	function guardarFallaVentaServer(codCabecera, dataC, dataL, detalleV)
	{
		try{
			$.ajax({
				url: webService+"GuardarNuevaVenta",
				type: 'POST',
				dataType: 'json',
				data: {codigoVendedor:localStorage.getItem('usu_tp'), cabecera:JSON.stringify(dataC), localizacion:JSON.stringify(dataL), detalle:JSON.stringify(detalleV)},
				beforeSend:function (){
					abrirAlerta("Sincronizando ventas...");
				},
				success: function(dataR){
					cerrarAlerta();
					actualizarRespuestaFallaVentaServer(codCabecera, dataC, dataR['codVenta']);
				},
				error: function(dataR){
					cerrarAlerta();
					Materialize.toast('Error FV0001. Problemas de conexion con el servidor.', 5000); // FV0001, problemas al comunicarse con el servidor, (internet o ruta)
					actualizarRespuestaFallaVentaServer(codCabecera, dataC, null);
					return false;
			    }
			});
		}catch(er){
			alert("Error NV00001. Problemas con el metodo guardarFallaVentaServer().");
			return false;
		}
	}


	function actualizarRespuestaFallaVentaServer(codCabecera, dataC, codVenta)
	{
		var codCliente = dataC['codCliente'];
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			if(codVenta != null)
			{
		    	tx.executeSql("UPDATE cabeceraVenta SET codigoServer ='"+codVenta+"' WHERE codCabecera = '"+codCabecera+"' ;", []);
		    	tx.executeSql("UPDATE cliente SET atendido = 'si' WHERE codCliente = '"+codCliente+"' ;", []);//tx.executeSql("UPDATE cliente SET atendido = 'si', despacho = '"+true+"' WHERE codCliente = '"+codCliente+"' ;", []);
			}else{
				tx.executeSql("UPDATE cliente SET atendido = 'falla' WHERE codCliente = '"+codCliente+"' ;", []);
			}
			cargarAllCabeceraVentaDiaPhone();
			cargarClientesRutaPhone();
		}, function(error){
		  	alert("Error al actualizar respuesta server actualizarRespuestaFallaVentaServer().");
		}, function() {});
	}

	$("body").on('click', '#btnVentasDia', function(e){
		cargarVentasDiaPhone();
	});

	function cargarVentasDiaPhone()
	{
		try{
			cargarAllCabeceraVentaDiaPhone();
			$.mobile.changePage("#ventasDia");
		}
		catch(er){
			alert("error: "+er)
		}
		
	}

	function cargarAllCabeceraVentaDiaPhone()
	{
		fallasVenta = false;// AL INICIO ASUME QUE NO HAY FALLAS
		ventaFallaCab = [];
		var data = new Array();
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			//fechaHora
			//localStorage.getItem('fecha_cartera') != app.getFecha()
			tx.executeSql("SELECT * FROM cabeceraVenta",[],function(tx,result){
				if(result.rows.length > 0){
					for(var i=0; i<result.rows.length; i++){
			       		data.push( result.rows.item(i) );
			       		if(result.rows.item(i)['codigoServer'] == null){ fallasVenta = true; }//SI EXISTEN FALLAS CAMBIA A TRUE
			    	}
			    	ventaFallaCab = data; //arreglo cabecera ventas para sincronizar fallas
			    	cargarAllDetalleVentaDiaPhone(data); //data = dataCabecera
				}else{
					Materialize.toast('No se encontraron ventas.', 5000);
				}
			});
	  	}, function(error){
	  		alert("Error al cargar datos de ventas, cabecera.");
	  	}, function(){});
	}

	function cargarAllDetalleVentaDiaPhone(dataCabecera)
	{
		ventaFallaDet = [];
		var data = new Array();
		$.support.cors = true;
		var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
		db.transaction(function(tx) {
			tx.executeSql("SELECT * FROM detalleVenta",[],function(tx,result){
				if(result.rows.length > 0){
					for(var i=0; i<result.rows.length; i++){
			       		data.push( result.rows.item(i) );
			    	}
				}
				ventaFallaDet = data;
				crearItemsVentaDia(dataCabecera, data); // data = dataDetalle
			});
	  	}, function(error){
	  		alert("Error al cargar datos de ventas, detalle.");
	  	}, function(){});
	}

	function crearItemsVentaDia(dataCabecera, dataDetalle)
	{
		$("#ventasDiaCont").html("");
		var str = "";
		for (var i = 0; i < dataCabecera.length; i++) 
		{
			str = '<li><div class="collapsible-header"><span>';
			str += dataCabecera[i]['codCliente']+'</span><span class="precio-vd">S/ '+dataCabecera[i]['totalPagar']+'</span> <i class="material-icons"';
			if(dataCabecera[i]['codigoServer'] != null){str += ' >done';}else{str += ' style="color: #FF5252;">warning';}
			str += '</i></div><div class="collapsible-body bgGray"><div class="contenedor-demp contenedor-demp-vd">';
			for (var j = 0; j < dataDetalle.length; j++) {
				if(dataCabecera[i]['codCabecera'] == dataDetalle[j]['codCabecera'])
				{
					str += '<div><span>-</span>'+dataDetalle[j]['codigoProd']+' ('+dataDetalle[j]['cantidad']+')</div>';
				}
			}
			str += '</div></div></li>';
			$("#ventasDiaCont").append(str);
		}
	}

	/*fin botones de menu opciones*/

	$("body").on('change', '#opcion-cliente', function(e){
		var a = $(this).val();
		switch(a) {
		    case "1":
		        $.mobile.changePage("#FormNuevoCliente");
		        break;
		    case "2":
		    	limpiarSearchClienteNoRuta();
		    	//cargarArregloClientes();
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
		/*if( tipo == 'ruc')
		{
			$(".depen-dni").show(200);
		}else if( tipo == 'dni'){
			$(".depen-dni").hide(200);
		}*/
	});
	
});
