window.console = window.console || {};
window.console.log = window.console.log || function() {};
window.console.warn = window.console.warn || function() {};

MST = window.MST || {};
MST.Model = window.MST.Model || {};
MST.View = window.MST.View || {};

MST.View.AbstractView = Backbone.View.extend({
	initialize : function(args) {
	},
	getSpinner : function() {
		return this.$el.find(".panel-status");
	},
	showSpinner : function() {
		this.getSpinner().show();
	},
	hideSpinner : function() {
		this.getSpinner().hide();
	}
});

MST.View.Panel = MST.View.AbstractView.extend({
	initialize : function(args) {
	},
	render : function() {
	}
});

MST.View.Location = MST.View.AbstractView.extend({
	el : "#locationSection",
	inputSelector : "#locationAutocomplete",
	initialize : function(args) {
		var $this = this;
		var input = (document.getElementById('locationAutocomplete'));
//		var options = {
//			types: ['geocode','(cities)'],
//			componentRestrictions: {country: 'us'}
//		};

		// clear out value on empty input
		$(input).keyup(function() {
			if($(this).val() == "") {
				$("#location").text('');
				MST.ENV.Profile.markRefineSectionAsDirty();
			}
		});

		$(input).change(function() {
			if($(this).val() == "") {
				$("#location").text('');
				$("#refineSearchBtn, #refineSearchBtnMobile").each(function() {
					if($(this).is(":visible")) {
						$(this).trigger("click");	
					}
				});
			}
		});	

		Backbone.on("placeChange", function() {
			MST.ENV.Profile.markRefineSectionAsDirty();
			$("#refineSearchBtn, #refineSearchBtnMobile").each(function() {
				if($(this).is(":visible")) {
					$(this).trigger("click");	
				}
			});
		});
	}
});

MST.View.AbstractMosFilterView = MST.View.Panel.extend({
	initialSelectionMade : false,
	MIN_AUTOCOMPLETE_LENGTH : 1,
	initialize : function(args) {
		var $this = this;
		this.autocomplete();
	},
	render : function() {
		return this;
	},
	getMinAutocompleteLength : function() {
		return this.MIN_AUTOCOMPLETE_LENGTH;
	},
	autocomplete : function() {
		var $this = this;
		$($this.inputSelector).autocomplete({
			delay: 50,
			appendTo: $($this.inputSelector).next(),
			minLength: $this.MIN_AUTOCOMPLETE_LENGTH,
			source: function( request, response ) {
				var params = {from: 0,size: 10,paygradeId: -1, includeDescription: false, service: $($this.serviceSelect).val(), searchTerm: request.term};
				MST.ENV.VIEW.abortXhr();
				console.log("AbstractMosFilterView:autocomplete, step #2, user is selecting a MOS.");
				var xhr = $.getJSON(MST.ENV.APIURL + "/entity/mos", params,
					function(data) {
						data.beanList = $.isArray(data.beanList) ? data.beanList : [];
				    	  var items = Array.prototype.slice.call(data.beanList).map(
		    	    		function(bean) {
		    	    			var item = {};
		    	    			item.label = bean['name'];
		    	    			item.id = bean.id;
		    	    			item.mosCode = bean.mosCode;
		    	    			item.mosTitle = bean.mosTitle;
		    	    			item.value = bean['name'];
		    	    			item.service = bean['militaryServiceCode'];
		    	    			return item;
		    	    		}
				    	  );
						response(items);
					}
				);
				MST.ENV.VIEW.setXhr(xhr);
			},
			focus: function(event, ui) {

			},
			select: function(event, ui) {
				$this.initialSelectionMade = true;
				$($this.inputSelector).parent().removeClass("has-error");
				$this.showSpinner();
				console.log("AbstractMosFilterView:select, step #3, user has selected a MOS, add this to the profile.");
				MST.ENV.Profile.onMosAdd(ui.item.id);
			}
		});
		return this;
	}
});

MST.View.MOS = window.MST.View.MOS || {};
MST.View.MOS.Empty = MST.View.AbstractMosFilterView.extend({
	serviceSelect : "#service",
	inputSelector : "#query",
	el : "#searchContainer",
	searchBtn : "#searchBtn",
	initialize : function(args) {
		var $this = this;
		
		$($this.searchBtn).click(function() {
			if(!$this.initialSelectionMade) {
				$($this.inputSelector).parent().addClass("has-error");
			}
		});
		
		$($this.inputSelector).keyup(function(e) {
			isEnterClickSelection = (e != null && e.keyCode != null && e.keyCode != undefined && e.keyCode == 13) ? true : false;
			if(isEnterClickSelection) {
				setTimeout(function() {
					$($this.searchBtn).trigger("click");
				}, 350);
			}
		});
		
		this.listenTo(MST.ENV.Profile, "change:skillsJobsData", function(profile) {
			if($($this.inputSelector).length > 0) {
				$("#queryRefine").val($($this.inputSelector).val());
			}
			$("[data-remove-on-mos-add]").remove();
			$("#searchContainer").addClass("hidden-sm-down"); /* hide on mobile from now on */
			$($this.searchBtn).hide();
		});

		MST.View.AbstractMosFilterView.prototype.initialize.call(this);
	},
	render: function() {
		var $this = this;
		MST.View.AbstractMosFilterView.prototype.render.call(this);		
		return this;
	}
});

MST.View.AbstractPageView = MST.View.AbstractView.extend({
	xhr : null,
	mosView : null,
	
	abortXhr : function() {
		if(this.xhr != null) {
			this.xhr.abort();
		}
	},
	setXhr : function(xhr) {
		this.xhr = xhr;
	},
	initialize : function(args) {
		var $this = this;
		this.mosView = new MST.View.MOS.Empty();
		if(MST.ENV.App.isInitialized()) {
			$this.onReady();
		} else {
			this.listenTo(MST.ENV.App, "change:initialized", function() {
				$this.onReady();
			});
		}
	},
	onReady : function() {
		var $this = this;
	},
	onServiceChange : function() {
	}
});

$(document).ready(function() {
	if(MST.ENV.ServiceCode != null) {
		$("#service").val(MST.ENV.ServiceCode).trigger("change");
	}

	$("#service").selectmenu({
		change : function(event, ui) {
			MST.ENV.Profile.setService(ui.item.value);
			MST.ENV.VIEW.onServiceChange();
		}
	});

	/* plugin changes the 'for' tag of the label, which complicates 501 compliance */
	$("label[for='service-button']").attr("for", "service");

	/*
	 *  if the service is visible, that means that the selectmenu being used is jquery mobile specific 
	 */
	if(typeof($.mobile) === "object") {
		$("#service").change(function() {
			MST.ENV.Profile.setService($(this).val());
			MST.ENV.VIEW.onServiceChange();
		});
	}
});