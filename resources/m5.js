// -*- coding: utf-8 -*-
var geocoder;
var adpSummaryBorderColor;
var current;
var currentMapObj = {};

var URL_GOOGLE_ICONS = 'https://maps.google.co.jp/mapfiles/ms/icons/';
var URL_EKIBUS_API = 'https://ekibus-api.city.sapporo.jp/';
var URL_TKITA_GITHUB = 'https://tkita.github.io/m5/';

// subroutines
function format () {
    var args = Array.prototype.slice.call( arguments, 0 );
    var str = args.shift();
    args.forEach( function(e) {
	str = str.replace( '$$$', e );
    });
    return str;
}

function fmtNumber( num ) {
    return String( num ).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' );
}

function setInnerHTML ( domId, text ) {
    document.getElementById( domId ).innerHTML = text;
}

function clearGeocodeResult () {
    [ 'faddr', 'stLat', 'stLng' ].forEach( function( id ) {
	setInnerHTML( id, '' );
    });
}

function clearTextContent ( id ) {
    document.getElementById( id ).textContent = '';
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
      [ 'mapTypeId' , google.maps.MapTypeId.ROADMAP ]
    ].forEach( function( e ) {
	  option[ e[0] ] = e[1];
      });
    return new google.maps.Map( removeAllChilds( canvas ), option );
}

function makeMarker( map, lat, lng, image, opt_msg ) {
    var marker = new google.maps.Marker(
	{ map: map,
          position: new google.maps.LatLng( lat, lng ),
	  icon: new google.maps.MarkerImage( image )
        } );
    if ( opt_msg ) {
        google.maps.event.addListener( marker, 'click',
                                       function( event ) {
	                                   new google.maps.InfoWindow( { content: opt_msg } ).
                                               open( marker.getMap(), marker );
                                       });
    }
    return marker;
}

function makeCircle( map, lat, lng ) {
    var options = { strokeColor: 'green', // '#c71585',
		    strokeOpacity: 0.3,
		    strokeWeight: 3,
		    fillColor: '#ff1493',
		    fillOpacity: 0,
		    clickable: false,
		    map: map,
		    center: new google.maps.LatLng( lat, lng ),
		    radius: 1000   // 半径 1000 m
		  };
    return new google.maps.Circle( options );
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
	drawPolyline( map, path, { strokeColor: 'blue',
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
      [ 'fontSize',   '14px' ]
    ].forEach( function( e ) {
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
    return [ stLat, stLng, wp[3], wp[4], wp ];
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

function doWebSearch () {
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }

    var url = format( 'https://www.google.co.jp/maps/dir/?api=1&origin=$$$,$$$&destination=$$$,$$$&travelmode=transit',
		      latlng[0], latlng[1], latlng[2], latlng[3] );
    window.open( url, '_blank' );
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

    // キーワードが全角数字のみで構成されていれば、半角へ変換する
    if ( kword.match( /[０-９]/g ) ) {
        kword = kword.replace( /[０-９]/g, function( s ) {
	    return String.fromCharCode( s.charCodeAt( 0 ) - 0xFEE0 );
        });
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
    var dom = document.getElementsByClassName( 'adp-summary' );
    if ( dom[0] ) {
        [].forEach.call( dom, function(e) {
            e.style.borderColor = adpSummaryBorderColor;
        });

        $(function () {
            $( '.adp-summary' ).next().hide();
            $( '.adp-summary' ).click( function() {
                if ( $( this ).next().is( ':hidden' ) ) {
                    $( this ).next().slideDown();
                } else {
                    $( this ).next().slideUp();
                }
            });
        });

	// var span = [].filter.call( document.getElementsByTagName( 'span' ),
        //                          function( n ) {
	//                              return ( n.textContent.match( / km/ ) );
	//                          });
	var span = [].filter.call( document.getElementsByClassName( 'adp-summary' ),
                                 function( n ) {
	                             return ( n.firstChild.textContent.match( / km/ ) );
	                         });
        var km = 0.0;
        span.forEach( function(e) {
            var k = Number( e.textContent.replace( ' km', '' ) );
            console.info( k );
            km = km + k;
        });

	// document.getElementById( 'distance' ).textContent =
	//     ( document.getElementsByName( 'walk' )[0].checked ? '徒歩' : '自動車' ) +
	//     ': ' + km + ' km';
    }
}

var observerObject = new MutationObserver( mutationObjectCallback );
observerObject.observe( document.getElementById( 'directionsPanel' ), // target DOM
			{ // attributes: true,
			  // attributeFilter: ["id", "dir"],
			  // attributeOldValue: true,
			    childList: true
			});

function getWaypoints () {
    var ary = [];
    var txt = document.getElementById( 'waypoints' ).textContent;
    if ( txt != '' ) {
        ary = txt.slice( 0, -1 ).split(' ').map( function(e) {
            var coords = e.split(',');
            return { location: new google.maps.LatLng( coords[0], coords[1] ) };
        });
    }
    return ary;
}

var routeMap;
function measure_distance () {
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }
    var originLat = latlng[0];
    var originLng = latlng[1];

    // 1.0 <- 地面から遠ざかる <- zoom -> 地面に近づく -> 21.0
    routeMap = makeMap( 'yougu_map', originLat, originLng, { zoom: 18,
                                                           gestureHandling: 'greedy' } );
    currentMapObj[ 'yougu' ] = routeMap;

    google.maps.event.clearListeners( routeMap, 'rightclick' );
    routeMap.addListener( 'rightclick', function( arg ) {
        var element = document.getElementById( 'waypoints' );
        element.textContent = element.textContent +
            format( '$$$,$$$ ', arg.latLng.lat, arg.latLng.lng );
        measure_distance();
    });

    // 地下鉄を強調表示
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( routeMap );

    // 出発地点を半径１ｋｍの円で囲む
    makeCircle( routeMap, originLat, originLng );

    adpSummaryBorderColor = document.getElementsByName( 'walk' )[0].checked ?
	'#FF66FF' :		// この関数 measure_distance() が終了したら
	'#00FFFF';		// mutationObjectCallback が発火する

    // ルート描画
    var directionsRenderer = new google.maps.DirectionsRenderer(
	{ draggable: false,
	  polylineOptions: { strokeOpacity: 0.5,
			     strokeWeight: 5,
			     strokeColor: adpSummaryBorderColor }
        });
    directionsRenderer.setMap( routeMap );

    var tMode = document.getElementsByName( 'walk' )[0].checked ?
	google.maps.DirectionsTravelMode.WALKING :
	google.maps.DirectionsTravelMode.DRIVING;
    var keiyu = getWaypoints();
    var userPoint = document.getElementById( 'userPoint' ).textContent;
    if ( userPoint != '' ) {
        latlng[2] = userPoint.split(',')[0];
        latlng[3] = userPoint.split(',')[1];
    }
    var request = { origin: new google.maps.LatLng( originLat, originLng ),
                    destination: new google.maps.LatLng( latlng[2], latlng[3] ),
                    waypoints: keiyu,           // 経由地点
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
    drawBoundArea( routeMap );

    routeMap.controls[ google.maps.ControlPosition.TOP_LEFT ].push( styleControler );
    routeMap.setOptions( { styles: styles[ 'hide' ] } );    // 初期動作

    document.getElementById( 'link_yougu' ).click();
}

function changeStylePoi ( key ) {
    routeMap.setOptions( { styles: styles[ key ] } );
}

// http://phpjavascriptroom.com/?t=ajax&p=googlemapsapiv3_styling#a_maptypestylefeaturetype
// featureType: 'administrative.land_parcel' ... 土地区画
//              'landscape'                  ... 景観
//              'poi'                        ... 誰かが興味をもった場所. Points of Interest
//              'road'                       ... 道路

// elementType: 'all'      ... 'geometry' & 'labels'
//              'geometry' ... その対象物 (featureType) の幾何学要素
//              'labels'   ... その対象物に関連付けられたテキストラベル

var styleControler = document.getElementById( 'style-selector-control' );
var visibility_off = [ {visibility: 'off' } ];
var styles = { default: null,
               hide: [
                   { featureType: 'poi.attraction',            // 観光スポット
                     stylers: visibility_off },
                   { featureType: 'poi.business',
                     stylers: visibility_off },
                   { featureType: 'poi.medical',
                     stylers: visibility_off },
                   { featureType: 'poi.place_of_worship',      // 教会、寺院
                     stylers: visibility_off },
                   { featureType: 'poi.sports_complex',        // スポーツ施設
                     stylers: visibility_off },

                   { featureType: 'poi.park',
                     elementType: 'labels',
                     stylers: visibility_off },

//                 { featureType: 'transit',
//                   elementType: 'labels.icon',
//                   stylers: [ {visibility: 'off' } ] }
               ]
             };

function clearWaypoints () {
    clearTextContent( 'waypoints' );
    measure_distance();
}

// ＪＲ線・地下鉄
function getNearStations ( lat, lng ) {
    // objStations ... 別ファイル [ id, name, lat, lng ]
    var result = objStations.map(
	function( s ) {
	    return { id:   s[0],
		     name: s[1],
		     lat:  s[2],
		     lng:  s[3],
		     dist: google.maps.geometry.spherical.computeDistanceBetween(
                         new google.maps.LatLng( lat, lng ),
                         new google.maps.LatLng( s[2], s[3] ) )
                   };
	});

    result.sort( function( a, b ) {
	if ( a.dist < b.dist ) return -1;
	if ( a.dist > b.dist ) return 1;
	return 0;
    });

    return result.slice( 0, 5 ); // 上位５つ
}

// btnJrSubway
function dispNearStation () {
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }

    // 1.0 <- 地面から遠ざかる <- zoom -> 地面に近づく -> 21.0
    var map = makeMap( 'jrsubway_map', latlng[0], latlng[1], { zoom: 12,
                                                               gestureHandling: 'greedy' } );
    currentMapObj[ 'jrsubway' ] = map;

    // 出発地
    document.getElementById( 'jrdep' ).textContent =
        document.getElementById( 'faddr' ).textContent;
    var st = dispNearStationSub( map, latlng[0], latlng[1], 'green' );
    document.getElementById( 'jrdepstation' ).textContent = st[0].name;
    var txt = st[0].name + '@';

    // 目的地
    var userPoint = document.getElementById( 'userPoint' ).textContent;
    if ( userPoint == '' ) {
        document.getElementById( 'jrarr' ).textContent = latlng[4][0] + '　' + latlng[4][1];
    } else {
        latlng[2] = userPoint.split(',')[0];
        latlng[3] = userPoint.split(',')[1];
        document.getElementById( 'jrarr' ).textContent = '任意地点';
    }
    var st = dispNearStationSub( map, latlng[2], latlng[3], 'red' );
    document.getElementById( 'jrarrstation' ).textContent = st[0].name;
    window.clipboardData.setData( 'Text', txt + st[0].name );

    drawBoundArea( map );
}

function dispNearStationSub ( map, lat, lng, color ) {
    makeMarker( map, lat, lng, format( URL_GOOGLE_ICONS + '$$$-dot.png', color) );
    makeCircle( map, lat, lng );
    var stations = getNearStations( lat, lng );
    stations.forEach(
	function( e, idx, ary ) {
	    var marker = makeMarker( map, e['lat'], e['lng'],
                                     format( '$$$resources/mm_20_$$$.png', URL_TKITA_GITHUB, color ),
                                     format( '($$$) $$$: $$$m',
                                             ( idx + 1 ),
                                             e['name'],
                                             fmtNumber( Math.floor( e['dist'] ) ) )
                                   );
            if ( idx == 0 ) {
                google.maps.event.trigger( marker, 'click' );
            }
	});
    return stations;
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

// btnBus
function searchNearBusStop () {
    var lat, lng;
    var latlng = checkInData();
    if ( !latlng ) {
	return false;
    }
    var userPoint = document.getElementById( 'userPoint' ).textContent;
    if ( document.getElementsByName( 'busAround' )[0].checked ) {
	lat = latlng[0];
	lng = latlng[1];
    } else if ( userPoint == '' ) {
	lat = latlng[2];
	lng = latlng[3];
    } else {
	lat = userPoint.split(',')[0];
	lng = userPoint.split(',')[1];
    }
    var sel = removeOptions( 'busStops' );
    getNearBusStop( lat, lng ).forEach( function( e ) {
	addOption( sel, e['id'], e['name'] );
    });
}

// 名称でバス停検索
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
		addOption( sel, [ c, r ],
                           format( '$$$($$$)',
                                   objBusStopRoute[ c ].route[ r ].name,
                                   objBusStopRoute[ c ].company) );
	    }
	});
    });
}

function drawBusRoute ( map, route ) {
    var url = format( '$$$data-kml/$$$.kml', URL_TKITA_GITHUB, route.replace( ',', '' ) );
    var kml = new google.maps.KmlLayer( url );
    kml.setMap( map );
}

function drawBusStops ( map, busRouteKey, image, advance ) {
    // バス路線に含まれるバス停を抽出
    key = busRouteKey.split( ',' );
    var aryBusStop = objBusStopRoute[ key[0] ].route[ key[1] ].data;
    aryBusStop.forEach( function( e ) {
	var s = objbusstops[ e ].split( ',' );
    	var marker = makeMarker( map, s[0], s[1], image, s[2] );
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
    var originLat = latlng[0];
    var originLng = latlng[1];

    // 1.0 <- 地面から遠ざかる <- zoom -> 地面に近づく -> 21.0
    var map = makeMap( 'bus_map', originLat, originLng, { zoom: 14,
                                                          gestureHandling: 'greedy' } );
    currentMapObj[ 'bus' ] = map;

    drawBoundArea( map );
    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap( map );

    // 出発
    makeMarker( map, originLat, originLng, URL_GOOGLE_ICONS + 'green-dot.png' );
    makeCircle( map, originLat, originLng );

    // 目的
    var userPoint = document.getElementById( 'userPoint' ).textContent;
    if ( userPoint != '' ) {
        latlng[2] = userPoint.split(',')[0];
        latlng[3] = userPoint.split(',')[1];
    }
    makeMarker( map, latlng[2], latlng[3], URL_GOOGLE_ICONS + 'red-dot.png' );

    // バス停
    drawBusStops( map, busRouteKey,
                  URL_TKITA_GITHUB + 'resources/mm_20_orange.png',
                  getOptionValue( 'busStops' ) );

    // バス路線
    drawBusRoute( map, busRouteKey )

    var sel = document.getElementById( 'busRoutes' );
    drawControl( map, getOptionText( 'busRoutes' ), false, 'black' );

    // 路線を固定
    busRouteKey = document.getElementById( 'lock' ).value;
    if ( busRouteKey != '' ) {
	busRouteKey = busRouteKey.split( ',' );
	busRouteKey = busRouteKey[1] + ',' + busRouteKey[2];
	drawBusRoute( map, busRouteKey )
	drawBusStops( map, busRouteKey, URL_TKITA_GITHUB + 'resources/mm_20_green.png', false );
	drawControl( map, busRouteKey, google.maps.ControlPosition.BOTTOM_CENTER, 'green' );
    }
}

function lock () {
    document.getElementById( 'lock' ).value = getOptionText( 'busRoutes' ) +
        ',' + getOptionValue( 'busRoutes' );
}

function unlock () {
    document.getElementById( 'lock' ).value = '';
}

function setupShokuba () {
    var dom = document.getElementById( 'kyoku' );
    Object.keys( objWorkplace ).forEach( function( e ) {
	addOption( dom, e, objWorkplace[ e ].name );
    });
    dom.selectedIndex = 0;
    changeKyoku( getOptionValue( 'kyoku' ) );
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
	if ( event.ctrlKey ) {
            switch ( event.keyCode ) {
            case 49: // CTRL-1
                var mapObj = currentMapObj[ current ];
                if ( mapObj ) {
                    mapObj.setZoom( mapObj.getZoom() + 1 );
                }
                break;

            case 50: // CTRL-2
                var mapObj = currentMapObj[ current ];
                if ( mapObj ) {
                    mapObj.setZoom( mapObj.getZoom() - 1 );
                }
                break;

            case 66: // CTRL-b
                current = 'bus';
	        document.getElementById( 'link_bus' ).click();
	        document.getElementById( 'btnBus' ).focus();
                break;

            case 68:// CTRL-d
                current = 'departure';
	        document.getElementById( 'link_departure' ).click();
	        document.getElementById( 'btnPaste' ).focus();
                break;

            case 69: // CTRL-e
                current = 'ekibus';
                document.getElementById( 'link_ekibus' ).click();
                break;

            case 70: // CTRL-f
                current = false;
	        document.getElementById( 'kword' ).focus();
                break;

            case 71: // CTRL-g
                current = false;
                document.getElementById( 'btnGeo' ).click();
                break;

            case 82: // CTRL-r
                if ( current == 'yougu' ) {
                    document.getElementById( 'btnDist' ).click();
                } else {
                    current = 'yougu';
	            document.getElementById( 'link_yougu' ).click();
	            document.getElementById( 'btnDist' ).focus();
                }
                break;

            case 83: // CTRL-s
                if ( current == 'jrsubway' ) {
                    document.getElementById( 'btnJrSubway' ).click();
                } else {
                    current ='jrsubway';
	            document.getElementById( 'link_jrsubway' ).click();
                }
                break;

            case 84: // CTRL-t
                current = 'top';
	        document.getElementById( 'link_top' ).click();
                break;

            case 86: // CTRL-v
                current = false;
	        document.getElementById( 'link_departure' ).click();
	        document.getElementById( 'addr' ).value = '';
	        cbPaste();
	        document.getElementById( 'btnGeo' ).focus();
                break;
            }
            event.keyCode = null;
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
                                 URL_GOOGLE_ICONS + color + '.png',
                                 format( '($$$) $$$<br>$$$m',
                                         e['id'], e['name'],
                                         fmtNumber( Math.floor( e['dist'] ) ) )
                                        );
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

    makeMarker( map, stLat, stLng, URL_GOOGLE_ICONS + 'green-dot.png' );

    var nearTouhyou = getNearTouhyou( stLat, stLng );
    drawTouhyouMarker( map, nearTouhyou.slice( 0, 5 ), 'red', true );
    drawTouhyouMarker( map, nearTouhyou.slice( 5    ), 'purple', false );
}

// ekibus
var COMPANY_NAME = { 34: 'ＪＲバス',
		     42: 'じょうてつバス',
		     54: '中央バス',
		     64: 'ばんけいバス',
		     91: 'ＪＲ鉄道',
		     92: '地下鉄',
		     93: '市電',
		     100: 'ランドマーク'
                   };

function getRoutePrediction ( word, id ) {
    var param = {};
    param['kind']        = 0;
    param['search_flg']  = 1;
    param['search_word'] = word;
    param['pos_flg']     = 0;
    param['company_id']  = '';
    param['lang']        = '';

    $.ajax( { url: URL_EKIBUS_API + 'get_route_prediction',
	      type: 'POST',
	      data: param,
	      dataType: 'text' }
          ).done( function( res, status, xhr ) {
	      var obj = JSON.parse( res );
	      if ( obj.result == 0 ) {
	          var dom = removeOptions( id );
	          obj.route_prediction.forEach( function(e) {
                      var str = format( '($$$)$$$ - $$$',
                                        e.company_id, COMPANY_NAME[ e.company_id ], e.name );
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

    $.ajax( { url: URL_EKIBUS_API + 'get_search_result',
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
    var tr = document.createElement( 'tr' );
    [ '片道金額', '所要時間', '経路' ].forEach( function(e) {
	var th = document.createElement( 'th' );
	th.appendChild( document.createTextNode( e ) );
	tr.appendChild( th );
    });
    thead.appendChild( tr );
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

    $.ajax( { url: URL_EKIBUS_API + 'get_time_table',
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
	$.ajax( { url: URL_EKIBUS_API + 'get_route_station',
		  type: 'POST',
		  data: param,
		  dataType: 'text',
		  async: false      // デフォルトは非同期
		} ).responseText );

    document.getElementById( line_id ).style.height = '300px';
    var center = obj.route_station[0].station_list.filter( function(s) {
	return ( s.station_id == from_id );
    });
    var map = makeMap( line_id, center[0].lat, center[0].lon, { zoom: 13 } );

    obj.route_station.forEach( function( route ) {
	var path = route.station_list.map( function(r) {
	    return { lat: Number( r.lat ), lng: Number( r.lon ) }
	});
        drawPolyline( map, path, { strokeColor: 'cyan', strokeOpacity: 0.8, strokeWeight: 2 } );

	route.station_list.forEach( function(s) {
            var marker = makeMarker( map, s.lat, s.lon,
                                     URL_TKITA_GITHUB + 'resources/mm_20_orange.png', s.name );
	    if ( s.station_id == from_id ) {
		google.maps.event.trigger( marker, 'click' );
	    }
	});
    });
}

function setStationName () {
    var str = document.getElementById( 'jrdepstation' ).textContent;
    if ( str != '' ) {
        document.getElementById( 'word_ebDep' ).value = str;
        ebChangeWord ( 'ebDep' );
    }

    var str = document.getElementById( 'jrarrstation' ).textContent;
    if ( str != '' ) {
        document.getElementById( 'word_ebArr' ).value = str;
        ebChangeWord ( 'ebArr' );
    }
}

function showModal ( url ) {
    window.showModalDialog(
	url,   //移動先
	this,  //ダイアログに渡すパラメータ（この例では、自分自身のwindowオブジェクト）
	'dialogWidth=1200px; dialogHeight=800px;'
    );
    //モーダルダイアログが終了すると、ここからスクリプトが続行される
}
