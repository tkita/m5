// -*- coding: utf-8 -*-
var geocoder;

// subroutines

function clearGeocodeResult () {
    [ "faddr", "stLat", "stLng" ].forEach( function ( elm ) {
	document.getElementById( elm ).innerHTML = "";
    });
}

function cbPaste () {
    document.getElementById( "addr" ).value = clipboardData.getData( "text" );
    clearGeocodeResult();
}

function removeAllChilds ( e ) {
    while ( e.firstChild ) {
	e.removeChild( e.firstChild );
    }
    return e;
}

function addOption ( sel, value, text ) {
    var opt = document.createElement( "option" );
    opt.value = value;
    opt.appendChild( document.createTextNode( text ) );
    sel.appendChild( opt );
}

function getOptionValue ( domId ) {
    var sel = document.getElementById( domId );
    return sel.options[ sel.selectedIndex ].value;
}

function removeOptions ( sel ) {
    while ( sel.options.length ) {
	sel.remove(0);
    }
    return sel;
}

function replaceZenkaku ( str ) {
    return str.replace( /[-A-Za-z0-9]/g, function ( s ) {
	return String.fromCharCode( s.charCodeAt( 0 ) + 0xFEE0 );
    });
}

function makeMap( canvas, lat, lng, option ) {
    option.center = new google.maps.LatLng( lat, lng );
    option.panControl = false;
    option.scaleControl = true;
    option.zoomControlOptions = { style: google.maps.ZoomControlStyle.SMALL };
    option.mapTypeId = google.maps.MapTypeId.ROADMAP;
    return new google.maps.Map( document.getElementById( canvas ), option );
}

function makeMarker( lat, lng, image, map ) {
    var marker = new google.maps.Marker(
	{ position: new google.maps.LatLng( lat, lng ),
	  icon: new google.maps.MarkerImage( image ),
	  map: map });
    return marker;
}

function makeCircle( map, lat, lng ) {
    var circleOptions = { strokeColor: "green", // "#c71585",
			  strokeOpacity: 0.3,
			  strokeWeight: 3,
			  fillColor: "#ff1493",
			  fillOpacity: 0,
			  clickable: false,
			  map: map,
			  center: new google.maps.LatLng( lat, lng ),
			  radius: 1000   // 半径 1000 m
			};
    var circle = new google.maps.Circle( circleOptions );
}

function drawPolyline ( map, path, option ) {
    option.path = path;
    option.geodesic = true;
    var objPolyline = new google.maps.Polyline( option );
    objPolyline.setMap( map );
}

// 
function getGeocode () {
    clearGeocodeResult();
    geocoder.geocode(
	{ address: document.getElementById( "addr" ).value },
	function( results, status ) {
	    if ( status == google.maps.GeocoderStatus.OK ) {
		document.getElementById( "faddr" ).innerHTML =
		    results[0].formatted_address;
		var l = results[0].geometry.location;
		document.getElementById( "stLat" ).innerHTML = l.lat();
		document.getElementById( "stLng" ).innerHTML = l.lng();
	    } else {
		alert( "Google Geocoder Faild：" + status );
	    }});
}

function arrangeText ( text ) {
    var padding = "　　　　　　　　　　　　　";
    var ary = text.split( "," );
    ary[0] = ( replaceZenkaku( ary[0] ) + padding ).substr( 0, 10 );
    ary[1] = ( replaceZenkaku( ary[1] ) + padding ).substr( 0, 10 );
    ary[2] = ( replaceZenkaku( ary[2] ) + padding ).substr( 0, 20 );
    ary[3] = ( ary[3] + "         " ).substr( 0, 9 );
    ary[4] = ( ary[4] + "         " ).substr( 0, 9 );
    var result = "";
    ary.forEach( function ( e ) {
	result = result + e + "　";
    });
    return result;
}

function changeKyoku ( kyoku ) {
    var dom = removeOptions( document.getElementById( "shokuba" ) );
    objWorkplace[ kyoku ].forEach( function ( e ) {
	addOption( dom, e, arrangeText( e ) );
    });
}

function goSearch ( code ) {
    if ( code === 13 ) {
	if ( searchShokuba() ) {
	    document.getElementById( "shokuba" ).focus();
	} else {
	    document.getElementById( "kword" ).focus();
	}
    }
}

function searchShokuba () {
    var kword = document.getElementById( "kword" ).value;
    if ( kword == "" ) {
	alert( "キーワードが未入力です" );
	return false;
    }

    var result = [];
    Object.keys( objWorkplace ).forEach( function ( key ) {
	objWorkplace[ key ].forEach( function ( str ) {
	    if ( str.indexOf( kword ) > -1 ) {
		result.push( str );
	    }});
    });
    if ( result.length == 0 ) {
	alert( "該当なし" );
	return false;
    }

    var dom = removeOptions( document.getElementById( "shokuba" ) );
    result.forEach( function ( e ) {
	addOption( dom, e, arrangeText( e ) );
    });
    return true;
}

function move () {
    var sel = document.getElementById( "shokuba" );
    if ( sel.selectedIndex < 0 ) {
	alert( "目的地が選択されていません" );
	return;
    }
    var wp = sel.options[ sel.selectedIndex ].value.split( "," );
    document.getElementById( "faddr" ).innerHTML = wp[0] + " " + wp[1];
    document.getElementById( "stLat" ).innerHTML = wp[3];
    document.getElementById( "stLng" ).innerHTML = wp[4];
}

function measure_distance () {
    var stLat = document.getElementById( "stLat" ).innerHTML;
    var stLng = document.getElementById( "stLng" ).innerHTML;
    if( stLat == "" ) {
	alert( "出発地点が未入力です" );
	return;
    }

    var sel = document.getElementById( "shokuba" );
    if ( sel.selectedIndex < 0 ) {
	alert( "目的地が選択されていません" );
	return;
    }
    var wp = sel.options[ sel.selectedIndex ].value.split( "," );
    var edLat = wp[3];
    var edLng = wp[4];
    var map = makeMap( "yougu_map", stLat, stLng, { zoom: 18 } );

    // 地下鉄を強調表示
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( map );

    // 出発地点を半径１ｋｍの円で囲む
    makeCircle( map, stLat, stLng );

    var col = document.getElementsByName( "yougu" )[0].checked ?
	'#FF66FF' :
	'#00FFFF';
    var directionsRenderer = new google.maps.DirectionsRenderer(
	{ draggable: true,
	  polylineOptions: { strokeOpacity: 0.5,
			     strokeWeight: 5,
			     strokeColor: col }});
    directionsRenderer.setMap( map );

    var tMode = document.getElementsByName( "yougu" )[0].checked ?
	google.maps.DirectionsTravelMode.WALKING :
	google.maps.DirectionsTravelMode.DRIVING;
    var request = { origin: new google.maps.LatLng( stLat, stLng ),
		    destination: new google.maps.LatLng( edLat, edLng ),
		    avoidHighways: true,	// true = 高速道路を除外する
		    avoidTolls: true,		// true = 有料区間を除外する
		    travelMode: tMode
		  };
    var directionsService = new google.maps.DirectionsService();
    directionsService.route( request, function( result, status ) {
	if ( status == google.maps.DirectionsStatus.OK ) {
	    directionsRenderer.setDirections( result );
	} else {
	    alert( "Google Directions Service Faild：" + status );
	}
    });
    directionsRenderer.setPanel(
	removeAllChilds( document.getElementById( "directionsPanel" ) ) );
	
    var coords = objBoundLine[ getOptionValue( "boundAddr" ) ];
    if ( coords ) {
	var p = [];
	coords.split( " " ).forEach( function ( e ) {
	    var c = e.split( "," );
	    p.push( { lat: Number( c[1] ),
		      lng: Number( c[0] ) } );
	});
	drawPolyline ( map, p, { strokeColor: '#000',
				 strokeOpacity: 0.8,
				 strokeWeight: 2 } );
    }
    

   // document.getElementsByClassName( "adp-summary" ).style.borderColor = col;
}

// ＪＲ線・地下鉄
function getNearStations ( lat, lng ) {
    // objStations ... 別ファイル [ id, name, lat, lng ]
    var result = objStations.map(
	function ( s ) {
	    var h1 = Math.abs( lat - s[2] );
	    var h2 = Math.abs( lng - s[3] );
	    return { id:   s[0],
		     name: s[1],
		     lat:  s[2],
		     lng:  s[3],
		     dist: h1 * h1 + h2 * h2 };
	});
    result.sort( function ( a, b ) {
	if ( a.dist < b.dist ) return -1;
	if ( a.dist > b.dist ) return 1;
	return 0;
    });
    return result.slice( 0, 5 ); // 上位５つ
}

function attachMessage( marker, msg ) {
    google.maps.event.addListener( marker, 'click', function ( event ) {
	new google.maps.InfoWindow( { content: msg } ).open( marker.getMap(), marker );
    });
}

function dispNearStation () {
    var stLat = document.getElementById( "stLat" ).innerHTML;
    var stLng = document.getElementById( "stLng" ).innerHTML;
    if( stLat == "" ) {
	alert( "出発地点が未入力です" );
	return;
    }

    var sel = document.getElementById( "shokuba" );
    if ( sel.selectedIndex < 0 ) {
	alert( "目的地が選択されていません" );
	return;
    }
    var wp = sel.options[ sel.selectedIndex ].value.split( "," );
    var edLat = wp[3];
    var edLng = wp[4];

    document.getElementById( "leftAddr" ).innerHTML = document.getElementById( "faddr" ).innerHTML;
    document.getElementById( "rightAddr" ).innerHTML = wp[0] + " " + wp[1] + " " + wp[2];

    dispNearStationSub ( "left_station_map", stLat, stLng );
    dispNearStationSub ( "right_station_map", edLat, edLng );
}

function dispNearStationSub ( mapDomName, lat, lng ) {
    var map = makeMap( mapDomName, lat, lng, { zoom: 14 } );
    makeMarker( lat, lng,
		"https://maps.google.co.jp/mapfiles/ms/icons/green-dot.png", map );
    makeCircle( map, lat, lng );

    getNearStations( lat, lng ).forEach(
	function ( e, idx, ary ) {
    	    var dist = google.maps.geometry.spherical.computeDistanceBetween(
		new google.maps.LatLng( lat, lng ),
    		new google.maps.LatLng( e["lat"], e["lng"] ) );
	    var marker = makeMarker( e["lat"], e["lng"], "http://labs.google.com/ridefinder/images/mm_20_orange.png", map );
    	    var str = "(" + ( idx + 1 ) + ") " + e["name"] + ": " + Math.floor( dist ) + "m";
    	    attachMessage( marker, str );
    	    google.maps.event.trigger( marker, "click" );
	});
}

//
function getNearBusStop ( lat, lng ) {
     var result = Object.keys( objbusstops ).
	map( function ( key ) {
	    var v = objbusstops[ key ].split( "," );
	    var h1 = Math.abs( lat - v[0] );
	    var h2 = Math.abs( lng - v[1] );
	    return { id:   key,
		     lat:  v[0],
		     lng:  v[1],
		     name: v[2],
		     dist: h1 * h1 + h2 * h2 };
	});

    result.sort( function ( a, b ) {
	if ( a.dist < b.dist ) return -1;
	if ( a.dist > b.dist ) return 1;
	return 0;
    });
    return result.slice( 0, 10 ); // 上位
}

function searchBusStops () {
    var lat, lng;
    if ( document.getElementsByName( "busAround" )[0].checked ) {
	lat = document.getElementById( "stLat" ).innerHTML;
	lng = document.getElementById( "stLng" ).innerHTML;
    } else {
	var sel = document.getElementById( "shokuba" );
	if ( sel.selectedIndex < 0 ) {
	    alert( "目的地が選択されていません" );
	    return;
	}
	var wp = sel.options[ sel.selectedIndex ].value.split( "," );
	lat = wp[3];
	lng = wp[4];
    }
    if ( lat == "" ) {
	alert( "出発地点が未入力です" );
	return;
    }

    var sel = removeOptions( document.getElementById( "busStops" ) );
    getNearBusStop( lat, lng ).forEach( function ( e ) {
	addOption( sel, e['id'], e['name'] );
    });
}

function changeBusStop ( id ) {
    var sel = removeOptions( document.getElementById( "busRoutes" ) );
    var result = objBusStopRoute.filter( function (e) {
    	return ( id == e[0] );
    });
    result.forEach( function ( e ) {
	addOption( sel, e[1] + e[2], e[2] + "（" + e[1] + "）" );
    });
}

function dispBusRoute ( str ) {
    var lat, lng;
    var wp = getOptionValue( "shokuba" ).split( "," );

    if ( document.getElementsByName( "busAround" )[0].checked ) {
	lat = document.getElementById( "stLat" ).innerHTML;
	lng = document.getElementById( "stLng" ).innerHTML;
    } else {
	lat = wp[3];
	lng = wp[4];
    }

    var map = makeMap( "bus_map", lat, lng, { zoom: 14 } );
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( map );

    makeMarker( lat, lng,
		"http://maps.google.co.jp/mapfiles/ms/icons/green-dot.png", map );

    if ( document.getElementsByName( "busAround" )[0].checked ) {
	lat = wp[3];
	lng = wp[4];
    } else {
	lat = document.getElementById( "stLat" ).innerHTML;
	lng = document.getElementById( "stLng" ).innerHTML;

    }
    makeMarker( lat, lng,
		"http://maps.google.co.jp/mapfiles/ms/icons/red-dot.png", map )

    // バス停
    var id = getOptionValue ( "busStops" );
    var aryBusStop = objBusStopRoute.filter( function ( e ) {
	return ( e[1] + e[2] == str );
    });
    aryBusStop.forEach( function ( e ) {
	var s = objbusstops[ e[0] ].split( "," );
    	var marker = makeMarker( s[0] , s[1],
    	    "http://labs.google.com/ridefinder/images/mm_20_white.png", map );
    	attachMessage( marker, s[2] );
	if ( id == e[0] ) {
	    google.maps.event.trigger( marker, "click" );
	}	
    });

    // バス路線
    objBusRoute[ str ].forEach( function ( e ) {
	var p = e.split(" ").map( function ( x ) {
	    var z = x.split( "," );
	    return { lng: Number( z[0] ),
		     lat: Number( z[1] ) };
	});
	drawPolyline ( map, p, { strokeColor: '#FF0000',
				 strokeOpacity: 0.5,
				 strokeWeight: 3 } );
    });

    var container = document.createElement( "div" );
    [ [ "margin",     "10px" ],
      [ "padding",    "5px"],
      [ "border",     "1px solid #000" ],
      [ "background", "#fff" ],
      [ "fontSize",   "14px" ] ].forEach( function ( e ) {
	  container.style[ e[0] ] = e[1];
      });
    var sel = document.getElementById( "busRoutes" );
    container.innerText = sel.options[ sel.selectedIndex ].text;
    map.controls[ google.maps.ControlPosition.BOTTOM_LEFT ].push( container );
}

//
function setupShokuba () {
    var dom = document.getElementById( "kyoku" );
    Object.keys( objWorkplace ).forEach( function ( e ) {
	addOption( dom, e, e );
    });
}

function setupBoundCity () {
    var city = [];
    objBound.forEach( function ( e ) {
	if ( city.indexOf( e[1] ) == -1 ) {
	    city.push( e[1] );
	}
    });
    city.forEach( function( e ) {
	addOption( document.getElementById( "boundCity" ), e, e );
    });
}

function changeCity ( city ) {
    var addr = objBound.filter( function ( e ) {
	return ( e[1] == city );
    });
    addr.sort( function ( a, b ) {
	if ( a[4] < b[4] ) return -1;
	if ( a[4] > b[4] ) return 1;
	return 0;
    });
    var sel = removeOptions( document.getElementById( "boundAddr" ) );
    addr.forEach( function ( e ) {
	addOption( sel, e[0], e[2] );
    });
}

function init () {
    setupShokuba();
    setupBoundCity();
    changeCity( getOptionValue( "boundCity" ) );
    geocoder = new google.maps.Geocoder();
}
