// 1. Create a map object.
var mymap = L.map('map', {
    center: [39.105249,-96.6091464],
    zoom: 5,
    maxZoom: 10,
    minZoom: 2,
    detectRetina: true // detect whether the screen is high resolution or not.
});

// 2. Add a base map.

var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: ' Basemap &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(mymap);

// 3.Add airport GeoJSON Data
// Null variable that will hold cell tower data
var airports = null;


// 4. build up a set of colors from colorbrewer's "set2" category
var colors = chroma.scale('Set2').mode('lch').colors(2);

// 5. dynamically append style classes to this page using a JavaScript for loop. These style classes will be used for colorizing the markers.
for (i = 0; i < 9; i++) {
    $('head').append($("<style> .marker-color-" + (i + 1).toString() + " { color: " + colors[i] + "; font-size: 15px; text-shadow: 0 0 3px #ffffff;} </style>"));
}

// Get GeoJSON and put on it on the map when it loads
airports= L.geoJson.ajax("assets/airports.geojson", {

    // apply a function to each point
    // each feature will bind a popup window
    // each feature will have a style class based on its company


    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.AIRPT_NAME + "," + " Control Tower = " + feature.properties.CNTL_TWR);
    },

    // apply an icon to each marker
    pointToLayer: function (feature, latlng) {
        var id = 0;
        if (feature.properties.CNTL_TWR == "Y") { id = 0; }
        else { id = 1; } // CTNL_TWR == "N"

        return L.marker(latlng, {icon: L.divIcon({className: 'fa fa-plane marker-color-' + (id + 1).toString() })});
    },
    // credit the data
    attribution: 'Airport Data &copy; <a href="http://data.gov">data.gov</a> | State Boundaries &copy; <a href = "https://bost.ocks.org/mike/">Mike Bostock</a>, <a href = "https://d3js.org/">D3</a> | Made By Lila Leatherman'
});
// Add the cellTowers to the map.
airports.addTo(mymap);


// create the county layer - initial
//L.geoJson.ajax("assets/us-states.geojson").addTo(mymap);

// 6. Set function for color ramp
colors = chroma.scale('BuPu').colors(5);

function setColor(density) {
    var id = 0;
    if (density > 18) { id = 4; }
    else if (density > 13 && density <= 18) { id = 3; }
    else if (density > 10 && density <= 13) { id = 2; }
    else if (density > 5 &&  density <= 10) { id = 1; }
    else  { id = 0; }
    return colors[id];
}


// 7. Set style function that sets fill color.md property equal to cell tower density
function style(feature) {
    return {
        fillColor: setColor(feature.properties.count),
        fillOpacity: 0.4,
        weight: 2,
        opacity: 1,
        color: '#b4b4b4',
        dashArray: '4'
    };
}
// 8. Add state polygons
var states = null;
states = L.geoJson.ajax("assets/us-states.geojson", {
    style: style
}).addTo(mymap);



//CREATING A LEGEND

// 9. Create Leaflet Control Object for Legend
var legend = L.control({position: 'topright'});

// 10. Function that runs when legend is added to map
legend.onAdd = function () {

    // Create Div Element and Populate it with HTML
    var div = L.DomUtil.create('div', 'legend');
    div.innerHTML += '<b># Airports</b><br />';
    div.innerHTML += '<i style="background: ' + colors[4] + '; opacity: 0.5"></i><p>19+</p>';
    div.innerHTML += '<i style="background: ' + colors[3] + '; opacity: 0.5"></i><p>14-18</p>';
    div.innerHTML += '<i style="background: ' + colors[2] + '; opacity: 0.5"></i><p>11-13</p>';
    div.innerHTML += '<i style="background: ' + colors[1] + '; opacity: 0.5"></i><p> 6-10</p>';
    div.innerHTML += '<i style="background: ' + colors[0] + '; opacity: 0.5"></i><p> 0- 5</p>';
    div.innerHTML += '<hr><b>Control Tower?<b><br />';
    div.innerHTML += '<i class="fa fa-signal marker-color-1"></i><p> Control Tower</p>';
    div.innerHTML += '<i class="fa fa-signal marker-color-2"></i><p> No Control Tower</p>';

    // Return the Legend div containing the HTML content
    return div;
};

// 11. Add a legend to map
legend.addTo(mymap);

// 12. Add a scale bar to map
L.control.scale({position: 'bottomleft'}).addTo(mymap)


// 13. Add a latlng graticules.
L.latlngGraticule({
    showLabel: true,
    opacity: 0.2,
    color: "#747474",
    zoomInterval: [
        {start: 2, end: 7, interval: 2},
        {start: 8, end: 11, interval: 0.5}
    ]
}).addTo(mymap);


// 14. This is core of how Labelgun works. We must provide two functions, one
// that hides our labels, another that shows the labels. These are essentially
// callbacks that labelgun uses to actually show and hide our labels
// In this instance we set the labels opacity to 0 and 1 respectively.
var hideLabel = function(label){ label.labelObject.style.opacity = 0;};
var showLabel = function(label){ label.labelObject.style.opacity = 1;};
var labelEngine = new labelgun.default(hideLabel, showLabel);
var labels = [];

// 15. Create a label for each county.
var counties = null;
counties = L.geoJson.ajax("assets/us-states.geojson", {
    style: style,
    onEachFeature: function (feature, label) {
        label.bindTooltip(feature.properties.name, {className: 'feature-label', permanent:true, direction: 'center'});
        labels.push(label);
    }
}).addTo(mymap);


function addLabel(layer, id) {
    // This is ugly but there is no getContainer method on the tooltip :(
    var label = layer.getTooltip()._source._tooltip._container;
    if (label) {
        // We need the bounding rectangle of the label itself
        var rect = label.getBoundingClientRect();

        // We convert the container coordinates (screen space) to Lat/lng
        var bottomLeft = mymap.containerPointToLatLng([rect.left, rect.bottom]);
        var topRight = mymap.containerPointToLatLng([rect.right, rect.top]);
        var boundingBox = {
            bottomLeft : [bottomLeft.lng, bottomLeft.lat],
            topRight   : [topRight.lng, topRight.lat]
        };

        // Ingest the label into labelgun itself
        labelEngine.ingestLabel(
            boundingBox,
            id,
            parseInt(Math.random() * (5 - 1) + 1), // Weight
            label,
            label.innerText,
            false
        );

        // If the label hasn't been added to the map already
        // add it and set the added flag to true
        if (!layer.added) {
            layer.addTo(mymap);
            layer.added = true;
        }
    }

}


mymap.on("zoomend", function(){
    var i = 0;
    counties.eachLayer(function(label){
        addLabel(label, ++i);
    });
    labelEngine.update();
});


// 18. define the coordinate reference system (CRS)
mycrs = new L.Proj.CRS('SR-ORG:7271',
    '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 +y_0=0 +ellps=clrk66 +units=m +no_defs',
    {
        resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1] // example zoom level resolutions
    }
);

// apply custom projection - CONUS NAD27 Albers Equal Area
// to apply this, I commented out the scale bar and the base map.
var mymap = L.map('map', {
    crs: mycrs, // 19. assign the custom crs to the crs option. change the zoom levels due to the change of projection.
    center: [39.105249,-96.6091464],
    zoom: 3, // we choose zoom level 3
    maxZoom: 10,
    minZoom: 3,
    detectRetina: true});