// -*- coding: utf-8 -*-
var geocoder;
var adpSummaryBorderColor;

// subroutines
function setInnerHTML ( domName, text ) {
    document.getElementById( domName ).innerHTML = text;
}

function clearGeocodeResult () {
    [ "faddr", "stLat", "stLng" ].forEach( function( elm ) {
	setInnerHTML( elm, "" );
    });
}

function cbPaste () {
    document.getElementById( "addr" ).value = clipboardData.getData( "text" );
    clearGeocodeResult();
    document.getElementById( "btnGeo" ).focus();
}

function removeAllChilds ( id ) {
    var dom = document.getElementById( id );
    while ( dom.firstChild ) {
	dom.removeChild( dom.firstChild );
    }
    return dom;
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

function getOptionText ( domId ) {
    var sel = document.getElementById( domId );
    return sel.options[ sel.selectedIndex ].text;
}

function removeOptions ( id ) {
    var sel = document.getElementById( id );
    while ( sel.options.length ) {
	sel.remove(0);
    }
    return sel;
}

function replaceZenkaku ( str ) {
    return str.replace( /[A-Za-z0-9]/g, function( s ) {
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
    return new google.maps.Map( removeAllChilds( canvas ), option );
}

function makeMarker( map, lat, lng, image ) {
    var marker = new google.maps.Marker(
	{ position: new google.maps.LatLng( lat, lng ),
	  icon: new google.maps.MarkerImage( image ),
	  map: map });
    return marker;
}

function attachMessage( marker, msg ) {
    google.maps.event.addListener( marker, 'click', function( event ) {
	new google.maps.InfoWindow( { content: msg } ).open( marker.getMap(), marker );
    });
}

function separate( num ) {
    return String( num ).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' );
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
    var stLat = document.getElementById( "stLat" ).innerText;
    var stLng = document.getElementById( "stLng" ).innerText;
    if( stLat == "" ) {
	alert( "出発地点が未入力です" );
	return false;
    }

    var wp = hot.getDataAtRow( hot.getSelected()[0] );
    if ( wp[3] == "" ) {
     	alert( "目的地が選択されていません" );
     	return false;
    }
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
		setInnerHTML( "faddr", results[0].formatted_address );
		var l = results[0].geometry.location;
		setInnerHTML( "stLat", l.lat() );
		setInnerHTML( "stLng", l.lng() );
	    } else {
		alert( "Google Geocoder Faild：" + status );
	    }});
    setBoundArea();
}

var columnHeader = [ '名称', '建物', '住所', 'lat', 'lng', '不便公署', '電話番号' ];
var hot = new Handsontable( document.getElementById( 'hot' ) ,
			    { data: [ [ '', '', '', '', '', '', '' ] ],
			      autoColumnSize: true,
			      colHeaders: columnHeader,
			      currentRowClassName: 'currentRow',
			      disableVisualSelection: 'area',
			      outsideClickDeselects: false,
			      readOnly: true,
			      rowHeaders: true,
			      stretchH: 'all',
			      minSpareRows: 10
			    }
			  );
hot.selectCell( 0, 0 );

function changeKyoku ( kyoku ) {
    var data = objWorkplace[ kyoku ].map( function( e ) {
	return e.split(",");
    });
    hot.updateSettings( { data: data,
			} );
    hot.selectCell( 0, 0 );
    document.getElementById( "kword" ).value = "";
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

    var data = result.map( function( e ) {
	return e.split(",");
    });
    hot.updateSettings( { data: data } );
    hot.selectCell( 0, 0 );
    document.getElementById( "hot" ).focus();
    return true;
}

function move () {
    var wp = hot.getDataAtRow( hot.getSelected()[0] );
    setInnerHTML( "faddr", wp[0] + " " + wp[1] );
    setInnerHTML( "stLat", wp[3] );
    setInnerHTML( "stLng", wp[4] );
}

// dom の更新を監視する
//   https://msdn.microsoft.com/ja-jp/library/dn265034(v=vs.85).aspx
function mutationObjectCallback( mutationRecordsList ) {
    var dom = document.getElementsByClassName( "adp-summary" )[0];
    if ( dom ) {
	dom.style.borderColor = adpSummaryBorderColor;	
	var km = [].filter.call( document.getElementsByTagName( 'span' ), function( n ) {
	    return ( n.textContent.match( / km/ ) );
	});
	document.getElementById( "distance" ).textContent =
	    ( document.getElementsByName( "walk" )[0].checked ? '徒歩' : '自動車' ) +
	    ": " + km[0].textContent;
    }
}

var observerObject = new MutationObserver( mutationObjectCallback );
observerObject.observe( document.getElementById( "directionsPanel" ), // target DOM
			{ // attributes: true,
			  // attributeFilter: ["id", "dir"],
			  // attributeOldValue: true,
			    childList: true
			});

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

    adpSummaryBorderColor = document.getElementsByName( "walk" )[0].checked ?
	'#FF66FF' :		// この関数 measure_distance() が終了したら
	'#00FFFF';		// mutationObjectCallback が発火する

    // ルート描画
    var directionsRenderer = new google.maps.DirectionsRenderer(
	{ draggable: true,
	  polylineOptions: { strokeOpacity: 0.5,
			     strokeWeight: 5,
			     strokeColor: adpSummaryBorderColor }});
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
    directionsService.route( request,
			     function( result, status ) {
				 if ( status == google.maps.DirectionsStatus.OK ) {
				     directionsRenderer.setDirections( result );
				 } else {
				     alert( "Google Directions Service Faild：" + status );
				 }
			     });
    directionsRenderer.setPanel( removeAllChilds( "directionsPanel" ) );
    drawBoundArea( map );
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

function dispNearStation () {
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }
    var stLat = latlng[0],
	stLng = latlng[1];

    document.getElementById( "jrdep" ).textContent = document.getElementById( "faddr" ).textContent;
    document.getElementById( "jrarr" ).textContent = latlng[4][0] + "　" + latlng[4][1];

    var map = makeMap( "jrsubway_map", stLat, stLng, { zoom: 14 } );
    dispNearStationSub ( map, stLat,     stLng,     "green" );
    dispNearStationSub ( map, latlng[2], latlng[3], "red" );
    drawBoundArea( map );
}

function dispNearStationSub ( map, lat, lng, color ) {
    makeMarker( map, lat, lng,
		"https://maps.google.co.jp/mapfiles/ms/icons/" + color + "-dot.png" );
    makeCircle( map, lat, lng );
    var from = new google.maps.LatLng( lat, lng );
    getNearStations( lat, lng ).forEach(
	function( e, idx, ary ) {
	    var marker = makeMarker( map, e["lat"], e["lng"], "http://labs.google.com/ridefinder/images/mm_20_" + color + ".png" );
    	    var dist = google.maps.geometry.spherical.computeDistanceBetween( from,
    		new google.maps.LatLng( e["lat"], e["lng"] ) );
    	    var str = "(" + ( idx + 1 ) + ") " +
		e["name"] + ": " +
		separate( Math.floor( dist ) ) + "m";
    	    attachMessage( marker, str );
    	    google.maps.event.trigger( marker, "click" );
	});
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
    var sel = removeOptions( "busStops" );
    getNearBusStop( lat, lng ).forEach( function( e ) {
	addOption( sel, e['id'], e['name'] );
    });
}

function searchNameBusStop () {
    var kword = document.getElementById( "busstopname" ).value;
    var result = Object.keys( objbusstops ).filter( function( id ) {
	return ( objbusstops[ id ].split( ",") [2].indexOf( kword ) > -1 )
    });
    var sel = removeOptions( "busStops" );
    result.forEach( function( id ) {
	addOption( sel, id, objbusstops[ id ].split( "," )[2] );
    });
}

function changeBusStop ( id ) {
    var sel = removeOptions( "busRoutes" );
    var aryCompany = Object.keys( objBusStopRoute ); 
    aryCompany.forEach( function ( c ) {
	var aryRoute = Object.keys( objBusStopRoute[ c ].route );
	aryRoute.forEach( function ( r ) {
	    if ( objBusStopRoute[ c ].route[ r ].data.indexOf( id ) > -1 ) {
		addOption( sel,
			   [ c, r ],
			   objBusStopRoute[ c ].route[ r ].name + "(" + objBusStopRoute[ c ].company + ")" );
	    }
	});
    });
}

function drawBusRoute ( map, route ) {
    var url = 'https://tkita.github.io/m5/data-kml/' + route.replace( ",", "" ) + '.kml';
    var kml = new google.maps.KmlLayer( url );
    kml.setMap( map );
}

function drawBusStops ( map, busRouteKey, image, advance ) {
    // バス路線に含まれるバス停を抽出
    key = busRouteKey.split( "," );
    var aryBusStop = objBusStopRoute[ key[0] ].route[ key[1] ].data;
    aryBusStop.forEach( function( e ) {
	var s = objbusstops[ e ].split( "," );
    	var marker = makeMarker( map, s[0] , s[1], image );
    	attachMessage( marker, s[2] );
	if ( e == advance ) {
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
    makeMarker( map, lat,       lng,       url + "green-dot.png" );
    makeCircle( map, lat, lng );
    makeMarker( map, latlng[2], latlng[3], url + "red-dot.png" );

    // バス停
    var url = "http://labs.google.com/ridefinder/images/";
    drawBusStops( map, busRouteKey, url + "mm_20_orange.png", getOptionValue( "busStops" ) );

    // バス路線
    drawBusRoute( map, busRouteKey )

    var sel = document.getElementById( "busRoutes" );
    drawControl( map, getOptionText( "busRoutes" ), false, "orange" );

    // 路線を固定
    busRouteKey = document.getElementById( "lock" ).value;
    if ( busRouteKey != "" ) {
	busRouteKey = busRouteKey.split( "," );
	busRouteKey = busRouteKey[1] + "," + busRouteKey[2];
	drawBusRoute( map, busRouteKey )
	drawBusStops( map, busRouteKey, url + "mm_20_green.png", false );
	drawControl( map, busRouteKey, google.maps.ControlPosition.BOTTOM_CENTER, "green" );
    }
}

function lock () {
    document.getElementById( "lock" ).value = getOptionText( "busRoutes" ) + "," + getOptionValue( "busRoutes" );
}

function unlock () {
    document.getElementById( "lock" ).value = "";
}

function setupShokuba () {
    var dom = document.getElementById( "kyoku" );
    Object.keys( objWorkplace ).forEach( function( e ) {
	addOption( dom, e, e );
    });
    dom.selectedIndex = 0;
}

function setupBoundCity () {
    var dom = document.getElementById( "boundCity" );
    objBound.map( function( e ) {
    	return e[1];
    }).filter( function( x, i, self ) {
        return self.indexOf( x ) === i;
    }).forEach( function( e ) {
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
    var sel = removeOptions( "boundAddr" );
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
	if ( event.ctrlKey && event.keyCode == 66 ) { // CTRL-b
	    event.keyCode = null;
	    document.getElementById( "link_bus" ).click();
	    document.getElementById( "btnBus" ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 68 ) { // CTRL-d
	    event.keyCode = null;
	    document.getElementById( "link_departure" ).click();
	    document.getElementById( "btnPaste" ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 70 ) { // CTRL-f
	    event.keyCode = null;
	    document.getElementById( "kword" ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 71 ) { // CTRL-g
	    event.keyCode = null;
	    document.getElementById( "btnGeo" ).click();
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
	} else if ( event.ctrlKey && event.keyCode == 84 ) { // CTRL-t
	    event.keyCode = null;
	    document.getElementById( "link_top" ).click();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 86 ) { // CTRL-v
	    event.keyCode = null;
	    document.getElementById( "link_departure" ).click();
	    document.getElementById( "addr" ).value = "";
	    cbPaste();
	    document.getElementById( "btnGeo" ).focus();
	    return false;
	}
    }
}
