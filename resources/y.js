// -*- coding: utf-8 -*-
var RESOURCES_URL = 'https://tkita.github.io/m5/resources/';

var format = function () {
    var args = Array.prototype.slice.call( arguments, 0 );
    var str = args.shift();
    args.forEach( function ( e ) {
	str = str.replace( '$$$', e );
    });
    return str;
}

var removeAllChilds = function ( id ) {
    var dom = document.getElementById( id );
    while ( dom.firstChild ) {
        dom.removeChild( dom.firstChild );
    }
    return dom;
}

var getText = function ( dom ) {
    var d = document.getElementById( dom );

    switch ( d.tagName ) {
      case 'SPAN':
        return d.textContent;
        break;
      case 'INPUT':
        return d.value;
        break;
      case 'SELECT':
        return d.options[ d.selectedIndex ].value;
        break;
      default:
        return false;
        break;
    };
};

var setText = function ( dom, value ) {
    var d = document.getElementById( dom );
    switch ( d.tagName ) {
    case 'SPAN':
        d.textContent = value;
        break;
    case 'INPUT':
        d.value = value;
        break;
    };
    return value;
};

var fmtNumber = function ( num ) {
    return String( num ).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,' );
}

var addOption = function ( sel, value, text ) {
    var opt = document.createElement( 'option' );
    opt.value = value;
    opt.text = text;
    sel.appendChild( opt );
}

var removeOptions = function ( id ) {
    var sel = document.getElementById( id );
    while ( sel.options.length ) {
	sel.remove(0);
    }
    return sel;
}

var selectDist = function ( d ) {
    setText( 'name', d.cells[0].textContent );
    setText( 'build', d.cells[1].textContent );
    setText( 'build_lat', d.cells[3].textContent );
    setText( 'build_lng', d.cells[4].textContent );
}

var changeKyoku = function ( kyoku ) {
    var data = objWorkplace[ kyoku ].data.map( function( e ) {
	return e.split( ',' );
    });

    var tbody = removeAllChilds( 'data' );
    data.forEach( function ( dr ) {
        var tr = document.createElement( 'tr' );
        dr.forEach( function ( dd ) {
            var td = document.createElement( 'td' );
            td.textContent = dd;
            tr.appendChild( td );
        });
        tr.setAttribute( 'onClick', 'selectDist(this);' );
        tbody.appendChild( tr );
    });
}

var setupBoundCity = function () {
    var dom = document.getElementById( 'boundCity' );
    objBound.map( function( e ) {     // data/objbound.js
    	return e[1];
    }).filter( function( x, i, self ) {
        return self.indexOf( x ) === i;
    }).forEach( function( e ) {
	addOption( dom, e, e );
    });
};

var changeCity = function  ( city ) {
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

    $( '#boundAddr' ).formSelect();
}

var init = function () {
    var dom = document.getElementById( 'kyoku' );
    Object.keys( objWorkplace ).forEach( function( e ) {
	addOption( dom, e, objWorkplace[ e ].name );
    });
    dom.selectedIndex = 0;
    changeKyoku( getText( 'kyoku' ) );
    setupBoundCity();
    changeCity( getText( 'boundCity' ) );

    $( '#boundCity' ).formSelect();

   document.onkeydown = function ( event ) {
	if ( event.ctrlKey ) {
            switch ( event.keyCode ) {
            case 65: // CTRL-a
                document.getElementById( 'nav_top' ).click();
                break;
            case 66: // CTRL-b
	        document.getElementById( 'nav_bus' ).click();
                break;
            case 68: // CTRL-d
                document.getElementById( 'nav_dep' ).click();
                break;
            case 69: // CTRL-e
                document.getElementById( 'nav_eki' ).click();
                break;
            case 76: // CTRL-l
                document.getElementById( 'nav_link' ).click();
                break;
            case 82: // CTRL-r
                document.getElementById( 'nav_yougu' ).click();
                break;
            case 83: // CTRL-s
                document.getElementById( 'nav_jr' ).click();
                break;
            }
            event.keyCode = null;
            return false;
        }}
};

var pasteAddr = function () {
    document.getElementById( 'dep_addr' ).value = clipboardData.getData( 'text' );
    [ 'dep_name', 'dep_lat', 'dep_lon' ].forEach( function (d) {
        setText( d, '' );
    });
    document.getElementById( 'btnGeocode' ).focus();
};

var setBoundArea = function () {
    var mCity, mAddr;
    var addr = getText( 'dep_addr' );
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

var doGeocode = function ( dom ) {
    var geocoder = new Y.GeoCoder();
    geocoder.execute( { query: getText( dom + 'addr' ) },
                      function ( result ) {
                          if ( result.features.length > 0 ) {
                              setText( dom + 'name', result.features[0].name);
                              setText( dom + 'lat', result.features[0].latlng[ 'Lat' ] );
                              setText( dom + 'lon', result.features[0].latlng[ 'Lon' ] );
                              setBoundArea();
                          }
                      } );
};

var move = function () {
    var dmy = getHotValue();
    setText( 'dep_name', '' );
    setText( 'dep_lat', dmy[3] );
    setText( 'dep_lon', dmy[4] );
};

var getHotValue = function () {
    var wp = [
        getText( 'name' ),
        getText( 'build' ),
        '',
        getText( 'build_lat' ),
        getText( 'build_lng' )
    ];

    if ( wp[3] == '' ) {
     	alert( '施設情報地が選択されていません' );
     	return false;
    }
    return wp;
}

var drawBoundArea = function ( map ) {
    var coords = objBoundLine[ getText( 'boundAddr' ) ];
    if ( coords ) {
	var latlngs = coords.split( ' ' ).map( function( e ) {
	    var c = e.split( ',' );
	    return new Y.LatLng( Number( c[1] ), Number( c[0] ) );
	});

        var polygon = new Y.Polygon( latlngs, {
            strokeStyle: new Y.Style( '0000ff', 2, 0.7 ),
            fillStyle: new Y.Style( '0000ff', null, 0.05 )
        });
        polygon.setClickable( false );
        map.addFeature( polygon );
    }
}

var makeCircle = function ( map, latlng, color ) {
    var circle = new Y.Circle( latlng,
                               new Y.Size( 1, 1 ),
                               { unit: 'km', // Y.Size とあわせて半径 1km
                                 // 色、太さ、透過率
                                 strokeStyle: new Y.Style( color, 2, 0.7 ),
                                 // 色、太さ（塗りでは無関係）、透過率
                                 fillStyle: new Y.Style( '000000', null, 0 ),
                               });
    circle.setClickable( false );
    map.addFeature( circle );
};


var getData = function () {
    var dmy = getHotValue();
    if ( !dmy ) {
        alert( '選択されていません' );
        return false;
    }

    var lat = getText( 'dep_lat' );
    var lon = getText( 'dep_lon' );
    if ( lat == '' || lon == '' ) {
        alert( 'Geocode が未設定です' );
        return false;
    }

    return [ new Y.LatLng( lat, lon ),
            new Y.LatLng( dmy[3], dmy[4] ) ];
}

var makeMap = function ( dom, latlng ) {
    var layerSets = {};
    layerSets[ 'myRailway' ] = new Y.LayerSet( '鉄道路線', [ new Y.StyleMapLayer( 'railway' ) ] );
    layerSets[ Y.LayerSetId.NORMAL ] = new Y.LayerSet( '地図', [ new Y.NormalLayer() ] );
    
    var ymap = new Y.Map( dom, {
        layerSets: layerSets,
        configure: { doubleClickZoom: false,
                     scrollWheelZoom: true,
                     continuousZoom: true,
                     singleClickPan: false,
                     dragging: true }
    } );

    // 0 <-- zoom out <-- --> zoom in --> 20
    ymap.drawMap( latlng, 13, Y.LayerSetId.NORMAL );
    
    ymap.addControl( new Y.LayerSetControl() );
    ymap.addControl( new Y.ScaleControl() );
    ymap.addControl( new Y.SliderZoomControlVertical() );
    return ymap;
}

var getRoute = function () {
    var latlngs = getData();
    if ( !latlngs ) {
        return;
    }

    var config = {
        useCar: false,
        useTollway: false,
    };
    if ( document.getElementById( 'car' ).checked ) {
        config.useCar = true;
    };

    var ymap = makeMap( 'map_yougu', latlngs[0] );
    
    var routeLayer = new Y.RouteSearchLayer();
    routeLayer.bind( 'drawend', function ( summary ) {
        setText( 'dist', fmtNumber( summary.TotalDistance ) );
        setText( 'time', summary.TotalTime );
    });
    routeLayer.execute( latlngs, config );
    ymap.addLayer( routeLayer );

    // 半径 1km の円
    makeCircle( ymap, latlngs[0], '00ff00' );

    drawBoundArea( ymap );
};

var itsmo = function () {
    // 世界測地系(GoogleMap) から 日本測地系 へ変換
    var lat = parseFloat( getText( 'dep_lat' ) );
    var lon = parseFloat( getText( 'dep_lon' ) );
    var x = lat + 0.000106961 * lat - 0.000017467 * lon - 0.004602017;
    var y = lon + 0.000046047 * lat + 0.000083049 * lon - 0.010041046;
    
    // 度表記 から 秒表記(its-mo)
    x = Math.floor( x * 3600 * 1000 );
    y = Math.floor( y * 3600 * 1000 );
    var url = 'https://www.its-mo.com/map/top_z/' + x + '_' + y + '_13//#top'
    window.open( url );
};

// ＪＲ線・地下鉄
var getNearStations = function ( lat, lng ) {
    // objStations ... 別ファイル [ id, name, lat, lng ]
    var result = objStations.map(
	function( s ) {
            var tmpa = Math.abs( Number( lat ) - Number( s[2] ) );
            var tmpb = Math.abs( Number( lng ) - Number( s[3] ) );
	    return { id:   s[0],
		     name: s[1],
		     lat:  s[2],
		     lng:  s[3],
		     // dist: google.maps.geometry.spherical.computeDistanceBetween(
                     //     new google.maps.LatLng( lat, lng ),
                     //     new google.maps.LatLng( s[2], s[3] ) )
                     dist: tmpa * tmpa + tmpb * tmpb
                   };
	});

    result.sort( function( a, b ) {
	if ( a.dist < b.dist ) return -1;
	if ( a.dist > b.dist ) return 1;
	return 0;
    });

    return result.slice( 0, 5 ); // 上位５つ
}

var dispNearStationSub = function ( map, latlng, color ) {
    // latlng は Y.LatLng オブジェクト

    map.addFeature( new Y.Marker( latlng,
                                  { icon: new Y.Icon( RESOURCES_URL + color + '-dot.png' )
                                  })
                  );
    makeCircle( map, latlng, '00ff00' );

    var stations = getNearStations( latlng.Lat, latlng.Lon );
    stations.forEach( function ( e, idx, ary ) {
        var marker = new Y.Marker( new Y.LatLng( Number( e.lat ), Number( e.lng )),
                                   { icon: new Y.Icon( RESOURCES_URL + 'mm_20_' + color + '.png' ),
                                     title: e.name
                                   });
        map.addFeature( marker );
    });

    // stations.forEach(
    //     function( e, idx, ary ) {
    //         var marker = makeMarker( map, e['lat'], e['lng'],
    //                                  format( '$$$resources/mm_20_$$$.png', URL_TKITA_GITHUB, color ),
    //                                  format( '($$$) $$$: $$$m',
    //                                          ( idx + 1 ),
    //                                          e['name'],
    //                                          fmtNumber( Math.floor( e['dist'] ) ) )
    //                                );
    //         if ( idx == 0 ) {
    //             google.maps.event.trigger( marker, 'click' );
    //         }
    //     });

    return stations;
}

var dispNearStation = function () {
    var latlngs = getData();
    if ( !latlngs ) {
        return;
    }

    var ymap = makeMap( 'map_jrsubway', latlngs[0] );
    dispNearStationSub( ymap, latlngs[0], 'green' );
    dispNearStationSub( ymap, latlngs[1], 'red' );

}

var getNearBusStop = function ( lat, lng ) {
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

var searchNearBusStop = function () {
    var latlngs = getData();
    if ( !latlngs ) {
        return;
    }

    if ( document.getElementsByName( 'busAround' )[0].checked ) {
	lat = latlngs[1].Lat;
	lng = latlngs[1].Lon;
    } else {
	lat = latlngs[0].Lat;
	lng = latlngs[0].Lon;
    }
    var sel = removeOptions( 'busStops' );
    getNearBusStop( lat, lng ).forEach( function( e ) {
	addOption( sel, e.id, e.name );
    });
}

var changeBusStop = function ( id ) {
    var sel = removeOptions( 'busRoutes' );
    var aryCompany = Object.keys( objBusStopRoute ); 
    aryCompany.forEach( function ( c ) {
	var aryRoute = Object.keys( objBusStopRoute[ c ].route );
	aryRoute.forEach( function ( r ) {
	    if ( objBusStopRoute[ c ].route[ r ].data.indexOf( id ) > -1 ) {
		addOption( sel, [ c, r ],
                           '【' + objBusStopRoute[ c ].company + '】' +
                           objBusStopRoute[ c ].route[ r ].name );
	    }
	});
    });
}

var searchNameBusStop = function () {
    var kword = getText( 'busstopname' );
    var result = Object.keys( objbusstops ).filter( function ( id ) {
	return ( objbusstops[ id ].split( ',' )[2].indexOf( kword ) > -1 )
    });
    var sel = removeOptions( 'busStops' );
    result.forEach( function ( id ) {
	addOption( sel, id, objbusstops[ id ].split( ',' )[2] );
    });
}

var drawBusRoute = function ( map, route ) {
    var url = 'https://tkita.github.io/m5/data-kml/' + route.replace( ',', '' ) + '.kml';
    var geoXmlLayer = new Y.GeoXmlLayer( url );
    map.addLayer( geoXmlLayer );
    geoXmlLayer.execute();
}

var drawBusStops = function ( map, busRouteKey, image, advance ) {
    // バス路線に含まれるバス停を抽出
    var key = busRouteKey.split( ',' );
    var aryBusStop = objBusStopRoute[ key[0] ].route[ key[1] ].data;
    aryBusStop.forEach( function( e ) {
	var s = objbusstops[ e ].split( ',' );
    	// var marker = makeMarker( map, s[0], s[1], image, s[2] );
        map.addFeature( new Y.Marker( new Y.LatLng( s[0], s[1] ),
                                      { icon: new Y.Icon( image ),
                                        title: s[2]
                                      })
                      );

	// if ( e == advance ) {
	//     google.maps.event.trigger( marker, 'click' );
	// }

    });
}

var dispBusRoute = function ( busRouteKey ) {
    var latlngs = getData();
    if ( !latlngs ) {
        return;
    }
    var ymap = makeMap( 'map_bus', latlngs[0] );

    // drawBoundArea( map );
    // var transitLayer = new google.maps.TransitLayer();
    // transitLayer.setMap( map );

    ymap.addFeature( new Y.Marker( latlngs[0],
                                  { icon: new Y.Icon( RESOURCES_URL + 'green-dot.png' )
                                  })
                  );
    makeCircle( ymap, latlngs[0], '00ff00' );

    ymap.addFeature( new Y.Marker( latlngs[1],
                                  { icon: new Y.Icon( RESOURCES_URL + 'red-dot.png' )
                                  })
                  );
    makeCircle( ymap, latlngs[1], '00ff00' );

    // バス停
    drawBusStops( ymap, busRouteKey,
                  RESOURCES_URL + 'mm_20_orange.png',
                  getText( 'busStops' ) );

    // バス路線
    drawBusRoute( ymap, busRouteKey )

    // var sel = document.getElementById( 'busRoutes' );
    // drawControl( map, getOptionText( 'busRoutes' ), false, 'black' );

    // 路線を固定
    // busRouteKey = document.getElementById( 'lock' ).value;
    // if ( busRouteKey != '' ) {
    //     busRouteKey = busRouteKey.split( ',' );
    //     busRouteKey = busRouteKey[1] + ',' + busRouteKey[2];
    //     drawBusRoute( map, busRouteKey )
    //     drawBusStops( map, busRouteKey, URL_TKITA_GITHUB + 'resources/mm_20_green.png', false );
    //     drawControl( map, busRouteKey, google.maps.ControlPosition.BOTTOM_CENTER, 'green' );
    // }
}

var URL_EKIBUS_API = 'https://ekibus-api.city.sapporo.jp/';
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
    param[ 'kind' ]        = 0;
    param[ 'search_flg' ]  = 1;
    param[ 'search_word' ] = word;
    param[ 'pos_flg' ]     = 0;
    param[ 'company_id' ]  = '';
    param[ 'lang' ]        = '';

    $.ajax( { url: URL_EKIBUS_API + 'get_route_prediction',
	      type: 'POST',
	      data: param,
	      dataType: 'text' }
          ).done( function( res, status, xhr ) {
	      var obj = JSON.parse( res );
	      if ( obj.result == 0 ) {
	          var dom = removeOptions( id );
	          obj.route_prediction.forEach( function(e) {
                      var str = '(' + e.company_id + ')' + COMPANY_NAME[ e.company_id ] + 
                                ' - ' + e.name;
		      addOption( dom, e.station_id, str ); // dom, value, text
	          });
	      }
          });
}

var ebChangeWord = function ( id ) {
    getRoutePrediction( document.getElementById( 'word_' + id ).value, id );
}

var getSearchResult = function () {
    var start_st = getText( 'ebDep' );
    var end_st = getText( 'ebArr' );
    if ( ( start_st == '' ) || ( end_st == '' ) ) {
	alert( '未選択' );
	return ;
    }

    var param = {};
    param[ 'kind' ]               = 0;
    param[ 'start_st' ]           = start_st;
    param[ 'end_st' ]             = end_st;
    param[ 'bus_prediction_flg' ] = 0;
    param[ 'departure_flg' ]      = 0;
    param[ 'sort_id' ]            = 2;
    param[ 'before_after_count' ] = 0;
    param[ 'start_datetime' ]     = '';
    param[ 'lang' ]               = '';

    $.ajax( { url: URL_EKIBUS_API + 'get_search_result',
	      type: 'POST',
	      data: param,
	      dataType: 'text' }
    ).done( function( res, status, xhr ) {
	var obj = JSON.parse( res );
	drawTable( obj.search_result.route );
    });
}

var drawTable = function ( ary ) {
    var tbody = removeAllChilds( 'ebTbody' );

    ary.forEach( function ( e ) {
	var tr = document.createElement( 'tr' );

	// 片道金額
	var td = document.createElement( 'td' );
	td.appendChild( document.createTextNode( format( '$$$ 円', e.fare )));
	td.setAttribute( 'align', 'right' );
	tr.appendChild( td );

	// 所要時間
	var td = document.createElement( 'td' );
        td.appendChild( document.createTextNode( format( '$$$ 分', e.total_time )));
        td.setAttribute( 'align', 'right' );
	tr.appendChild( td );

	// 経路
	var td = document.createElement( 'td' );
	var ul = document.createElement( 'ul' );
	e.route_list.forEach( function(r) {
	    var li = document.createElement( 'li' );

	    var fare = document.createTextNode( format( '$$$  円$$$', r.fare,
                                                        r.connect_flag == 1 ? '（乗継） ' : ' '
                                                      ));

	    var from_name = document.createElement( 'span' );
	    from_name.setAttribute( 'class', 'station' );
	    from_name.appendChild( document.createTextNode( r.from_name ) );

	    var line_name = document.createElement( 'span' );
	    var fn = format( 'getTimeTable("$$$", "$$$", "$$$", "$$$");',
			     r.from_id, r.from_name, r.to_id, r.to_name) ;
	    line_name.setAttribute( 'class', 'btn-small' );
	    line_name.setAttribute( 'onClick', fn );
	    line_name.appendChild( document.createTextNode( r.line_name ) );

	    var to_name = document.createElement( 'span' );
	    to_name.setAttribute( 'class', 'station' );
	    to_name.appendChild( document.createTextNode( r.to_name ) );

	    li.appendChild( fare );
	    li.appendChild( from_name );
	    li.appendChild( document.createTextNode( ' 〜 ' ) );
	    li.appendChild( line_name );
	    li.appendChild( document.createTextNode( ' 〜 ' ) );
	    li.appendChild( to_name );
	    ul.appendChild( li );
	});
	td.appendChild( ul );
	tr.appendChild( td );

	tbody.appendChild( tr );
    });
}

var getTimeTable = function ( from_id, from_name, to_id, to_name ) {
    removeAllChilds( 'timetable' );
    var param = {};
    param[ 'kind' ]     = 0;
    param[ 'start_st' ] = from_id;
    param[ 'end_st' ]   = to_id;
    param[ 'lang' ]     = '';

    $.ajax( { url: URL_EKIBUS_API + 'get_time_table',
	      type: 'POST',
	      data: param,
	      dataType: 'text' }
          ).done( function ( res, status, xhr ) {
	      var obj = JSON.parse( res );
	      dispTimeTable( obj, from_id, from_name, to_id, to_name );
	  });
}

var dispTimeTable = function ( obj, from_id, from_name, to_id, to_name ) {
    var objTimeTable = obj.time_table[ 0 ]; // dia_flg = 1
    var aryHeader = objTimeTable.header_table;
    var company = objTimeTable.company_name;
    var aryTimes = objTimeTable.times;

    var dl = document.createElement( 'dl' );
    aryHeader.forEach( function( e ) {
	var dt = document.createElement( 'dt' );
	dt.appendChild( document.createTextNode( format( '$$$ ＠ $$$',
							 e.line_name,
							 company ) ) );
	dl.appendChild( dt );

	var dd = document.createElement( 'dd' );
	var course = document.createElement( 'span' );
	course.appendChild(
	    document.createTextNode( format( ' line_id:$$$ ', e.line_id ) ) );
	course.setAttribute( 'class', 'btn-small' );
	var fn = format( 'showLine("$$$", "$$$", "$$$");', e.line_id, from_id, to_id );
	course.setAttribute( 'onClick', fn );
	dd.appendChild( course );

	dd.appendChild( document.createTextNode( ' ' + e.course_name ) );
	dl.appendChild( dd );

	var tt = '';
	aryTimes.filter( function( t ) {
	    return ( t.course_id == e.course_id )
	}).forEach( function( e ) {
	    tt = tt + e.time + ' / ';
	});
	var dd = document.createElement( 'dd' );
	dd.appendChild( document.createTextNode( tt ) );
	dl.appendChild( dd );

	var dd = document.createElement( 'dd' );
	dd.setAttribute( 'id', e.line_id );
	dl.appendChild( dd );
    });

    setText( 'ebName', format( '$$$ → $$$', from_name, to_name ) );

    var timetable = document.getElementById( 'timetable' );
    timetable.appendChild( dl );
}

var showLine = function ( line_id, from_id, to_id ) {
    alert( 'yet' );
    return;

    var param = {};
    param[ 'kind' ]    = 0;
    param[ 'line_id' ] = line_id;
    param[ 'lang' ]    = '';

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
