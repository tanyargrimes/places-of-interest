var map;
var places = [];
var scapeColours = [];
var lastSelected;

// set location of map to coordinates of Barbados
var initialize = function() {
    
    var latlng = new google.maps.LatLng(13.1938870, -59.5432000);

    var mapOptions = {
        zoom: 11,
        center: latlng,
        scrollwheel: false,
        disableDefaultUI: true,
        draggable: true,
        zoomControl:true,
        zoomControlOptions: {
            style:google.maps.ZoomControlStyle.SMALL,
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    // make map height of screen
    $('.map-canvas').css('height', $( window ).height() + 'px');

    // add resort to map
    //addResort();

    // initialize Parse API to access data
    Parse.initialize("VC0jqpKVbNyNRdvuHCo8VzKHMG9Mljae9FwYiYzb", "dmAaEwQ9lx1T7Z55CznFtgNRLF8yaoIWh2DAulF3");

    // populate search bar
    populateSearch();

    // initialize results to All
    showResults(0);

    // centre map
    google.maps.event.addDomListener(window, 'resize', function() {
        var centre = map.getCenter();

        google.maps.event.trigger(map, 'resize');
        
        map.setCenter(centre);
    });

};

// display marker of resort
var addResort = function() {

    var latlng = new google.maps.LatLng(13.237000, -59.5450000);

    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        animation: google.maps.Animation.DROP,
        title: 'Whispers Spa Resort',
        icon: 'assets/images/whispers_marker.png'
    });

    google.maps.event.addListener(marker, 'click', function() {
        populateInfo(-1);
    });

};

// populate search bar with data from Parse
var populateSearch = function() {

    var scapeTypeNum;
    var i;

    var ScapeType = Parse.Object.extend('Scape_Type');
    var query = new Parse.Query(ScapeType);

    scapeColours[0] = 'f39c12';
    
    query.ascending('Type_Id');
    query.find({
        success: function(results) {
            // results is an array of Parse.Object.

            $('#search select').append(
                '<option value="0">All</option>'
            );

            scapeTypeNum = results.length;

            for (i = 0; i < scapeTypeNum; i++) {

                $('#search select').append(
                    '<option value="' + results[i].attributes.Type_Id + '">' + results[i].attributes.Name + '</option>'
                );

                scapeColours.push(results[i].attributes.Marker_Colour);

            }

        },

        error: function(error) {
            // error is an instance of Parse.Error.
            console.log(error);
        }
    });

};

// display results on map and list
var showResults = function(id) {

    var scapeNum;
    var i;

    var Scape = Parse.Object.extend('Scape');
    var query = new Parse.Query(Scape);

    id = parseInt(id);

    // get results from db based on id
    if (id > 0) {
        query.equalTo('Scape_Type', id);
    }

    // query to find results
    query.find({
        success: function(results) {

            // clear previous list and map results
            clearListMap();
            
            scapeNum = results.length;

            for (i = 0; i < scapeNum; i++) {

                // push places to array
                places.push({ attributes: results[i].attributes, marker: null });

            }

            // display results in list and places on the map
            populateListMap(id);

        },

        error: function(error) {
            
            // error is an instance of Parse.Error.
            console.log(error);

        }
    });

};

// clears list and map results
var clearListMap = function() {

    var i;
    var markerNum = places.length;

    if (markerNum != 0) {
        for (i = 0; i < markerNum; i++) {
            places[i].marker.setMap(null);
        }

        places = [];

        $('ul#result-list').html('');
    }

    map.setZoom(11);

    map.panTo(map.getCenter());

    $('#info').css('display', 'none');

    // make map height of screen
    $('.map-canvas').css('height', $( window ).height() + 'px');

    // close menu if open
    if($('.content-section').hasClass('isOpen')) {
        toggleMenu();
    }

};

// displays result list and places on the map, based on places array
var populateListMap = function(typeId) {

    var i;
    var markerNum = places.length;
    var latlng;
    var image;
    var marker;
    var infoWindow;
    var tooltipOptions;
    var tooltip;

    $('.results-label').html('Results: ' + markerNum);

    for (i = 0; i < markerNum; i++) {

        $('ul#result-list').append(
            '<li onmouseout="resetMarker(lastSelected)" onmouseover="showMarker(' + i + ')" onclick="populateInfo(' + i + ')"><a id="s' 
            + places[i].attributes.Id + '" href="#' + places[i].attributes.Title + '" >'
            + places[i].attributes.Title + '</a></li>'
        );

        latlng = new google.maps.LatLng(places[i].attributes.Latitude, places[i].attributes.Longitude);

        //Uses icons generated from the Google Charts API
        image = 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + scapeColours[typeId];

        marker = new google.maps.Marker({
            position: latlng,
            map: map,
            animation: google.maps.Animation.DROP,
            title: places[i].attributes.Title,
            id: i,
            icon: image,
            colour: scapeColours[typeId]
        });

        places[i].marker = marker;

        //On mouse over, calls to change to highlight icon
        google.maps.event.addListener(places[i].marker, 'mouseover', function () {
            changeMarker(this);
        });

        //On mouse out, calls to rest to original icon
        google.maps.event.addListener(places[i].marker, 'mouseout', function () {
            resetMarker(this);
        });

        //On click, calls to get specific asset info by ID
        google.maps.event.addListener(places[i].marker, 'click', function () {
            populateInfo(this.id);
            changeMarker(this);
        });

    }

};

//Changes to highlight icon
var changeMarker = function(marker) {
    
    marker.setIcon('http://chart.apis.google.com/chart?cht=mm&chs=32x32&chco=FFFFFF,' + marker.colour + ',' + marker.colour + '&ext=.png');

    lastSelected = marker;
};

//Returns to original icon, based on asset type
var resetMarker = function(marker) {

    marker.setIcon('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|' + marker.colour);
};


//Displays marker on the map
var showMarker = function(id) {

    google.maps.event.trigger(places[id].marker, "mouseout");
    google.maps.event.trigger(places[id].marker, "mouseover");
    
    changeMarker(places[id].marker);
};


// Zooms in on marker for a closer look at the area
var zoomToLocation = function(id) {

    map.panTo(places[id].marker.getPosition());

    map.setZoom(16);

};


//Get specific asset data based on asset ID
var populateInfo = function(id) {

    var item;

    // set list item as active
    $('.results-content li').removeClass('active');
    item = $('.results-content li').get(id);
    $(item).addClass('active');

    //changeMarker(places[id].marker);

    // zoom in and pan to location
    zoomToLocation(id);

    // close menu if open
    if($('.content-section').hasClass('isOpen')) {
        toggleMenu();
    }

    // display name and address
    $('#info h2').html(places[id].attributes.Title);
    $('#info h3.location').html(places[id].attributes.Location);
    $('#info .poi-image').css('background', 'url(assets/images/' + places[id].attributes.Image +') no-repeat center center');
    $('#info p').html(places[id].attributes.Description);   
    
    $('#info').css('display', 'block');

    // move map up to reveal info
    if($('.menu-btn').css('display') === 'block') {

        var mapHeight = $( window ).height() - ($(window).height() * 0.2);

        $('.map-canvas').css('height', mapHeight + 'px');
    }

};

// toggles menu
var toggleMenu = function() {

    $('.content-section').toggleClass('isOpen');

    $('.results-content').toggleClass('isOpen');

};

// proceed on load
$(document).ready(function() {
    
    //google.maps.event.addDomListener(window, 'load', initialize);
    $(window).load(initialize);

    // show result list
    $('#search select').change(function() {

        var typeId = $(this).val();

        showResults(typeId);

    });

    // call to toggle menu
    $('.menu-btn').on('click', function() {
        toggleMenu();
    });

});