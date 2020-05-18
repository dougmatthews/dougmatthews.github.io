window.console = window.console || {};
window.console.log = window.console.log || function() {};
window.console.warn = window.console.warn || function() {};

MST = window.MST || {};
MST.Model = window.MST.Model || {};
MST.View = window.MST.View || {};

_.templateSettings = {
	    interpolate: /\{\{(.+?)\}\}/g
};

var EmptyHeaderCell = Backgrid.HeaderCell.extend({
	  render: function () {this.$el.empty();return this;}
});
var columns = [{
    name: "jobTitle",
    label: "",
    editable: false,
    headerCell: EmptyHeaderCell,
    cell: Backgrid.StringCell.extend({
      render: function () {
    		this.$el.empty();
    	    var model = this.model;
    	    var title = this.model.getJobTitle();
    	    var location = this.model.getLocation();
    	    var companyName = this.model.getCompanyName();
    	    var url = this.model.getJobURL();
    	    
    	    var intcid = $.isFunction(MST.getIntCidParam) ? MST.getIntCidParam() : null;
    	    
    	    if(intcid != null && url != null && url != undefined) {
    	    	/* append question mark if doesnt exist */
    	    	if(url.indexOf("?") == -1) {
    	    		url += "?";
    	    	} else { /* otherwise, there are already parameters on this URL */
    	    		url += "&";
    	    	}
    	    	
    	    	/* append the required param */
    	    	url += "intcid=" + intcid;
    	    }
    	    var container = $('<div>').addClass('container');
    	    var row1 = $('<div>').addClass('row');
    	    var e1 = $("<a>").text(title).attr("id", "job-" + this.model.getId()).attr('href',url).addClass('jobLink').attr('target', '_blank').click(function() {
	    		var $link = $(this);
				var $linkObj = {
					url : $(this).attr("href"),
					title : $(this).text(),
					getURL : function() {
						return this.url;
					},
					getTitle : function() {
						return this.title;
					}
				};
    	    });
    	    var p1 = $("<p>");
    	    p1.addClass("mst-job").append(e1);
    	    row1.append(p1);
    	    var row2 = $('<div>').addClass('row');
    	    var e2 = $("<span>").text(companyName).addClass('company');
    	    var e3 = $("<span>").text(location).addClass('location');
    	    var p2 = $("<p>");
    	    p2.append(e2);
    	    p2.append(e3);
    	    row2.append(p2);
    	    container.append(row1);
    	    container.append(row2);
    	    this.$el.append(container);
	  		this.delegateEvents();
	  		return this;
	  	}
  })
}];

	    	
$(document).ready(function() {
	$(".viewMore").click(function() {
		if (MST.ENV.Jobs) {
			MST.ENV.Jobs.increment();
		}
	});
	$(window).scroll(function(){
	    if ($(window).scrollTop() == $(document).height()-$(window).height()){
	    }
	});	
	Backbone.on('tenantReady', function () {

		var Jobs = Backbone.Model.extend({
		      parseData: function (data) {
		    	  var jobResults = (data && data.jobResults) ? data.jobResults : data;
		    	  if (jobResults) {
		    		  var jobSourceId;
		    		  if (_.isArray(_.keys(jobResults)) && (1 == _.keys(jobResults).length)) {
		    			  jobSourceId = _.keys(jobResults)[0];
		    		  }
			    	  var results = (jobResults[jobSourceId]) ? jobResults[jobSourceId].results : [];
			    	  results = ($.isArray(results)) ? results : [];
			    	  
			    	  var found = (jobResults[jobSourceId]) ? jobResults[jobSourceId].found : 0;
			    	  found = (!isNaN(parseInt(found))) ? parseInt(found) : 0;
			    	  
			    	  if(found > 0) {
			    	  	$("#mst-empty").hide();	
			    	  } else {
			    	  	$("#mst-empty").show().html(MST.ENV.TenantBean.getJobEmptyMessage());
			    	  }
		    	  	  var modelResults = [];
		    	  	  $.each(results, function(idx, result) {
		    	  	  	modelResults.push(new MST.Model.Profile.Job(result));
		    	  	  });
		    	  	
		    		  $("#resultsContainer").show();
		    		  $("#refineContainer").show();
		    		  //$("#searchContainer").hide();
		    		  
		    		  var page = MST.ENV.Profile.getPage();
		    		  var size = this.mCollection.state.pageSize;
		    		  var start = 1 + (page * size);
		    		  
			    	  var lastPage = Math.floor(found/size) - ((found % size) == 0 ? 1:0);

			    	  this.mCollection.state.totalRecords = found;
			    	  this.mCollection.state.lastPage = lastPage;
			    	  this.mCollection.add(modelResults);
			    	  
		    		  var end = (page * size) + modelResults.length;
		    		  $(".numTotal").text(found);
			    	  if ((0 < lastPage) && (page < lastPage)) {
			    		  $("#mPaginator").show();
			    	  } else {
			    		  $("#mPaginator").hide();
			    	  }

			  		  $("#dGrid").html(this.dGrid.render().$el);
			  		  $("#mGrid").html(this.mGrid.render().$el);
		    	  }
		      },
			increment : function () {
				MST.ENV.Profile.incrementPage();
				MST.ENV.Profile.refineJobs();
		    },
		    reset : function() {
		    	this.mCollection = new JobsCollection();
		    	this.mCollection.mode = "infinite";
		    	this.mCollection.state.pageSize = MST.ENV.pageSize;
	  		    this.dGrid = new Backgrid.Grid({
				  	  columns: columns,
				  	  collection: this.mCollection
			  	});
	  		    $("#dGrid").html("");
	  		    this.mGrid = new Backgrid.Grid({
				  	  columns: columns,
				  	  collection: this.mCollection
			  	});
	  		    $("#mGrid").html("");
		    },
			initialize : function(args) {
				var $this = this;
		    	this.reset();
	  		    
				this.listenTo(MST.ENV.Profile, "skillsJobsAndOccupationDataSet", function() {
					var data = MST.ENV.Profile.getSkillsJobsAndOccupationData();
					this.reset();
					this.parseData(data);
				});
				
				this.listenTo(MST.ENV.Profile, "jobsAndOccupationDataSet", function() {
					//MST.ENV.Profile.resetPages();
					var data = MST.ENV.Profile.getJobsAndOccupationData();
					this.reset();
					this.parseData(data);
				});
				
				this.listenTo(MST.ENV.Profile, "refineDataSet", function() {
					var data = MST.ENV.Profile.getRefineData();
					var page = MST.ENV.Profile.getPage();
					if (0 == page) {
						this.reset();
					}
					this.parseData(data);
				});
			}
		  });
		var JobsCollection = Backbone.PageableCollection.extend({
			url : "",
			fetch : function (options) {
				if (options && (typeof options.to == 'number')) {
					MST.ENV.Profile.setPage(options.to);
					MST.ENV.Profile.refineJobs();
				}
		    },
		    state: {
		  	  firstPage: 0,
		  	  currentPage: 0
		    },
		    queryParams: {
		  	  currentPage: "page",
		  	  mosId: function () {return $( "#mosId" ).val()}
		    },
		    
		    parseRecords: function (resp, options) {
		    },
		    
		    parseState: function (resp, queryParams, state, options) {
		    }
		  });

		MST.ENV.Jobs = new Jobs();
	});
});

$.ajaxSetup({
	beforeSend : function(args) {
		if (this.url.indexOf('translation')>-1) {
			$(".glyphicon-refresh").css("display", "inline");
		}
	},
	complete : function(args) {
		if (this.url.indexOf('translation')>-1) {
			$(".glyphicon-refresh").hide();
		}
	}
});