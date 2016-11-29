// -*- coding: utf-8 -*-
var geocoder = false;

// subroutines
function addOptions ( sel, value, text ) {
    var opt = document.createElement( "option" );
    opt.value = value;
    opt.appendChild( document.createTextNode( text ) );
    sel.appendChild( opt );
}

function removeOptions ( sel ) {
    while ( sel.options.length ) {
	sel.remove(0);
    }
}

function getRadioValue ( radio ) {
    var result = "";
    for ( var i = 0; i < radio.length; i++ ) {
	if ( radio[i].checked ) {
	    result = radio[i].value;
	    break;
	}}
    return result;
}

// 
function getGeocode () {
    [ "faddr", "stLat", "stLng" ].forEach( function ( elm ) {
	document.getElementById( elm ).value = "";
    });

    var addr = document.getElementById( "addr" ).value;
    geocoder.geocode( { address: addr },
		      function( results, status ) {
			  if ( status == google.maps.GeocoderStatus.OK ) {
			      document.getElementById( "faddr" ).innerHTML = results[0].formatted_address;
			      var l = results[0].geometry.location;
			      document.getElementById( "stLat" ).innerHTML = l.lat();
			      document.getElementById( "stLng" ).innerHTML = l.lng();
			  } else {
			      alert( "Google Geocoder Faild：" + status );
			  }
		      } );
}

function arrangeText ( text ) {
    var ary = text.split(",");
    var padding = "　　　　　　　　　　　　　";
    var result = "";
    ary.forEach( function ( e ) {
	result = result + ( e + padding ).substr( 0, padding.length ) + "　";
    });
    return result;
}

function selectShokuba ( kyoku ) {
    var dom = document.getElementById( "shokuba" );
    removeOptions( dom );
    var ary = objWorkplace[ kyoku ];
    ary.forEach( function ( e ) {
	addOptions( dom, e, arrangeText(e) );
    });
}

function searchShokuba () {
    var kword = document.getElementById( "kword" ).value;
    if ( kword == "" ) {
	alert( "キーワードが未入力です" );
	return;
    }
    var keys = Object.keys( objWorkplace );
    var result = [];
    keys.forEach( function ( p ) {
	objWorkplace[ p ].forEach( function ( s ) {
	    if ( s.indexOf( kword ) > -1 ) {
		result.push( s );
	    }
	});
    });

    if ( result.length == 0 ) {
	alert("該当なし");
	return;
    }

    var dom = document.getElementById( "shokuba" );
    removeOptions( dom );
    result.forEach( function ( e ) {
	addOptions( dom, e, arrangeText( e ) );
    });
}

function measure_distance () {
    var rValue = getRadioValue( document.getElementsByName( "yougu" ) );

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
    var wp = sel.options[ sel.selectedIndex ].value;
    var edLat = wp.split( "," )[3];
    var edLng = wp.split( "," )[4];
    var myOptions = {
        zoom: 18,
        panControl: false,
        scaleControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map( document.getElementById( "yougu_map" ), myOptions );

    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( map );

    var circleOptions = {
	strokeColor:   "#c71585",
	strokeOpacity: 0.1,
	strokeWeight:  3,
	fillColor:     "#ff1493",
	fillOpacity:   0.02,
	clickable:     false,
	map:           map,
	center:        new google.maps.LatLng( stLat, stLng ),
	radius:        1000
    };
    var circle = new google.maps.Circle( circleOptions );

    var col = rValue == "WALKING" ? "'#FF66FF'" : "'#00FFFF'";
    var plo = new google.maps.Polyline( {
	strokeOpacity: 0.5,
	strokeWeight: 5,
	strokeColor: col
    });

    var directionsRenderer = new google.maps.DirectionsRenderer( {
	draggable: true,
	polylineOptions: plo
    } );
    directionsRenderer.setMap( map );
    directionsRenderer.setPanel( document.getElementById( "directionsPanel" ) );

    // var mode = { WALKING: google.maps.DirectionsTravelMode.WALKING,
    // 		 DRIVING: google.maps.DirectionsTravelMode.DRIVING }[ rValue ];
    var mode = rValue == "WALKING" ? google.maps.DirectionsTravelMode.WALKING :	google.maps.DirectionsTravelMode.DRIVING;
    var request = {
	origin:      new google.maps.LatLng( stLat, stLng ),
	destination: new google.maps.LatLng( edLat, edLng ),
	avoidHighways: true,	// true = 高速道路を除外する
	avoidTolls:    true,    // true = 有料区間を除外する
	travelMode:    mode
    };
    var directionsService = new google.maps.DirectionsService();
    directionsService.route( request, function( result, status ) {
	if ( status == google.maps.DirectionsStatus.OK ) {
	    directionsRenderer.setDirections( result );
	}});
}

// ＪＲ線・地下鉄
function makeMap( latlng, canvas ) {
    var myOptions = { zoom: 14,
		      center: latlng,
		      panControl: false,
		      scaleControl: true,
		      zoomControlOptions: { style: google.maps.ZoomControlStyle.SMALL },
		      mapTypeId: google.maps.MapTypeId.ROADMAP
		    };
    return new google.maps.Map( document.getElementById( canvas ), myOptions );
}

function makeMarker( latlng, image, map ) {
    var marker = new google.maps.Marker( {
	position: latlng,
	icon: new google.maps.MarkerImage( image ),
	map: map
    } );
};

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

function getNearStation ( lat, lng ) {
    // objStations ... 別ファイル [ id, name, lat, lng ]
    var result = objStations.map( function ( s ) {
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
    var wp = sel.options[ sel.selectedIndex ].value;
    var edLat = wp.split( "," )[3];
    var edLng = wp.split( "," )[4];
    var url = "https://maps.google.co.jp/mapfiles/ms/icons/";

    // TODO: makeMaker と makeCircle を makeMap に内蔵しちゃう。

    // left map
    var objLatLngFrom = new google.maps.LatLng( stLat, stLng );
    var leftMap = makeMap( objLatLngFrom, "left_station_map" );
    makeMarker( objLatLngFrom, url + "green-dot.png", leftMap );
    makeCircle( leftMap, objLatLngFrom );

    var nStations = getNearStations( stLat, stLng ); // [ id, name, lat, lng, dist ]
    for ( var i = 0; i < nStations.length; i++ ) {
	var objLatLngTo = new google.maps.LatLng( nStations[i][2], nStations[i][3] );
	var dist = google.maps.geometry.spherical.computeDistanceBetween( objLatLngFrom,
									  objLatLngTo );
	var marker = new google.maps.Marker( {
	    position: objLatLngTo,
	    icon: new google.maps.MarkerImage( "http://labs.google.com/ridefinder/images/mm_20_orange.png" ),
	    map: leftMap
	} );
	var str = "(" + ( i + 1 ) + ") " + nStations[i][1] + ": " + Math.floor( dist ) + "m";
	attachMessage( marker, str );
	google.maps.event.trigger( marker, "click" );
    }

    // right map
    var latlng = new google.maps.LatLng( edLat, edLng );
    var rightMap = makeMap( latlng, "right_station_map" );
    makeMarker( latlng, url + "red-dot.png", rightMap );
    makeCircle( rightMap, latlng );
}

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
