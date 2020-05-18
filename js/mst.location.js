// can be overridden
MST.View.OVERRIDE.bindAutocomplete = function() {
	/**
	 * http://stackoverflow.com/questions/9972080/cant-tap-on-item-in-google-autocomplete-list-on-mobile
	 * fastclick, which *may* be included by Tenants (i.e. Military.com) breaks Google Autocomplete on mobile
	 */
	$(document).on({
		'DOMNodeInserted': function() {
    		$('.pac-item, .pac-item span', this).addClass('needsclick');
		}
	}, '.pac-container');
	
	var input = (document.getElementById('locationAutocomplete'));
	var options = {types: ['(regions)'],componentRestrictions: {country: 'us'}};
	var autocomplete = new google.maps.places.Autocomplete(input, options);
	autocomplete.addListener('place_changed', function() {
		$("#location").text('');
		var place = autocomplete.getPlace();
		//console.log(place);
		var locality;
		var state;
		$.each(place.address_components, function(idx, addr) {
			if($.isArray(addr.types)) {
				if ('locality' == addr.types[0]) {
					locality = addr.long_name;
				}
				if ('administrative_area_level_1' == addr.types[0]) {
					state = addr.long_name;
				}
			}
		});
		
		var validPlace = false;
		if (locality && state) {
			$("#location").text(locality + ', ' + state);
			validPlace = true;
		} else if (locality) {
			$("#location").text(locality);
			validPlace = true;
		} else if (state) {
			$("#location").text(state);
			validPlace = true;
		}
		
		if(validPlace) {
			Backbone.trigger("placeChange");
		}
	});
}