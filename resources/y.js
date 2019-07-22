// -*- coding: utf-8 -*-
var RESOURCES_URL = 'https://tkita.github.io/m5/resources/'

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

var hot = new Handsontable( document.getElementById( 'hot' ) ,
			    { data: [ [ '', '', '', '', '', '', '' ] ],
			      autoColumnSize: true,
			      colHeaders: [ '名称', '建物', '住所', 'lat', 'lng', '通勤不便', '電話番号' ],
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

var changeKyoku = function ( kyoku ) {
    var data = objWorkplace[ kyoku ].data.map( function( e ) {
	return e.split( ',' );
    });
    hot.updateSettings( { data: data,
			} );
    hot.selectCell( 0, 0 );
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

// var move = function ( dom ) {
//     [ 'lat', 'lon' ].forEach( function ( e ) {
//         setText( dom + e, getText(e) );
//     });
    
//     [ 'name', 'addr' ].forEach( function ( e ) {
//         setText( dom + e, '' );
//     });
// };

var getHotValue = function () {
    var wp = hot.getDataAtRow( hot.getSelected()[0] );
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
        useCar: false
    };
    if ( document.getElementById( 'car' ).checked ) {
        config.useCar = true;
    };

    var ymap = makeMap( 'map_yougu', latlngs[0] );
    // ymap.bind( 'click', function ( latlng ) {
    //     setText( 'lat', latlng[ 'Lat' ] );
    //     setText( 'lon', latlng[ 'Lon' ] );
    //     var marker = new Y.Marker( new Y.LatLng( latlng[ 'Lat' ], latlng[ 'Lon' ] ) );
    //     ymap.addFeature( marker );
    // });
    
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
            var da = Math.abs( Number( lat ) - Number( s[2] ) );
            var db = Math.abs( Number( lng ) - Number( s[3] ) );
	    return { id:   s[0],
		     name: s[1],
		     lat:  s[2],
		     lng:  s[3],
		     // dist: google.maps.geometry.spherical.computeDistanceBetween(
                     //     new google.maps.LatLng( lat, lng ),
                     //     new google.maps.LatLng( s[2], s[3] ) )
                     dist: da * da + db * db
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

    // var yLatLng = new Y.LatLng( Number( latlng.Lat ),
    //                             Number( latlng.Lon ) );

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
