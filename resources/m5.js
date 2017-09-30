// -*- coding: utf-8 -*-
var geocoder;
var adpSummaryBorderColor;

// subroutines
function setInnerHTML ( domName, text ) {
    document.getElementById( domName ).innerHTML = text;
}

function clearGeocodeResult () {
    [ 'faddr', 'stLat', 'stLng' ].forEach( function( elm ) {
	setInnerHTML( elm, '' );
    });
}

function cbPaste () {
    document.getElementById( 'addr' ).value = clipboardData.getData( 'text' );
    clearGeocodeResult();
    document.getElementById( 'btnGeo' ).focus();
}

function removeAllChilds ( id ) {
    var dom = document.getElementById( id );
    while ( dom.firstChild ) {
	dom.removeChild( dom.firstChild );
    }
    return dom;
}

function addOption ( sel, value, text ) {
    var opt = document.createElement( 'option' );
    opt.value = value;
    opt.text = text;
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
    var circleOptions = { strokeColor: 'green', // '#c71585',
			  strokeOpacity: 0.3,
			  strokeWeight: 3,
			  fillColor: '#ff1493',
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
    var coords = objBoundLine[ getOptionValue( 'boundAddr' ) ];
    if ( coords ) {
	var path = coords.split( ' ' ).map( function( e ) {
	    var c = e.split( ',' );
	    return { lat: Number( c[1] ),
		     lng: Number( c[0] ) }
	});
	drawPolyline( map, path, { strokeColor: 'cyan',
				   strokeOpacity: 0.8,
				   strokeWeight: 2 } );
    }
}

function drawControl ( map, str, pos, color ) {
    var container = document.createElement( 'div' );
    [ [ 'margin',     '10px' ],
      [ 'padding',    '5px'],
      [ 'border',     '1px solid #000' ],
      [ 'background', '#fff' ],
      [ 'color', color ],
      [ 'fontSize',   '14px' ] ].forEach( function( e ) {
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
    var stLat = document.getElementById( 'stLat' ).innerText;
    var stLng = document.getElementById( 'stLng' ).innerText;
    if ( stLat == '' ) {
	alert( '出発地点が未入力です' );
	return false;
    }

    var wp = hot.getDataAtRow( hot.getSelected()[0] );
    if ( wp[3] == '' ) {
     	alert( '目的地が選択されていません' );
     	return false;
    }
    var edLat = wp[3];
    var edLng = wp[4];
    return [ stLat, stLng, edLat, edLng, wp ];
}

function setBoundArea () {
    var mCity, mAddr;
    var addr = document.getElementById( 'addr' ).value;
    for ( var i = 1, max = objBound.length; i < max; i++ ) {
	var str = objBound[i][1] + objBound[i][2];
	if ( addr.indexOf( str ) > -1 ) {
	    mCity = objBound[i][1];
	    mAddr = objBound[i][2];
	    break;
	}}

    if ( mCity ) {
	var sel = document.getElementById( 'boundCity' );
	for ( var i = 0, max = sel.length; i < max; i++ ) {
	    if ( mCity == sel.options[i].value ) {
		sel.selectedIndex = i;
		changeCity( mCity );
		break;
	    }}
	var sel = document.getElementById( 'boundAddr' );
	for ( var i = 0, max = sel.length; i < max; i++ ) {
	    if ( mAddr == sel.options[i].text ) {
		sel.selectedIndex = i;
		break;
	    }}
    } else {
	document.getElementById( 'boundCity' ).selectedIndex = 0;
	changeCity( '---' );
    }
}

function getGeocode () {
    var addr = document.getElementById( 'addr' ).value;
    if ( addr == '' ) {
	alert( '住所欄が未入力です' );
	return;
    }
    addr = replaceZenkaku( addr );
    document.getElementById( 'addr' ).value = addr;
    clearGeocodeResult();
    geocoder.geocode(
	{ address: addr },
	function( results, status ) {
	    if ( status == google.maps.GeocoderStatus.OK ) {
		setInnerHTML( 'faddr', results[0].formatted_address );
		var l = results[0].geometry.location;
		setInnerHTML( 'stLat', l.lat() );
		setInnerHTML( 'stLng', l.lng() );
	    } else {
		alert( 'Google Geocoder Faild：' + status );
	    }});
    setBoundArea();
}

var hot = new Handsontable( document.getElementById( 'hot' ) ,
			    { data: [ [ '', '', '', '', '', '', '' ] ],
			      autoColumnSize: true,
			      colHeaders: columnHeader, // 別ファイルで定義
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
    var data = objWorkplace[ kyoku ].data.map( function( e ) {
	return e.split( ',' );
    });
    hot.updateSettings( { data: data,
			} );
    hot.selectCell( 0, 0 );
    document.getElementById( 'kword' ).value = '';
}

function doSearchShokuba ( keyCode ) {
    if ( keyCode === 13 ) {
	if ( searchShokuba() ) {
	    document.getElementById( 'shokuba' ).focus();
	} else {
	    document.getElementById( 'kword' ).focus();
	}}}

function searchShokuba () {
    var kword = document.getElementById( 'kword' ).value;
    if ( kword == '' ) {
	alert( 'キーワードが未入力です' );
	return false;
    }

    var result = [];
    Object.keys( objWorkplace ).forEach( function( key ) {
	objWorkplace[ key ].data.forEach( function( str ) {
	    if ( str.indexOf( kword ) > -1 ) {
		result.push( str );
	    }});
    });
    if ( result.length == 0 ) {
	alert( '該当なし' );
	return false;
    }

    var data = result.map( function( e ) {
	return e.split( ',' );
    });
    hot.updateSettings( { data: data } );
    hot.selectCell( 0, 0 );
    document.getElementById( 'hot' ).focus();
    return true;
}

function move () {
    var wp = hot.getDataAtRow( hot.getSelected()[0] );
    setInnerHTML( 'faddr', wp[0] + ' ' + wp[1] );
    setInnerHTML( 'stLat', wp[3] );
    setInnerHTML( 'stLng', wp[4] );
}

// dom の更新を監視する
//   https://msdn.microsoft.com/ja-jp/library/dn265034(v=vs.85).aspx
function mutationObjectCallback ( mutationRecordsList ) {
    var dom = document.getElementsByClassName( 'adp-summary' )[0];
    if ( dom ) {
	dom.style.borderColor = adpSummaryBorderColor;	
	var km = [].filter.call( document.getElementsByTagName( 'span' ),
                                 function( n ) {
	                             return ( n.textContent.match( / km/ ) );
	                         });
	document.getElementById( 'distance' ).textContent =
	    ( document.getElementsByName( 'walk' )[0].checked ? '徒歩' : '自動車' ) +
	    ': ' + km[0].textContent;
    }
}

var observerObject = new MutationObserver( mutationObjectCallback );
observerObject.observe( document.getElementById( 'directionsPanel' ), // target DOM
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
    var map = makeMap( 'yougu_map', stLat, stLng, { zoom: 18 } );

    // 地下鉄を強調表示
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( map );

    // 出発地点を半径１ｋｍの円で囲む
    makeCircle( map, stLat, stLng );

    adpSummaryBorderColor = document.getElementsByName( 'walk' )[0].checked ?
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
				     alert( 'Google Directions Service Faild：' + status );
				 }
			     });
    directionsRenderer.setPanel( removeAllChilds( 'directionsPanel' ) );
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

    document.getElementById( 'jrdep' ).textContent = document.getElementById( 'faddr' ).textContent;
    document.getElementById( 'jrarr' ).textContent = latlng[4][0] + '　' + latlng[4][1];

    var map = makeMap( 'jrsubway_map', stLat, stLng, { zoom: 14 } );
    dispNearStationSub ( map, stLat,     stLng,     'green' );
    dispNearStationSub ( map, latlng[2], latlng[3], 'red' );
    drawBoundArea( map );
}

function dispNearStationSub ( map, lat, lng, color ) {
    makeMarker( map, lat, lng,
		'https://maps.google.co.jp/mapfiles/ms/icons/' + color + '-dot.png' );
    makeCircle( map, lat, lng );
    var from = new google.maps.LatLng( lat, lng );
    getNearStations( lat, lng ).forEach(
	function( e, idx, ary ) {
	    var marker = makeMarker( map, e['lat'], e['lng'], 'https://tkita.github.io/m5/resources/mm_20_' + color + '.png' );
    	    var dist = google.maps.geometry.spherical.computeDistanceBetween( from,
    		new google.maps.LatLng( e['lat'], e['lng'] ) );
    	    var str = '(' + ( idx + 1 ) + ') ' +
		e['name'] + ': ' +
		separate( Math.floor( dist ) ) + 'm';
    	    attachMessage( marker, str );
    	    google.maps.event.trigger( marker, 'click' );
	});
}

function getNearBusStop ( lat, lng ) {
     var result = Object.keys( objbusstops ).
	map( function( key ) {
	    var v = objbusstops[ key ].split( ',' );
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
    if ( document.getElementsByName( 'busAround' )[0].checked ) {
	lat = latlng[0];
	lng = latlng[1];
    } else {
	lat = latlng[2];
	lng = latlng[3];
    }
    var sel = removeOptions( 'busStops' );
    getNearBusStop( lat, lng ).forEach( function( e ) {
	addOption( sel, e['id'], e['name'] );
    });
}

function searchNameBusStop () {
    var kword = document.getElementById( 'busstopname' ).value;
    var result = Object.keys( objbusstops ).filter( function( id ) {
	return ( objbusstops[ id ].split( ',' ) [2].indexOf( kword ) > -1 )
    });
    var sel = removeOptions( 'busStops' );
    result.forEach( function( id ) {
	addOption( sel, id, objbusstops[ id ].split( ',' )[2] );
    });
}

function changeBusStop ( id ) {
    var sel = removeOptions( 'busRoutes' );
    var aryCompany = Object.keys( objBusStopRoute ); 
    aryCompany.forEach( function ( c ) {
	var aryRoute = Object.keys( objBusStopRoute[ c ].route );
	aryRoute.forEach( function ( r ) {
	    if ( objBusStopRoute[ c ].route[ r ].data.indexOf( id ) > -1 ) {
		addOption( sel,
			   [ c, r ],
			   objBusStopRoute[ c ].route[ r ].name + '(' + objBusStopRoute[ c ].company + ')' );
	    }
	});
    });
}

function drawBusRoute ( map, route ) {
    var url = 'https://tkita.github.io/m5/data-kml/' + route.replace( ',', '' ) + '.kml';
    var kml = new google.maps.KmlLayer( url );
    kml.setMap( map );
}

function drawBusStops ( map, busRouteKey, image, advance ) {
    // バス路線に含まれるバス停を抽出
    key = busRouteKey.split( ',' );
    var aryBusStop = objBusStopRoute[ key[0] ].route[ key[1] ].data;
    aryBusStop.forEach( function( e ) {
	var s = objbusstops[ e ].split( ',' );
    	var marker = makeMarker( map, s[0] , s[1], image );
    	attachMessage( marker, s[2] );
	if ( e == advance ) {
	    google.maps.event.trigger( marker, 'click' );
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

    var map = makeMap( 'bus_map', lat, lng, { zoom: 14 } );
    drawBoundArea( map );
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( map );

    var url = 'https://maps.google.co.jp/mapfiles/ms/icons/';
    makeMarker( map, lat,       lng,       url + 'green-dot.png' );
    makeCircle( map, lat, lng );
    makeMarker( map, latlng[2], latlng[3], url + 'red-dot.png' );

    // バス停
    var url = 'https://tkita.github.io/m5/resources/';
    drawBusStops( map, busRouteKey, url + 'mm_20_orange.png', getOptionValue( 'busStops' ) );

    // バス路線
    drawBusRoute( map, busRouteKey )

    var sel = document.getElementById( 'busRoutes' );
    drawControl( map, getOptionText( 'busRoutes' ), false, 'orange' );

    // 路線を固定
    busRouteKey = document.getElementById( 'lock' ).value;
    if ( busRouteKey != '' ) {
	busRouteKey = busRouteKey.split( ',' );
	busRouteKey = busRouteKey[1] + ',' + busRouteKey[2];
	drawBusRoute( map, busRouteKey )
	drawBusStops( map, busRouteKey, url + 'mm_20_green.png', false );
	drawControl( map, busRouteKey, google.maps.ControlPosition.BOTTOM_CENTER, 'green' );
    }
}

function lock () {
    document.getElementById( 'lock' ).value = getOptionText( 'busRoutes' ) + ',' + getOptionValue( 'busRoutes' );
}

function unlock () {
    document.getElementById( 'lock' ).value = '';
}

function setupShokuba () {
    var dom = document.getElementById( 'kyoku' );
    Object.keys( objWorkplace ).forEach( function( e ) {
	addOption( dom, e, objWorkplace[e].name );
    });
    dom.selectedIndex = 0;
    changeKyoku( getOptionValue('kyoku') );
}

function setupBoundCity () {
    var dom = document.getElementById( 'boundCity' );
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
    var sel = removeOptions( 'boundAddr' );
    addr.forEach( function( e ) {
	addOption( sel, e[0], e[2] );
    });
}

function init () {
    setupShokuba();
    setupBoundCity();
    changeCity( getOptionValue( 'boundCity' ) );
    geocoder = new google.maps.Geocoder();

    document.onkeydown = function() {
	if ( event.ctrlKey && event.keyCode == 66 ) { // CTRL-b
	    event.keyCode = null;
	    document.getElementById( 'link_bus' ).click();
	    document.getElementById( 'btnBus' ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 68 ) { // CTRL-d
	    event.keyCode = null;
	    document.getElementById( 'link_departure' ).click();
	    document.getElementById( 'btnPaste' ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 70 ) { // CTRL-f
	    event.keyCode = null;
	    document.getElementById( 'kword' ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 71 ) { // CTRL-g
	    event.keyCode = null;
	    document.getElementById( 'btnGeo' ).click();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 82 ) { // CTRL-r
	    event.keyCode = null;
	    document.getElementById( 'link_yougu' ).click();
	    document.getElementById( 'btnDist' ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 83 ) { // CTRL-s
	    event.keyCode = null;
	    document.getElementById( 'link_jrsubway' ).click();
	    document.getElementById( 'btnJrSubway' ).focus();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 84 ) { // CTRL-t
	    event.keyCode = null;
	    document.getElementById( 'link_top' ).click();
	    return false;
	} else if ( event.ctrlKey && event.keyCode == 86 ) { // CTRL-v
	    event.keyCode = null;
	    document.getElementById( 'link_departure' ).click();
	    document.getElementById( 'addr' ).value = '';
	    cbPaste();
	    document.getElementById( 'btnGeo' ).focus();
	    return false;
	}
    }
}

function getNearTouhyou ( stLat, stLng ) {
    var fromLatLng = new google.maps.LatLng( stLat, stLng );
    var result = objWorkplace[ getOptionValue('kyoku') ].data.map(
	function( s ) {
            var e = s.split( ',' );
	    return { id:   e[0],
		     name: e[1],
		     lat:  e[3],
		     lng:  e[4],
		     dist: google.maps.geometry.spherical.computeDistanceBetween(
                         fromLatLng, new google.maps.LatLng( e[3], e[4] ) )
                   };
	});
    return result.sort( function( a, b ) {
	if ( a.dist < b.dist ) return -1;
	if ( a.dist > b.dist ) return 1;
	return 0;
    });
}

function drawTouhyouMarker ( map, ary, color, tooltip ) {
    ary.forEach( function( e, idx, ary ) {
        var marker = makeMarker( map, e['lat'], e['lng'],
                                 'https://maps.google.co.jp/mapfiles/ms/icons/' + color + '.png' );
        attachMessage( marker, '(' + e['id'] + ') ' + e['name'] + '<br>' +
                       separate( Math.floor( e['dist'] ) ) + 'm' );
        if ( tooltip ) {
            google.maps.event.trigger( marker, 'click' );
        }
    });
}

function dispNearTouhyou () {
    var stLat = document.getElementById( 'stLat' ).innerText;
    var stLng = document.getElementById( 'stLng' ).innerText;
    if ( stLat == '' ) {
	alert( '自宅・出発地点が未入力です' );
	return false;
    }
    var map = makeMap( 'touhyou_map', stLat, stLng, { zoom: 14 } );
    drawBoundArea( map );

    var path = objKuBorder[ getOptionValue('kyoku') ].split( ' ' ).map( function( e ) {
	var c = e.split( ',' );
	return { lat: Number( c[1] ),
		 lng: Number( c[0] ) }
    });
    drawPolyline( map, path, { strokeColor: 'red',
			       strokeOpacity: 0.5,
			       strokeWeight: 2 } );

    makeMarker( map, stLat, stLng, 'https://maps.google.co.jp/mapfiles/ms/icons/green-dot.png' );

    var nearTouhyou = getNearTouhyou( stLat, stLng );
    drawTouhyouMarker( map, nearTouhyou.slice( 0, 5 ), 'red', true );
    drawTouhyouMarker( map, nearTouhyou.slice( 5    ), 'purple', false );
}

// ekibus
var company_name = { 34: 'ＪＲバス',
		     42: 'じょうてつバス',
		     54: '中央バス',
		     64: 'ばんけいバス',
		     91: 'ＪＲ鉄道',
		     92: '地下鉄',
		     93: '市電',
		     100: 'ランドマーク'
	           }

function format () {
    var args = Array.prototype.slice.call( arguments, 0 );
    var str = args.shift();
    args.forEach( function(e) {
	str = str.replace( '$$$', e );
    });
    return str;
}

function getRoutePrediction ( word, id ) {
    var param = {};
    param['kind']        = 0;
    param['search_flg']  = 1;
    param['search_word'] = word;
    param['pos_flg']     = 0;
    param['company_id']  = '';
    param['lang']        = '';

    $.ajax( { url: 'https://ekibus-api.city.sapporo.jp/get_route_prediction',
	      type: 'POST',
	      data: param,
	      dataType: 'text' }
          ).done( function( res, status, xhr ) {
	      var obj = JSON.parse( res );
	      if ( obj.result == 0 ) {
	          var dom = removeOptions( id );
	          obj.route_prediction.forEach( function(e) {
                      var str = format( '($$$)$$$ - $$$',
                                        e.company_id, company_name[ e.company_id ], e.name );
		      addOption( dom, e.station_id, str ); // dom, value, text
	          });
	      }
          });
}

function ebChangeWord ( id ) {
    getRoutePrediction( document.getElementById( 'word_' + id ).value, id );
}

function getSearchResult () {
    var start_st = document.getElementById( 'ebDep' ).value;
    var end_st = document.getElementById( 'ebArr' ).value;
    if ( ( start_st == '' ) || ( end_st == '' ) ) {
	alert( '未選択' );
	return ;
    }
    removeAllChilds( 'result' );
    removeAllChilds( 'timetable' );

    var param = {};
    param['kind']               = 0;
    param['start_st']           = start_st;
    param['end_st']             = end_st;
    param['bus_prediction_flg'] = 0;
    param['departure_flg']      = 0;
    param['sort_id']            = 2;
    param['before_after_count'] = 0;
    param['start_datetime']     = '';
    param['lang']               = '';

    $.ajax( { url: 'https://ekibus-api.city.sapporo.jp/get_search_result',
	      type: 'POST',
	      data: param,
	      dataType: 'text' }
    ).done( function( res, status, xhr ) {
	var obj = JSON.parse( res );
	drawTable( obj.search_result.route );
    });
}

function drawTable ( ary ) {
    var result = document.getElementById( 'result' );
    var tbl = document.createElement( 'table' );

    var thead = document.createElement( 'thead' );
    [ '片道金額', '所要時間', '経路' ].forEach( function(e) {
	var th = document.createElement( 'th' );
	th.appendChild( document.createTextNode( e ) );
	thead.appendChild( th );
    });
    tbl.appendChild( thead );

    ary.forEach( function(e) {
	var tr = document.createElement( 'tr' );

	// 片道金額
	var td = document.createElement( 'td' );
	td.appendChild( document.createTextNode( e.fare + ' 円' )  );
	td.setAttribute( 'align', 'right' );
	tr.appendChild( td );

	// 所要時間
	var td = document.createElement( 'td' );
	td.appendChild( document.createTextNode( e.total_time + ' 分' )  );
	td.setAttribute( 'align', 'right' );
	tr.appendChild( td );

	// 経路
	var td = document.createElement( 'td' );
	var ul = document.createElement( 'ul' );
	e.route_list.forEach( function(r) {
	    var li = document.createElement( 'li' );

	    var connect = r.connect_flag == 1 ? '（乗継） ' : ' - ';
	    var fare = document.createTextNode( format( '$$$ 円$$$', r.fare, connect ) );
	    var from_name = document.createElement( 'span' );
	    from_name.setAttribute( 'class', 'station' );
	    from_name.appendChild( document.createTextNode( r.from_name ) );

	    var line_name = document.createElement( 'span' );
	    var fn = format( 'getTimeTable("$$$", "$$$", "$$$", "$$$");',
			     r.from_id, r.from_name, r.to_id, r.to_name) ;
	    line_name.setAttribute( 'class', 'linename' );
	    line_name.setAttribute( 'onClick', fn );
	    line_name.appendChild( document.createTextNode( r.line_name ) );

	    var to_name = document.createElement( 'span' );
	    to_name.setAttribute( 'class', 'station' );
	    to_name.appendChild( document.createTextNode( r.to_name ) );

	    li.appendChild( fare );
	    li.appendChild( from_name );
	    li.appendChild( document.createTextNode( ' → ' ) );
	    li.appendChild( line_name );
	    li.appendChild( document.createTextNode( ' → ' ) );
	    li.appendChild( to_name );
	    ul.appendChild( li );
	});
	td.appendChild( ul );
	tr.appendChild( td );

	tbl.appendChild( tr );
    });
    result.appendChild( tbl );
}

function getTimeTable ( from_id, from_name, to_id, to_name ) {
    removeAllChilds( 'timetable' );
    var param = {};
    param['kind']     = 0;
    param['start_st'] = from_id;
    param['end_st']   = to_id;
    param['lang']     = '';

    $.ajax( { url: 'https://ekibus-api.city.sapporo.jp/get_time_table',
	      type: 'POST',
	      data: param,
	      dataType: 'text' }
          ).done( function( res, status, xhr ) {
	      var obj = JSON.parse( res );
	      dispTimeTable( obj, from_id, from_name, to_id, to_name );
	  });
}

function dispTimeTable ( obj, from_id, from_name, to_id, to_name ) {
    var objTimeTable = obj.time_table[0]; // dia_flg = 1
    var aryHeader = objTimeTable.header_table;
    var company = objTimeTable.company_name;
    var aryTimes = objTimeTable.times;

    var dl = document.createElement( 'dl' );
    aryHeader.forEach( function(e) {
	var dt = document.createElement( 'dt' );
	dt.appendChild( document.createTextNode( format( '$$$＠$$$',
							 e.line_name,
							 company ) ) );
	dl.appendChild( dt );

	var dd = document.createElement( 'dd' );
	var course = document.createElement( 'span' );
	course.appendChild(
	    document.createTextNode( format( ' line_id:$$$ ', e.line_id ) ) );
	course.setAttribute( 'class', 'linename' );
	var fn = format( 'showLine("$$$", "$$$", "$$$");', e.line_id, from_id, to_id );
	course.setAttribute( 'onClick', fn );
	dd.appendChild( course );
	dd.appendChild( document.createTextNode( e.course_name ) );
	dl.appendChild( dd );

	var tt = '';
	aryTimes.filter( function(t) {
	    return ( t.course_id == e.course_id )
	}).forEach( function(e) {
	    tt = tt + e.time + ' / ';
	});
	var dd = document.createElement( 'dd' );
	dd.appendChild( document.createTextNode( tt ) );
	dl.appendChild( dd );

	var dd = document.createElement( 'dd' );
	dd.setAttribute( 'id', e.line_id );
	dl.appendChild( dd );
    });

    var timetable = document.getElementById( 'timetable' );
    timetable.appendChild( document.createTextNode( format( '【時刻表】$$$ → $$$',
							    from_name,
							    to_name ) ) );
    timetable.appendChild( dl );
}

function showLine ( line_id, from_id, to_id ) {
    var param = {};
    param['kind']    = 0;
    param['line_id'] = line_id;
    param['lang']    = '';

    var obj = JSON.parse(
	$.ajax( { url: 'https://ekibus-api.city.sapporo.jp/get_route_station',
		  type: 'POST',
		  data: param,
		  dataType: 'text',
		  async: false      // デフォルトは非同期
		} ).responseText );

    var center = obj.route_station[0].station_list.filter( function(s) {
	return ( s.station_id == from_id );
    });
    var dom = removeAllChilds( line_id );
    dom.style.height = '300px';
    var map = new google.maps.Map( dom,
				   { center: { lat: Number( center[0].lat ),
					       lng: Number( center[0].lon ) },
				     zoom: 13 } );

    obj.route_station.forEach( function( route ) {
	var path = route.station_list.map( function(r) {
	    return { lat: Number( r.lat ),
		     lng: Number( r.lon ) }
	});
	var polyline = new google.maps.Polyline( { strokeColor: 'cyan',
						   strokeOpacity: 0.8,
						   strokeWeight: 2,
						   path: path } );
	polyline.setMap( map );

	route.station_list.forEach( function(s) {
	    var marker = new google.maps.Marker(
		{ position: { lat: Number( s.lat ),
			      lng: Number( s.lon ) },
		  icon: 'https://tkita.github.io/m5/resources/mm_20_orange.png',
		  map: map });
	    google.maps.event.addListener( marker, 'click', function( event ) {
		new google.maps.InfoWindow( { content: s.name } )
		    .open( marker.getMap(), marker );
	    });
	    if ( s.station_id == from_id ) {
		google.maps.event.trigger( marker, 'click' );
	    }
	});
    });
}
