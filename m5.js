// -*- coding: utf-8 -*-
var geocoder;

// subroutines

function clearGeocodeResult () {
    [ "faddr", "stLat", "stLng" ].forEach( function( elm ) {
	document.getElementById( elm ).innerHTML = "";
    });
}

function cbPaste () {
    document.getElementById( "addr" ).value = clipboardData.getData( "text" );
    clearGeocodeResult();
    document.getElementById( "btnGeo" ).focus();
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
    return str.replace( /[-A-Za-z0-9]/g, function( s ) {
	return String.fromCharCode( s.charCodeAt( 0 ) + 0xFEE0 );
    });
}

function makeMap( canvas, lat, lng, option ) {
    [ [ 'center' , new google.maps.LatLng( lat, lng ) ],
      [ 'panControl' , false ],
      [ 'scaleControl' , true ],
      [ 'zoomControlOptions' , { style: google.maps.ZoomControlStyle.SMALL } ],
      [ 'mapTypeId' , google.maps.MapTypeId.ROADMAP ] ].forEach( function( e ) {
	  option[ e[0] ] = e[1];
      });
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

function drawBoundArea ( map ) {
    var coords = objBoundLine[ getOptionValue( "boundAddr" ) ];
    if ( coords ) {
	var path = coords.split( " " ).map( function( e ) {
	    var c = e.split( "," );
	    return { lat: Number( c[1] ),
		     lng: Number( c[0] ) }
	});
	drawPolyline( map, path, { strokeColor: "cyan",
				   strokeOpacity: 0.8,
				   strokeWeight: 2 } );
    }
}

function drawControl ( map, str, pos, color ) {
    var container = document.createElement( "div" );
    [ [ "margin",     "10px" ],
      [ "padding",    "5px"],
      [ "border",     "1px solid #000" ],
      [ "background", "#fff" ],
      [ "color", color ],
      [ "fontSize",   "14px" ] ].forEach( function( e ) {
	  container.style[ e[0] ] = e[1];
      });
    container.innerText = str;
    if ( pos ) {
	map.controls[ pos ].push( container );
    } else {
	map.controls[ google.maps.ControlPosition.BOTTOM_LEFT ].push( container );
    }
}

function checkInData () {
    var stLat = document.getElementById( "stLat" ).innerHTML;
    var stLng = document.getElementById( "stLng" ).innerHTML;
    if( stLat == "" ) {
	alert( "出発地点が未入力です" );
	return false;
    }

    var sel = document.getElementById( "shokuba" );
    if ( sel.selectedIndex < 0 ) {
	alert( "目的地が選択されていません" );
	return false;
    }
    var wp = sel.options[ sel.selectedIndex ].value.split( "," );
    var edLat = wp[3];
    var edLng = wp[4];
    return [ stLat, stLng, edLat, edLng, wp ];
}

function setBoundArea () {
    var mCity, mAddr;
    var addr = document.getElementById( "addr" ).value;
    for ( var i = 1, max = objBound.length; i < max; i++ ) {
	var str = objBound[i][1] + objBound[i][2];
	if ( addr.indexOf( str ) > -1 ) {
	    mCity = objBound[i][1];
	    mAddr = objBound[i][2];
	    break;
	}}

    if ( mCity ) {
	var sel = document.getElementById( "boundCity" );
	for ( var i = 0, max = sel.length; i < max; i++ ) {
	    if ( mCity == sel.options[i].value ) {
		sel.selectedIndex = i;
		changeCity( mCity );
		break;
	    }}
	var sel = document.getElementById( "boundAddr" );
	for ( var i = 0, max = sel.length; i < max; i++ ) {
	    if ( mAddr == sel.options[i].text ) {
		sel.selectedIndex = i;
		break;
	    }}
    } else {
	document.getElementById( "boundCity" ).selectedIndex = 0;
	changeCity( "---" );
    }
}

function getGeocode () {
    var addr = document.getElementById( "addr" ).value;
    if ( addr == "" ) {
	alert( "住所欄が未入力です" );
	return;
    }
    addr = replaceZenkaku( addr );
    document.getElementById( "addr" ).value = addr;
    clearGeocodeResult();
    geocoder.geocode(
	{ address: addr },
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
    setBoundArea();
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
    ary.forEach( function( e ) {
	result = result + e + "　";
    });
    return result;
}

function changeKyoku ( kyoku ) {
    var dom = removeOptions( document.getElementById( "shokuba" ) );
    objWorkplace[ kyoku ].forEach( function( e ) {
	addOption( dom, e, arrangeText( e ) );
    });
}

function doSearchShokuba ( keyCode ) {
    if ( keyCode === 13 ) {
	if ( searchShokuba() ) {
	    document.getElementById( "shokuba" ).focus();
	} else {
	    document.getElementById( "kword" ).focus();
	}}}

function searchShokuba () {
    var kword = document.getElementById( "kword" ).value;
    if ( kword == "" ) {
	alert( "キーワードが未入力です" );
	return false;
    }

    var result = [];
    Object.keys( objWorkplace ).forEach( function( key ) {
	objWorkplace[ key ].forEach( function( str ) {
	    if ( str.indexOf( kword ) > -1 ) {
		result.push( str );
	    }});
    });
    if ( result.length == 0 ) {
	alert( "該当なし" );
	return false;
    }

    var dom = removeOptions( document.getElementById( "shokuba" ) );
    result.forEach( function( e ) {
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
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }
    var stLat = latlng[0];
    var stLng = latlng[1];
    var edLat = latlng[2];
    var edLng = latlng[3];
    var map = makeMap( "yougu_map", stLat, stLng, { zoom: 18 } );

    // 地下鉄を強調表示
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( map );

    // 出発地点を半径１ｋｍの円で囲む
    makeCircle( map, stLat, stLng );

    var col = document.getElementsByName( "walk" )[0].checked ?
	'#FF66FF' :
	'#00FFFF';
    var directionsRenderer = new google.maps.DirectionsRenderer(
	{ draggable: true,
	  polylineOptions: { strokeOpacity: 0.5,
			     strokeWeight: 5,
			     strokeColor: col }});
    directionsRenderer.setMap( map );

    var tMode = document.getElementsByName( "walk" )[0].checked ?
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
	
    drawBoundArea( map );

   // document.getElementsByClassName( "adp-summary" ).style.borderColor = col;
}

// ＪＲ線・地下鉄
function getNearStations ( lat, lng ) {
    // objStations ... 別ファイル [ id, name, lat, lng ]
    var result = objStations.map(
	function( s ) {
	    var h1 = Math.abs( lat - s[2] );
	    var h2 = Math.abs( lng - s[3] );
	    return { id:   s[0],
		     name: s[1],
		     lat:  s[2],
		     lng:  s[3],
		     dist: h1 * h1 + h2 * h2 };
	});
    result.sort( function( a, b ) {
	if ( a.dist < b.dist ) return -1;
	if ( a.dist > b.dist ) return 1;
	return 0;
    });
    return result.slice( 0, 5 ); // 上位５つ
}

function attachMessage( marker, msg ) {
    google.maps.event.addListener( marker, 'click', function( event ) {
	new google.maps.InfoWindow( { content: msg } ).open( marker.getMap(), marker );
    });
}

function dispNearStation () {
    var stLat, stLng, edLat, edLng;
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }
    stLat = latlng[0];
    stLng = latlng[1];
    edLat = latlng[2];
    edLng = latlng[3];
    var map = dispNearStationSub( "left_station_map", stLat, stLng );
    drawBoundArea( map );
    drawControl( map, document.getElementById( "faddr" ).innerHTML, false, "black" );

    var map = dispNearStationSub( "right_station_map", edLat, edLng );
    drawControl( map, latlng[4][0] + " " + latlng[4][1] + " " + latlng[4][2],
		 false, "black" );
}

function dispNearStationSub ( mapDomName, lat, lng ) {
    var map = makeMap( mapDomName, lat, lng, { zoom: 14 } );
    makeMarker( lat, lng,
		"https://maps.google.co.jp/mapfiles/ms/icons/" +
		{ left_station_map: "green-dot.png",
		  right_station_map: "red-dot.png" }[ mapDomName ],
		map );
    makeCircle( map, lat, lng );

    getNearStations( lat, lng ).forEach(
	function( e, idx, ary ) {
    	    var dist = google.maps.geometry.spherical.computeDistanceBetween(
		new google.maps.LatLng( lat, lng ),
    		new google.maps.LatLng( e["lat"], e["lng"] ) );
	    var marker = makeMarker( e["lat"], e["lng"], "http://labs.google.com/ridefinder/images/mm_20_orange.png", map );
    	    var str = "(" + ( idx + 1 ) + ") " + e["name"] + ": " + Math.floor( dist ) + "m";
    	    attachMessage( marker, str );
    	    google.maps.event.trigger( marker, "click" );
	});
    return map;
}

function getNearBusStop ( lat, lng ) {
     var result = Object.keys( objbusstops ).
	map( function( key ) {
	    var v = objbusstops[ key ].split( "," );
	    var h1 = Math.abs( lat - v[0] );
	    var h2 = Math.abs( lng - v[1] );
	    return { id:   key,
		     lat:  v[0],
		     lng:  v[1],
		     name: v[2],
		     dist: h1 * h1 + h2 * h2 };
	});

    result.sort( function( a, b ) {
	if ( a.dist < b.dist ) return -1;
	if ( a.dist > b.dist ) return 1;
	return 0;
    });
    return result.slice( 0, 10 ); // 上位
}

function searchNearBusStop () {
    var lat, lng;
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }
    if ( document.getElementsByName( "busAround" )[0].checked ) {
	lat = latlng[0];
	lng = latlng[1];
    } else {
	lat = latlng[2];
	lng = latlng[3];
    }
    var sel = removeOptions( document.getElementById( "busStops" ) );
    getNearBusStop( lat, lng ).forEach( function( e ) {
	addOption( sel, e['id'], e['name'] );
    });
}

function searchNameBusStop () {
    var kword = document.getElementById( "busstopname" ).value;
    var result = Object.keys( objbusstops ).filter( function( id ) {
	return ( objbusstops[ id ].split(",")[2].indexOf( kword ) > -1 )
    });
    var sel = removeOptions( document.getElementById( "busStops" ) );
    result.forEach( function( id ) {
	addOption( sel, id, objbusstops[ id ].split(",")[2] );
    });
}

function changeBusStop ( id ) {
    var sel = removeOptions( document.getElementById( "busRoutes" ) );
    var result = objBusStopRoute.filter( function( e ) {
    	return ( id == e[0] );
    });
    result.forEach( function( e ) {
	addOption( sel, e[1] + e[2], e[2] + "（" + e[1] + "）" );
    });
}

function drawBusRoute ( map, route, color ) {
    objBusRoute[ route ].forEach( function( e ) {
	var path = e.split( " " ).map( function( x ) {
	    var z = x.split( "," );
	    return { lng: Number( z[0] ),
		     lat: Number( z[1] ) };
	});
	drawPolyline( map, path, { strokeColor: color,
				   strokeOpacity: 0.5,
				   strokeWeight: 3 } );
    });
}

function drawBusStops ( map, busRouteKey, image, advance ) {
    // バス路線に含まれるバス停を抽出
    var aryBusStop = objBusStopRoute.filter( function( e ) {
	return ( e[1] + e[2] == busRouteKey );
    });

    aryBusStop.forEach( function( e ) {
	var s = objbusstops[ e[0] ].split( "," );
    	var marker = makeMarker( s[0] , s[1], image, map );
    	attachMessage( marker, s[2] );
	if ( e[0] == advance ) {
	    google.maps.event.trigger( marker, "click" );
	}	
    });
}

// 「選択したバス停を含む路線」listbox をクリック
function dispBusRoute ( busRouteKey ) {
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }
    var lat = latlng[0];
    var lng = latlng[1];

    var map = makeMap( "bus_map", lat, lng, { zoom: 14 } );
    drawBoundArea( map );
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( map );

    var url = "https://maps.google.co.jp/mapfiles/ms/icons/";
    makeMarker( lat,       lng,       url + "green-dot.png", map );
    makeMarker( latlng[2], latlng[3], url + "red-dot.png",   map );

    makeCircle( map, lat, lng );

    // バス停
    var url = "http://labs.google.com/ridefinder/images/";
    drawBusStops( map, busRouteKey, url + "mm_20_orange.png",
		  getOptionValue( "busStops" ) );

    // バス路線
    drawBusRoute( map, busRouteKey, "#FF0000" )
    var sel = document.getElementById( "busRoutes" );
    drawControl( map, sel.options[ sel.selectedIndex ].text,
		 false, "orange" );

    // 路線を固定
    busRouteKey = document.getElementById( "lock" ).value;
    if ( busRouteKey != "" ) {
	drawBusRoute ( map, busRouteKey, "#00FF00" )
	drawBusStops( map, busRouteKey, url + "mm_20_green.png", false );
	drawControl( map, busRouteKey, google.maps.ControlPosition.BOTTOM_CENTER,
		     "green" );
    }
}

function lock () {
    document.getElementById( "lock" ).value = getOptionValue( "busRoutes" );
}

function unlock () {
    document.getElementById( "lock" ).value = "";
}

function setupShokuba () {
    var dom = document.getElementById( "kyoku" );
    Object.keys( objWorkplace ).forEach( function( e ) {
	addOption( dom, e, e );
    });
}

function setupBoundCity () {
    var dom = document.getElementById( "boundCity" );
    [ "---",          "札幌市中央区", "札幌市北区",   "札幌市東区", "札幌市白石区",
      "札幌市厚別区", "札幌市豊平区", "札幌市清田区", "札幌市南区", "札幌市西区",
      "札幌市手稲区", "小樽市",       "岩見沢市",     "江別市",     "千歳市",
      "恵庭市",       "北広島市",     "石狩市" ].forEach( function( e ) {
	addOption( dom, e, e );
    });
}

function changeCity ( city ) {
    var addr = objBound.filter( function( e ) {
	return ( e[1] == city );
    });
    addr.sort( function( a, b ) {
	if ( a[4] < b[4] ) return -1;
	if ( a[4] > b[4] ) return 1;
	return 0;
    });
    var sel = removeOptions( document.getElementById( "boundAddr" ) );
    addr.forEach( function( e ) {
	addOption( sel, e[0], e[2] );
    });
}

function init () {
    setupShokuba();
    setupBoundCity();
    changeCity( getOptionValue( "boundCity" ) );
    geocoder = new google.maps.Geocoder();

    document.onkeydown = function() {
	if ( event.ctrlKey && event.keyCode == 68 ) { // CTRL-d
	    event.keyCode = null;
	    document.getElementById( "link_departure" ).click();
	    document.getElementById( "btnPaste" ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 82 ) { // CTRL-r
	    event.keyCode = null;
	    document.getElementById( "link_yougu" ).click();
	    document.getElementById( "btnDist" ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 83 ) { // CTRL-s
	    event.keyCode = null;
	    document.getElementById( "link_jrsubway" ).click();
	    document.getElementById( "btnJrSubway" ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 66 ) { // CTRL-b
	    event.keyCode = null;
	    document.getElementById( "link_bus" ).click();
	    document.getElementById( "btnBus" ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 86 ) { // CTRL-v
	    event.keyCode = null;
	    document.getElementById( "link_departure" ).click();
	    document.getElementById( "addr" ).value = "";
	    cbPaste();
	    document.getElementById( "btnGeo" ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 65 ) { // CTRL-a
	    event.keyCode = null;
	    document.getElementById( "btnGeo" ).click();
	    return false;
	}
    }
}
