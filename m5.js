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

function addOptions ( sel, value, text ) {
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
};

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
	addOptions( dom, e, arrangeText( e ) );
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
	alert("該当なし");
	return false;
    }

    var dom = removeOptions( document.getElementById( "shokuba" ) );
    result.forEach( function ( e ) {
	addOptions( dom, e, arrangeText( e ) );
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
    var circleOptions = { strokeColor: "#c71585",
			  strokeOpacity: 0.1,
			  strokeWeight: 3,
			  fillColor: "#ff1493",
			  fillOpacity: 0.02,
			  clickable: false,
			  map: map,
			  center: new google.maps.LatLng( stLat, stLng ),
			  radius: 1000
			};
    var circle = new google.maps.Circle( circleOptions );

    var col = document.getElementsByName( "yougu" )[0].checked ?
	'#FF66FF' :
	'#00FFFF';
    var plo = new google.maps.Polyline( { strokeOpacity: 0.5,
					  strokeWeight: 5,
					  strokeColor: col
					});

    var directionsRenderer = new google.maps.DirectionsRenderer( { draggable: true,
								   polylineOptions: plo
								 } );
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
	
    // document.getElementsByClassName( "adp-summary" ).style.borderColor = col;
}

// ＪＲ線・地下鉄
function makeCircle( map, latlng ) {
    var circleOptions = { strokeColor: "#c71585",
			  strokeOpacity: 0.1,
			  strokeWeight: 3,
			  fillColor: "#ff1493",
			  fillOpacity: 0.02,
			  clickable: false,
			  map: map,
			  center: latlng,
			  radius: 1000
			};
    var circle = new google.maps.Circle( circleOptions );
}

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
    var objLatLngFrom = new google.maps.LatLng( lat, lng );
    var map = makeMap( mapDomName, lat, lng, { zoom: 14 } );
    makeMarker( lat, lng,
		"https://maps.google.co.jp/mapfiles/ms/icons/green-dot.png", map );
    makeCircle( map, objLatLngFrom );

    getNearStations( lat, lng ).forEach(
	function ( e, idx, ary ) {
    	    var dist = google.maps.geometry.spherical.computeDistanceBetween(
		objLatLngFrom,
    		new google.maps.LatLng( e["lat"], e["lng"] ) );
	    var marker = makeMarker( e["lat"], e["lng"], "http://labs.google.com/ridefinder/images/mm_20_orange.png", map );
    	    var str = "(" + ( idx + 1 ) + ") " + e["name"] + ": " + Math.floor( dist ) + "m";
    	    attachMessage( marker, str );
    	    google.maps.event.trigger( marker, "click" );
	});
}

//
function getNearBusStop ( lat, lng ) {
    // id, lat, lng, name
    var result = objbusstops.map( function ( s ) {
	var h1 = Math.abs( lat - s[1] );
	var h2 = Math.abs( lng - s[2] );
	return { id:   s[0],
		 lat:  s[1],
		 lng:  s[2],
		 name: s[3],
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
	addOptions( sel, e['id'], e['name'] );
    });
}

function changeBusStop ( id ) {
    var sel = removeOptions( document.getElementById( "busRoutes" ) );
    var result = objBusStopRoute.filter( function (e) {
    	return ( id == e[0] );
    });
    result.forEach( function ( e ) {
	addOptions( sel, e[1] + e[2], e[2] + "（" + e[1] + "）" );
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

    // バス停(1)
    var a = [];
    for ( var i = 0; i < objBusStopRoute.length; i++ ) {
	if ( ( objBusStopRoute[i][1] + objBusStopRoute[i][2] ) == str ) {
	    a.push( objBusStopRoute[i][0] );
	}
    }

    // バス停(2)
    var sel = document.getElementById( "busStops" );
    var id = sel.options[ sel.selectedIndex ].value;
    for ( var i = 0; i < a.length; i++ ) {
	for ( var j = 0; j < objbusstops.length; j++ ) {
	    if ( a[i] == objbusstops[j][0] ) {
		var marker = makeMarker( objbusstops[j][1] , objbusstops[j][2],
					 "http://labs.google.com/ridefinder/images/mm_20_white.png", map );
		attachMessage( marker, objbusstops[j][3] )
		// バス停リストボックスと一致するバス停には、あらかじめフキダシ表示する
		if ( id == objbusstops[j][0] ) {
		    google.maps.event.trigger( marker, "click" );
		}
		break;
	    }
	}
    }

    // バス路線
    var multiPoly = objBusRoute[ str ];
    for ( var i = 0; i < multiPoly.length; i++ ) {
	var p = [];		// [ A, B ]
	for ( var j = 0; j < multiPoly[i].length; j++ ) {
	    var d = multiPoly[i][j].split(",");
	    // console.info( d[0], d[1] );
	    p.push( { lng: Number( d[0] ), lat: Number( d[1] ) } );
	}
	var objLine = new google.maps.Polyline( { path: p,
						  strokeColor: '#FF0000',
						  strokeOpacity: 0.5,
						  strokeWeight: 3
						});
	objLine.setMap( map );
    }

    var container = document.createElement( "div" );
    container.style.margin = "10px";
    container.style.padding = "5px";
    container.style.border = "1px solid #000";
    container.style.background = "#fff";
    container.style.fontSize = "14px";
    var sel = document.getElementById( "busRoutes" );
    container.innerText = sel.options[ sel.selectedIndex ].text;
    map.controls[ google.maps.ControlPosition.BOTTOM_LEFT ].push( container );
}

//
function setupShokuba () {
    var dom = document.getElementById( "kyoku" );
    var keys = Object.keys( objWorkplace );
    keys.forEach( function ( e ) {
	addOptions( dom, e, e );
    });
}

function init () {
    setupShokuba();
    geocoder = new google.maps.Geocoder();
}
