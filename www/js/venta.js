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
	var arregloTodoclientes = new Array(); //arreglo para busqueda clientes asignados al vendedor
	var arregloTodoDatosclientes = new Array(); //ARREGLO QUE ALMACENA TODOS LOS CLIENTE

	var arregloTodoProductos = new Array(); //arreglo para busqueda productos en phone
	var arregloPrecioProductoAdd = new Array(); //arreglo para almacenar precios de

	var arregloPedidosNV = new Array();//almacena todos los pedidos que se van agregando a la venta

	var idClienteVenta = null;
	
	/* METODOS QUE SE EJECUTARAN AL INICIAR EL APLICATIVO */

	inicializar();

	function inicializar()
	{	
		
		metodosMaterialize();
		if( localStorage.getItem('usu_tp') != null ){
			localStorage.setItem('primer_login', false); //indicando que YA tiene sesion
			var data = 	{
							usuario: localStorage.getItem('mail_tp'),
			 				clave: localStorage.getItem('clave_tp')
			 			}
		    login(data);
		}
		else{
			localStorage.setItem('primer_login', true); //indicando que NO tiene sesion
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
			login(data);
		}else{
			Materialize.toast("Usuario y clave necesarios.", 3000);
		}

		return false;
	})

	/*function convertirJSON(data)
	{
		
		//var dt = data;// descomentar cuando comience a usarse el webservice
		var dt = new XMLSerializer().serializeToString(data);
		var dt = dt.substring(dt.indexOf("["),(dt.indexOf("]")+1));
		return dt;
	}*/

	function convertirJSONTemp(data)
	{
		
		var dt = data;// descomentar cuando comience a usarse el webservice
		//var dt = new XMLSerializer().serializeToString(data);
		var dt = dt.substring(dt.indexOf("["),(dt.indexOf("]")+1));
		return dt;
	}

	function login(data)
	{
		try{
			$.ajax({
				url: webService+"Login",
				type: 'POST',
				dataType: 'json',
				data: {user: data.usuario, password:data.clave},
				beforeSend:function (){},
				success: function(dataR){

					if(dataR != undefined)
					{
						if( dataR.respuesta == "true" || dataR.respuesta == true){
							$("#nombre-usuario-tp").html( dataR.alias.trim().substring(0,16)+".."); //asignando nombre
							localStorage.setItem('usu_tp', dataR.codigoVendedor.trim());
							localStorage.setItem('mail_tp', data.usuario.trim());
							localStorage.setItem('clave_tp', data.clave.trim());
							cargarDatosLoginOK(dataR.codigoVendedor);//metodo que se ejecuta despues del login OK
							$.mobile.changePage("#home");
						}else{
							Materialize.toast('Usuario o contraseña incorrecta.', 3000);
							return false;
						}
					}else{
						Materialize.toast('Error L00001. Comunicate con el administrador', 5000);
						return false;
					}
				},
				error: function(dataR){
					console.log( JSON.stringify(dataR) )
					Materialize.toast('Error L00002. Ruta de Login no válida.', 5000);
					return false;
			    }
			});

		}catch(er){
			console.log(er)
			Materialize.toast('Error L00003. Error general, reiniciar APP.', 5000);
			return false;
		}
	}


	/* 	----------	BASE DE DATOS 	----------	 */
	function crearBaseDatos(){
		/*try{
			var db = null;
			document.addEventListener('deviceready', complementoBD, errorBD);
		}
		catch(er){
			alert(er)
		}*/
	}

	function complementoBD(){
		/*var db = window.sqlitePlugin.openDatabase({name: 'tpedido.db', location: 'default'});
	 	db.transaction(function(tr) {
		   	tr.executeSql("SELECT upper('Hola que tal') AS upperString", [], function(tr, rs) {
		     	alert("Resultado upperString : " + rs.rows.item(0).upperString);
		   	});

		}, errorTransac)
		/*db.transaction(function(tx) {
		    tx.executeSql('CREATE TABLE IF NOT EXISTS login (name, score)');
		    tx.executeSql('INSERT INTO login VALUES (?,?)', ['Alice', 101]);
		    tx.executeSql('INSERT INTO login VALUES (?,?)', ['Betty', 202]);
	  	}, function(error) {
		    alert('Transaction ERROR: ' + error.message);
	  	}, function() {
		    alert('Populated database OK');
	  	});*/
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
		if( localStorage.getItem('primer_login') != true ) //CAMBIAR POR == ************************************************************************************
		{
			crearBaseDatos(); // CREA LA BASE DE DATOS SQLITE

			localStorage.setItem('fecha_cartera', app.getFecha());

			cargarTodosClienteServer();
			cargarDireccionesMultipleServer();
			cargarTodosCombosServer();
			cargarTodosProductoServer();
			cargarCortesProductoServer();
		}
		else{
			if( localStorage.getItem('fecha_cartera') != app.getFecha() )
			{
				localStorage.setItem('fecha_cartera', app.getFecha()); //asignamos fecha día
				
				cargarClientesRutaServer();
			}
			else{
				cargarClientesRutaPhone();
			}
		}
	}

	function cargarTodosClienteServer()//CARGAR TODA LA LISTA DE LOS CLIENTES DEL SERVIDOR AL TELEFONO********
	{
		arregloTodoDatosclientes = []; //CLIENTE CON TODOS LOS DATOS
		try{
			$.ajax({
				url: webService+"ListaClienteVendedor",
				type: 'POST',
				dataType: 'json',
				data: {codigoVendedor: localStorage.getItem('usu_tp')},
				success: function(dataR){
					arregloTodoDatosclientes = dataR; //para obtener el detalle del cliente cuando busca
					llenarArregloClientes(dataR, ["codCliente","razonSocial"]) //arreglo para buscar clientes
					llenarClientesBDPhone(dataR); // 1) LLENA LOS CLIENTES A LA BD PHONE
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

	function llenarArregloClientes(data, parametro)// sirve para buscar clientes
	{
		arregloTodoclientes = [];
		if(data.length > 0)
		{
			for (var i = 0; i < data.length; i++) {
				arregloTodoclientes.push({codigo: data[i][parametro[0]].toUpperCase().trim(), descripcion: data[i][parametro[1]].toUpperCase().trim()});		
			}
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
				success: function(dataR){
					llenarCombosBDPhone(dataR); // 2) LLENA LOS COMENTARIOS A LA BD
				},
				error: function(dataR){
					Materialize.toast('Error CMB001. Ruta de combos no válida.', 5000);
					return false;
			    }
			});

		}catch(er){
			Materialize.toast('Error CMB002. Error general, reiniciar APP.', 5000);
			console.log(er)
			return false;
		}
	}

	function cargarDireccionesMultipleServer()//CARGAR TODAS LAS DIRECCIONES DE LOS CLIENTES QUE TIENEN MAS DE 2 DIRECCIONES DEL SERVIDOR AL TELEFONO********
	{
		try{
			$.ajax({
				url: webService+"ListarDireccionesMultiples",
				type: 'POST',
				dataType: 'json',
				data: {},
				success: function(dataR){
					llenarDireccionesBDPhone(dataR); // 1) LLENA LOS CLIENTES A LA BD PHONE
				},
				error: function(dataR){
					//Materialize.toast('Error C00001. Ruta de todos clientes servidor esta fallando.', 5000);
					return false;
			    }
			});

		}catch(er){
			//Materialize.toast('Error C00002. Error general, reiniciar APP.', 5000);
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
				success: function(dataR){
					llenarArregloProductos(dataR, ["codigoProd","nombreProducto"]) //arreglo para buscar clientes
					llenarProductosBDPhone(dataR);
				},
				error: function(dataR){
					//Materialize.toast('Error C00001. Ruta de todos clientes servidor esta fallando.', 5000);
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
				success: function(dataR){
					llenarCorteProductosBDPhone(dataR);
				},
				error: function(dataR){
					//Materialize.toast('Error C00001. Ruta de todos clientes servidor esta fallando.', 5000);
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
		//LLENA LA LISTA DE TODOS LOS CLIENTES ASIGNADOS AL CONSULTOR
		cargarClientesRutaPhone();
	}

	function llenarCombosBDPhone(data)
	{
		//LLENAR TODOS LOS COMENTARIOS A LA BD PHONE
		cargarCombosPhone();
	}

	function llenarDireccionesBDPhone(data)
	{
		//LLENAR TODOS LAS DIRECCIONES A LA BD PHONE
	}

	function llenarProductosBDPhone(data)
	{
		//LLENAR TODOS LAS PRODUCTOS A LA BD PHONE
	}

	function llenarCorteProductosBDPhone(data)
	{
		//LLENAR TODOS LOS CORTES DE PRODUCTOS A LA BD PHONE
	}

	function cargarArregloClientes()
	{
		//SELECT A LA BD PHONE DE TODO LOS CLIENTES
		var data = '[{"codCliente":"CL0001", "razonSocial":"Roinet SAC", "ruc":"27364563721", "clasificacion":"Pto. Mercado", "giro":"Informatica", "direccion_p":"Shell 343 - Miraflores", "contacto":"Rene Ramirez", "celContacto":"999873647", "deuda":203.04, "fechaDeuda":"2016-08-30", "despacho": true, "fechaUltimaVisita":"2016-08-15", "contactoUltimaVisita":"Gisella Noles", "atendido":"no", "ruta":false, "tipo":"empresa"},'+
				'{"codCliente":"CL0002", "razonSocial":"Canto Rodado SAC", "ruc":"27345345515", "clasificacion":"Edificio", "giro":"robotica", "direccion_p":"Aramburu 342 - Miraflores", "contacto":"Alfredo Arroyo", "celContacto":"939384756", "deuda":0.00, "fechaDeuda":null, "despacho": false, "fechaUltimaVisita":"2016-07-15", "contactoUltimaVisita":"Luis Deza", "atendido":"no", "ruta":true, "tipo":"empresa"},'+
				'{"codCliente":"CL0003", "razonSocial":"Asombra Perú SAC", "ruc":"224354567656", "clasificacion":"Dpt. Bodega", "giro":"metales", "direccion_p":"ARoque Boloña - Surco", "contacto":"Tamara Rodriguez", "celContacto":"919293949", "deuda":855.55, "fechaDeuda":"2016-07-40", "despacho": false, "fechaUltimaVisita":"2016-08-20", "contactoUltimaVisita":"Alessandra Mora", "atendido":"no", "ruta":true, "tipo":"empresa"},'+
				'{"codCliente":"CL0004", "razonSocial":"La Lujuria SAC", "ruc":"58374635263", "clasificacion":"Bdga Casa", "giro":"Tamalitos", "direccion_p":"los Jazmines 123 - La Molina", "contacto":"Sofia Roque", "celContacto":"939928374", "deuda":0.00, "fechaDeuda":null, "despacho": false, "fechaUltimaVisita":"2016-08-17", "contactoUltimaVisita":"Javier Gadea", "atendido":"no", "ruta":false, "tipo":"empresa"}]';
		data = JSON.parse( convertirJSONTemp(data) ); 
		llenarArregloClientes(data, ["codCliente","razonSocial"]) //arreglo para buscar clientes
		arregloTodoDatosclientes = data;
	}

	function cargarClientesRutaPhone()
	{
		//CARGA CLIENTES DESDE LA BASE DE DATOS PHONE
		//LLENAR DIRECCION A LA TABLA DIRECCIONES DEL BD PHONE
		/*--SELECT DE BD PHONE--*/var data = '[{"codCliente":"CL0002", "razonSocial":"Canto Rodado SAC", "ruc":"27345345515", "clasificacion":"Edificio", "giro":"robotica", "direccion_p":"Aramburu 342 - Miraflores", "contacto":"Alfredo Arroyo", "celContacto":"998374656", "deuda":0.00, "fechaDeuda":null, "despacho": false, "fechaUltimaVisita":"2016-07-15", "contactoUltimaVisita":"Luis Deza", "atendido":"si", "ruta":true, "tipo":"empresa"},'+
												'{"codCliente":"CL0003", "razonSocial":"Asombra Perú SAC", "ruc":"224354567656", "clasificacion":"Dpt. Bodega", "giro":"metales", "direccion_p":"ARoque Boloña - Surco", "contacto":"Tamara Rodriguez", "celContacto":"989746586", "deuda":855.55, "fechaDeuda":"2016-07-40", "despacho": false, "fechaUltimaVisita":"2016-08-20", "contactoUltimaVisita":"Alessandra Mora", "atendido":"no", "ruta":true, "tipo":"empresa"}]';
		data = JSON.parse( convertirJSONTemp(data) );
		mostrarClientesRuta(data);
	}

	function cargarCombosPhone()
	{
		//CARGA COMBOS DESDE LA BASE DE DATOS PHONE
		/*--SELECT DE BD PHONE--*/var data = '[{"codigo":"TE0001", "descripcion":"Entrega sin problemas"},'+
												'{"codigo":"TE0002", "descripcion":"Entrega SV"},'+
												'{"codigo":"TE0003", "descripcion":"Rechazo por completo"}]';
		data = JSON.parse( convertirJSONTemp(data) );
		//console.log(data)

		var data1 = '[{"codigo":"CD0001", "descripcion":"Comentario DS 1"},'+
					'{"codigo":"CD0002", "descripcion":"Comentario DS 2"}]';
		data1 = JSON.parse( convertirJSONTemp(data1) );
		//console.log(data1)

		var data2 = '[{"codigo":"CC0001", "descripcion":"Comentario CC 1"},'+
					'{"codigo":"CC0002", "descripcion":"Comentario CC 2"}]';
		data2 = JSON.parse( convertirJSONTemp(data2) );
		

		mostrarCombos(data, "#tipo-entrega-dpc", false); //combo tipo de entrega
		mostrarCombos(data1, "#cbo-comentario-dpc", true); //combo comentario despacho opcion -> no cobrar
		mostrarCombos(data2, "#cbo-comentario-cbz", true);	//combo comentario cobranza opcion -> no pagó
	}

	function cargarClientesRutaServer() // CARGA USUARIOS DE LA RUTA DEL DIA SOLO EN EL CASO DE CAMBIAR DE DIA ***********
	{
		//CARGA CLIENTES DE LA RUTA DEL DIA DESDE EL SERVIDOR
		//ACTUALIZA ESTADO EN TABLA CLIENTES PHONE; SI NO ENCUENTRA EL CLIENTE AGREGAR A LA BD PHONE

		try{
			$.ajax({
				url: webService+"ListarClienteVendedoRuta",
				type: 'POST',
				data: {codigoVendedor: localStorage.getItem('usu_tp')},
				success: function(dataR){
					// EL PARAMETRO TIPO VA DECIDIR SI SE AGREGA LA EMPRESA O SOLO ACTUALIZA
					actualizaClientesRutaPhone(data);	
				},
				error: function(dataR){
					//Materialize.toast('Error C00001. Ruta de todos clientes servidor esta fallando.', 5000);
					return false;
			    }
			});

		}catch(er){
			//Materialize.toast('Error C00002. Error general, reiniciar APP.', 5000);
			console.log(er)
			return false;
		}
		
	}

	function actualizaClientesRutaPhone(data)
	{
		//ACTUALIZAR TABLA EN EL TELEFONO /****IMPORTANTE****/
		cargarClientesRutaPhone()
	}

	function mostrarClientesRuta(data)//MOSTRAR CLIENTES EN RUTA AL VENDEDOR****
	{
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
			    if(data.despacho == true){strNI += '<span class="conDespacho"></span>';}
			    if(data.deuda > 0){strNI += '<span class="conDeuda"></span>';}
			    strNI += '</div></div><div class="collapsible-body bgGray"><div style="text-align: center;">'+
			    		 //'<div class="col s12"><a id="" class="col s12 waves-effect waves-light btn-large" style="background: #FF5252;">NO ACTUAR</a></div>'+
			             '<a class="waves-effect botonOpciones accent-color btn-clientes-venta" id="'+arrId[0]+'-'+data.codCliente+'" href="javascript:void(0)">VENDER</a>'+
			             '<a class="waves-effect botonOpciones accent-color btn-clientes-despacho" id="'+arrId[1]+'-'+data.codCliente+'" href="javascript:void(0)">DESPACHAR</a>'+
			             '<a class="waves-effect botonOpciones accent-color btn-clientes-cobrar" id="'+arrId[2]+'-'+data.codCliente+'" href="javascript:void(0)">COBRAR</a>'+
			             '<a class="waves-effect botonOpciones btn-clientes-noActuar" id="'+arrId[3]+'-'+data.codCliente+'" href="javascript:void(0)" style="background: #ff9a00;">NO ACTUAR</a></div><div class="contenedor-demp">'+
			             '<div class="cont-detEmp"><div class="para-detEmp">Giro:</div><div class="val-detEmp">'+data.giro+'</div></div>'+
						 '<div class="cont-detEmp"><div class="para-detEmp">Clasificación:</div><div class="val-detEmp">'+data.clasificacion+'</div></div>'+
						 '<div class="cont-detEmp"><div class="para-detEmp">Dirección:</div><div class="val-detEmp">'+data.direccion_p+'</div></div>'+
						 '<div class="cont-detEmp"><div class="para-detEmp">Contacto:</div><div class="val-detEmp">'+data.contacto+' <br> '+data.celContacto+'</div></div>';
				if(data.deuda > 0){strNI += '<div class="cont-detEmp"><div class="para-detEmp">Deuda:</div><div class="val-detEmp">S/ 203 <br> (18/07/2016)</div></div>';}
				if(data.despacho == true){strNI +='<div class="cont-detEmp"><div class="para-detEmp">Despacho pendiente:</div><div class="val-detEmp">SI</div></div>';}
				strNI += '<div class="cont-detEmp"><div class="para-detEmp">Ultima visita:</div><div class="val-detEmp">'+data.fechaUltimaVisita;
				if(data.contactoUltimaVisita != "" && data.contactoUltimaVisita != null ){strNI +=' <br> '+data.contactoUltimaVisita}
				strNI += '</div></div></div></div></li>';
		return strNI;
		//<div class="col s12"><a id="noCliente" class="col s12 waves-effect waves-light btn-large" style="background: #FF5252;">SIN VENTA</a></div>
	}

	function mostrarCombos(data, idCombo, index)
	{
		$(idCombo).html("");
		if(data.length > 0)
		{
			if(index == true){ $(idCombo).append('<option value="0">Sin comentarios</option>'); }

			for (var i = 0; i < data.length; i++) {
				$(idCombo).append('<option value="'+data[i].codigo+'">'+data[i].descripcion+'</option>');
			}
			$(idCombo).material_select();
		}
	}

	$("body").on('keyup', '#buscar-ruta', function(){
	//$("#buscar-ruta").keyup(function(){
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

	$("body").on('keyup', '#buscarAllCliente', function(){
	//$("#buscarAllCliente").keyup(function(){
		var bus = $(this).val().toUpperCase().trim();
		buscarCliente(arregloTodoclientes, bus);
	});

	function buscarCliente(arreglo, buscar)
	{
		var na = new Array();
		$("#cont-clientes-todo").html("")
		var data = arregloTodoDatosclientes;
		if(buscar.length > 0 && arreglo.length > 0)
		{
			for (var i = 0; i < arreglo.length; i++) 
			{
				if(arreglo[i].descripcion.indexOf(buscar) != -1 || arreglo[i].codigo.indexOf(buscar) != -1)
				{
					if(arreglo[i].codigo == data[i].codCliente.toUpperCase()){
						var strNI = crearItemCliente(data[i], ["tnv","tnd","tnc","tnca"], "" ,"itmt");
						$("#cont-clientes-todo").append(strNI);
					}
				}
			}	
		}
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
		$.mobile.changePage("#VistaDespachar");
	});

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
		var estado = $("#estado-cli-ruta-"+id[1]).html();
		if(estado == "done"){
			Materialize.toast('Ya tiene una venta con el cliente', 3000);
			return false;
		}
		else if(estado == "warning"){
			Materialize.toast('Tiene una venta por sincronizar con el cliente.', 3000);
			return false;
		}
		else{
			iniciarNuevaVenta(idStr);
		}
	});

	function iniciarNuevaVenta(str){
		var	id = str.split("-");
		idClienteVenta = id[1]; //OBTENEMOS CODIGO DEL CLIENTE NUEVA VENTA
		limpiarFormularioNuevaVenta()//limpiar todos los datos 
		$("#id-cliente-nv").val(idClienteVenta);
		
		/*SELECT TABLA CLIENTE BD PHONE, FILTRO IDCLIENTE */var dataCliente = '[{"codCliente":"CL0002", "razonSocial":"Canto Rodado SAC", "ruc":"27345345515", "direccion_p":"Aramburu 342 - Mirafloress", "atendido":"si", "ruta":true, "tipo":"empresa"}]';
		dataCliente = JSON.parse( convertirJSONTemp(dataCliente) );

		/*SELECT TABLA DIRECCIONES BD PHONE, FILTRO IDCLIENTE */var dataDirec = '[{"codigoDir":"DI0001", "codigoCliente":"CL0002", "direccion":"Aramburu 342 - Miraflores"},'+
			'{"codigoDir":"DI0002", "codigoCliente":"CL0002", "direccion":"Los portales 123- SJM"},'+
			'{"codigoDir":"DI0003", "codigoCliente":"CL0002", "direccion":"Angamos 342 - El Agustino"}]';
		dataDirec = JSON.parse( convertirJSONTemp(dataDirec) );

		$("#razon-social-nv").val(dataCliente[0].razonSocial)

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

			$("#inp-direccion-nv").val(dataCliente[0].direccion_p)
		}

		if(dataCliente[0].tipo == "empresa")
		{
			$("#rdb-factura").prop("checked", true);
		}
		else if(dataCliente[0].tipo == "persona")
		{
			$("#rdb-boleta").prop("checked", true);
		}

		$.mobile.changePage("#FormNuevaVenta");
	}

	function limpiarFormularioNuevaVenta()
	{
		arregloPedidosNV = []; //limpia arreglo de ventas
		$("#id-cliente-nv").val(0);
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
		$.mobile.changePage("#FormNuevaVenta");
	});

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
			var dirEntrega = $("#inp-direccion-nv").val();
			if(dirEntrega == "")
			{
				dirEntrega = $("#sel-direccion-nv option:selected").text();
			}

			if(dirEntrega != ""){
				var codCliente = $("#id-cliente-nv").val();
			
				var tipoPago = $("input[name=rdb-tipo-pago-nv]:checked").val();
				var tipoVenta = $("input[name=rdb-tipo-venta-nv]:checked").val();

				var dataCabeceraVenta = new Array();
				dataCabeceraVenta.push({codCliente:codCliente, dirEntrega:dirEntrega, tipoPago:tipoPago, tipoVenta:tipoVenta});
				
				guardarNuevaVentaPhone(dataCabeceraVenta);
			}
			else{
				Materialize.toast('Verificar dirección de entrega.', 3000);
				return false;
			}
			
		}
		else{
			Materialize.toast('No hay productos en la lista.', 3000);
			return false;
		}
	});

	function guardarNuevaVentaPhone(data)
	{
		var detalleV = arregloPedidosNV;
		//limpiarFormularioNuevaVenta();
		//GUARDAR CABECERA EN LA BD PHONE
		//GUARDAR EL DETALLE EN LA BD PHONE 
		//CAMBIAR ATENDIDO A "si" o "falla" o "no" --> DEPENDE SI GUARDA A LA BD SERVER
		data[0].codVenta = "VE0001";
		guardarNuevaVentaServer(data, detalleV);
	}

	function guardarNuevaVentaServer(data, detalleV)
	{
		//ENVIAR AL SERVIDOR DEL CLIENTE
		//CAMBIAR ATENDIDO A "si" o "falla" o "no" --> DEPENDE SI GUARDA A LA BD SERVER
		console.log(data)
		console.log(detalleV)

		cargarClientesRutaPhone() //vuelve a cargar la lista principal de clientes en ruta con sus estados

		Materialize.toast('Venta exitosa.', 3000);
		$.mobile.back(); //guarde o no guarde en el servidor debe regresar a la pantalla anterior***********
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
		
		if(existe)
		{
			var veriProd = false;
			if(arregloPedidosNV.length > 0){
				for (var i = 0; i < arregloPedidosNV.length; i++) {
					if(arregloPedidosNV[i].codigo == cod){veriProd = true; break;}
				}
			}
			if(veriProd == false)
			{
				$("#codigo-producto-nv").val("")
				informacionProductoAgregar(cod);
				$('#modalAddProd').openModal();
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

	function selectinformacionProducto(cod)
	{
		/*SELECT PRODUCTO PHONE, FILTRO CODIGO*/var dataProducto = '[{"nombreProducto":"PRODUCTO 1", "precio":110.20, "precioCredito":120.20, "stock":34234, "undMedida":"Und", "corte":true}]';
					dataProducto = JSON.parse( convertirJSONTemp(dataProducto) );

		return dataProducto;
	}

	function selectinformacionProductoCorte(cod)
	{
		/*SELECT CORTE PHONE, FILTRO CODIGO*/var dataCorte = '[{"precio":110.20, "corte":1},'+
							'{"precio":105.30, "corte":20}]';
					dataCorte = JSON.parse( convertirJSONTemp(dataCorte) );
		return dataCorte;
	}

	function informacionProductoAgregar(cod)
	{
		limpiarAgregarProducto();
		/*SELECT PRODUCTO PHONE, FILTRO CODIGO var dataProducto = '[{"nombreProducto":"PRODUCTO 1", "precio":110.20, "precioCredito":120.20, "stock":34234, "undMedida":"Und", "corte":true}]';
					dataProducto = JSON.parse( convertirJSONTemp(dataProducto) );*/

		/*SELECT CORTE PHONE, FILTRO CODIGO var dataCorte = '[{"precio":110.20, "corte":1},'+
							'{"precio":105.30, "corte":20}]';
					dataCorte = JSON.parse( convertirJSONTemp(dataCorte) );*/
		var dataProducto = selectinformacionProducto(cod);
		var dataCorte = selectinformacionProductoCorte(cod);

		$("#nombre-prod-add").html(dataProducto[0].nombreProducto);
		$("#cod-prod-add").val(cod);
		$("#stock-prod").val(dataProducto[0].stock);
		$("#unidad-prod").val(dataProducto[0].undMedida)

		if(dataProducto[0].corte == false)
		{
			arregloPrecioProductoAdd.push({corte:dataProducto[0].corte, precio:dataProducto[0].precio, precioCredito:dataProducto[0].precioCredito});
			var str = '<div class="info-item-pre"><span>Fijo</span><span class="precio-gen">'+dataProducto[0].precio+'</span></div>'+
					  '<div class="info-item-pre"><span>Credito</span><span class="precio-gen">'+dataProducto[0].precioCredito+'</span></div>';
			$("#cont-info-precio").append(str);
		}
		else{
			
			var str = "";
			for (var i = 0; i < dataCorte.length; i++) 
			{
				arregloPrecioProductoAdd.push({corte:dataProducto[0].corte, precio:dataCorte[i].precio, ncorte:dataCorte[i].corte});

				str += '<div class="info-item-pre"><span>'+dataCorte[i].corte+' a '; 
				if( dataCorte[i+1] != undefined ){ str += dataCorte[i+1].corte-1 }else{ str += " más"}
				str += '</span><span class="precio-gen">'+dataCorte[i].precio+'</span></div>';
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
		$("#cod-prod-add").val(0)
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
			if(arregloPrecioProductoAdd[0].corte == true)
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
		
		if (cantidad > 0)
		{
			agregarItemListaPedido(codigo, nombre, precio, cantidad, importe);
			$("#modalAddProd").closeModal();
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

	$("body").on('keyup', '.text-cant-itm-nv', function(){
		var str = $(this).attr("id");
		str = str.split("-");
		var	id = str[2];
		var cant = parseInt($(this).val());
		if(cant > 0)
		{
			actualizarCantidadProductoListaNV(id, cant);
		}
	});

	$("body").on('focusout', '.text-cant-itm-nv', function(){
		var val = $(this).val();
		if( val == 0 || val == "" )
		{
			Materialize.toast('Ingrese una cantidad correcta.', 3000);
			$(this).focus();
		} 
	});

	function actualizarCantidadProductoListaNV(id, cant)
	{
		arregloPrecioProductoAdd = [];

		var dataProducto = selectinformacionProducto(id);
		if(dataProducto[0].corte == false)
		{
			arregloPrecioProductoAdd.push({corte:dataProducto[0].corte, precio:dataProducto[0].precio, precioCredito:dataProducto[0].precioCredito});
		}
		else{
			var dataCorte = selectinformacionProductoCorte(id);
			for (var i = 0; i < dataCorte.length; i++) 
			{
				arregloPrecioProductoAdd.push({corte:dataProducto[0].corte, precio:dataCorte[i].precio, ncorte:dataCorte[i].corte});
			}
		}

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

	$("body").on('change', '#opcion-cliente', function(e){
		var a = $(this).val();
		switch(a) {
		    case "1":
		        $.mobile.changePage("#FormNuevoCliente");
		        break;
		    case "2":
		    	cargarArregloClientes();
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
	
});
