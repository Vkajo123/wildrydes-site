/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};
let map;

// Request Unicorn
function requestUnicorn(pickupLocation) {
    $.ajax({
        method: 'POST',
        url: _config.api.invokeUrl + '/ride',
        headers: {
            Authorization: authToken
        },
        data: JSON.stringify({
            PickupLocation: {
                Latitude: pickupLocation.latitude,
                Longitude: pickupLocation.longitude
            }
        }),
        contentType: 'application/json',
        success: result => completeRequest(result, pickupLocation),
        error: function ajaxError(jqXHR, textStatus, errorThrown) {
            console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
            console.error('Response: ', jqXHR.responseText);
            alert('An error occurred when requesting your unicorn:\n' + jqXHR.responseText);
        }
    });
}

// Complete Request
function completeRequest(result, pickupLocation) {
    var unicorn;
    var pronoun;

    console.log('Response received from API: ', result);
    unicorn = result.Unicorn;
    pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
    displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.', unicorn.Color);

    // Animate unicorn's arrival
    animateArrival(function animateCallback() {
        displayUpdate(unicorn.Name + ' has arrived. Giddy up!', unicorn.Color);
        WildRydes.map.unsetLocation();

        $('#request').prop('disabled', 'disabled');
        $('#request').text('Set Pickup');
    });
}

// Register click handler for #request button
$(function onDocReady() {
    $('#request').click(handleRequestClick);

    WildRydes.authToken.then(function updateAuthMessage(token) {
        if (token) {
            displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
            $('.authToken').text(token);
        }
    });

    if (!_config.api.invokeUrl) {
        $('#noApiMessage').show();
    }

    // Get user's current location
    window.navigator.geolocation
        .getCurrentPosition(setLocation);

    // Function to set user's location on the map
    function setLocation(loc) {
        map = L.map('map').setView([loc.coords.latitude, loc.coords.longitude], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Store user's location in WildRydes object
        WildRydes.map.center = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        
        // Add marker for user's location
        WildRydes.marker = L.marker([loc.coords.latitude, loc.coords.longitude]).addTo(map);

        var myIcon = L.icon({
    iconUrl: 'images/unicorn-icon.png',
    iconSize: [25, 25],
    iconAnchor: [22, 24],
    shadowSize: [25, 25],
    shadowAnchor: [22, 24]
});
WildRydes.unicorn = L.marker([loc.coords.latitude, loc.coords.longitude], { icon: myIcon }).addTo(map);

        // Add event listener for map clicks
        map.on('click', onMapClick);

        // Call function to put map behind the updates list
        document.getElementById("map").style.zIndex = "10";
    }

    // Function to handle map clicks
    function onMapClick(e) {
        WildRydes.map.selectedPoint = { longitude: e.latlng.lng, latitude: e.latlng.lat };
        if (WildRydes.marker) WildRydes.marker.remove();
        handlePickupChanged();

        // Add marker at clicked location
        WildRydes.marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
    }
});

// Handle Pickup Changed
function handlePickupChanged() {
    var requestButton = $('#request');
    requestButton.text('Request Unicorn');
    requestButton.prop('disabled', false);
}

// Handle Request Click
function handleRequestClick(event) {
    var pickupLocation = WildRydes.map.selectedPoint;

    event.preventDefault();
    requestUnicorn(pickupLocation);
}

// Animate Arrival
function animateArrival(callback) {
    var dest = WildRydes.map.selectedPoint;
    var origin = {};

    if (dest.latitude > WildRydes.map.center.latitude) {
        origin.latitude = WildRydes.map.center.latitude - 0.1; // Adjust origin latitude for demonstration
    } else {
        origin.latitude = WildRydes.map.center.latitude + 0.1; // Adjust origin latitude for demonstration
    }

    if (dest.longitude > WildRydes.map.center.longitude) {
        origin.longitude = WildRydes.map.center.longitude - 0.1; // Adjust origin longitude for demonstration
    } else {
        origin.longitude = WildRydes.map.center.longitude + 0.1; // Adjust origin longitude for demonstration
    }

    // Simulate animation with setTimeout
    setTimeout(callback, 3000); // Adjust timeout for demonstration
}

// Display Update
function displayUpdate(text, color = 'green') {
    $('#updates').prepend($(`<li style="background-color:${color}">${text}</li>`));
}

// Function to add markers for points of interest
function addMarkersForPointsOfInterest(pointsOfInterest) {
    pointsOfInterest.forEach(function(point) {
        L.marker([point.latitude, point.longitude]).addTo(map)
            .bindPopup(point.name);
    });
}
