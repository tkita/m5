// -*- coding: utf-8 -*-
var geocoder;

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

function getGeocode () {
    [ "faddr", "stLat", "stLng" ].forEach( function ( elm ) {
	document.getElementById( elm ).value = "";
    });

    var addr = document.getElementById("addr").value;
    geocoder.geocode( { address: addr },
		      function( results, status ) {
			  if ( status == google.maps.GeocoderStatus.OK ) {
			      // document.getElementById( "body" ).style.backgroundColor = "white";
			      // setTimeout( function () {
			      //   document.getElementById( "body" ).style.backgroundColor = "Gainsboro";
			      // }, 40);
			      document.getElementById( "faddr" ).innerHTML = results[0].formatted_address;
			      var l = results[0].geometry.location;
			      document.getElementById( "stLat" ).innerHTML = l.lat();
			      document.getElementById( "stLng" ).innerHTML = l.lng();
			  } else {
			      alert( 'Google Geocoder Faild：' + status );
			  }
		      } );
}

function mapInitialize () {
    geocoder = new google.maps.Geocoder();
    alert( "geocoder 準備完了" );
}

function loadGmapsAPI () {
    var script = document.createElement( "script" );
    var uri = "http://maps.google.com/maps/api/js?";
    var apikey = "AIzaSyC78j0reQqOofNHQxsINRTt21UgyVK1MTo";
    uri = uri + "key=" + apikey + "&sensor=true&libraries=geometry&callback=mapInitialize";
    script.type = "text/javascript";
    script.src = uri;
    document.body.appendChild( script );
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
    var dom = document.getElementById("shokuba");
    removeOptions( dom );
    var ary = objWorkplace[ kyoku ];
    ary.forEach( function ( e ) {
	addOptions( dom, e, arrangeText(e) );
    });
}

function setupShokuba () {
    var dom = document.getElementById( "kyoku" );
    var keys = Object.keys( objWorkplace );
    keys.forEach( function ( e ) {
	addOptions( dom, e, e );
    });
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
    var wp = sel.options[ sel.selectedIndex ].value;
    var edLat = wp.split(",")[3];
    var edLng = wp.split(",")[4];
//    alert( stLat + ", " + stLng + ", " + edLat + ", " + edLng );
    var myOptions = {
        zoom: 18,
        panControl: false,
        scaleControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map( document.getElementById( 'map_yougu' ), myOptions );

    var directionsRenderer = new google.maps.DirectionsRenderer( {
	draggable: true,
//	polylineOptions: plo
    } );
    directionsRenderer.setMap( map );
    var request = {
	origin:      new google.maps.LatLng( stLat, stLng ),
	destination: new google.maps.LatLng( edLat, edLng ),
	avoidHighways: true,	// true = 高速道路を除外する
	avoidTolls:    true,    // true = 有料区間を除外する
	travelMode: google.maps.DirectionsTravelMode.WALKING
    };
    var directionsService = new google.maps.DirectionsService();
    directionsService.route( request, function( result, status ) {
	if ( status == google.maps.DirectionsStatus.OK ) {
	    directionsRenderer.setDirections( result );
	} }
			   );



}

function init () {
    setupShokuba();
    geocoder = new google.maps.Geocoder();
//    loadGmapsAPI();
}
