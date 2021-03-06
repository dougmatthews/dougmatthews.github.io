window.console = window.console || {};
window.console.log = window.console.log || function() {};
window.console.warn = window.console.warn || function() {};

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

MST = window.MST || {};
MST.Model = window.MST.Model || {};
MST.View = window.MST.View || {};
MST.Collection = window.MST.Collection || {};

$(document).ready(function() {
	MST.ENV.App = new MST.Model.App();
});

MST.Model.App = Backbone.Model.extend({
	initialize : function(args) {
		var $this = this;
		$this.set("paygradeMap", JSON.parse('{"2":"E-1","3":"E-2","4":"E-3","5":"E-4","6":"E-5","7":"E-6","8":"E-7","9":"E-8","10":"E-9","11":"E-10","12":"W-1","13":"W-2","14":"W-3","15":"W-4","16":"W-5","17":"O-1","18":"O-2","19":"O-3","20":"O-4","21":"O-5","22":"O-6","23":"O-7","24":"O-8","25":"O-9","26":"O-10"}'));
		$this.set("initialized", true);
		Backbone.trigger('appReady');
		console.log("App:initialize, step #1, this is normally a REST api call to load these properties, but for this demo it's not necessary");
	},
	isInitialized : function() {
		return this.get("initialized") === true;
	},
	getPaygradeMap : function() {
		return this.get("paygradeMap");
	},
	getDisplayName : function() {
		return "BP USA";
	},
	getAppId : function() {
		return MST.ENV.Id?MST.ENV.Id:5000081;
	},
	getJobURLFormat : function() {
		return "https://jobs.military.com/jobview/GetJob.aspx?JobID={0}&intcid=MST";
	},
	isUseJobUrlFromJobData : function() {
		return true;
	},
	isUseRefCodeForJobUrl : function() {
		return true;
	},
	getNumOfJobsPerDesktopPage : function() {
		return 20;
	},
	getNumOfJobsPerMobilePage : function() {
		return 5;
	},
	getMaxJobDescriptionCharsBeforeCutoff : function() {
		return 300;
	},
	getJobEmptyMessage : function(key) {
		return "<p class='mst-empty'>There are currently no job openings that match your profile. Broaden your matches by adding/editing your military experience.</p>";
	},
	getOverrideScripts : function() {
		return null;
	},
	getBackButtonText : function() {
		return null;
	}
});

MST.Model.Profile = Backbone.Model.extend({
	initialize: function(obj) {
		var $this = this;
		var mosList = new MST.Collection.MOS();
		this.set("mosList", mosList);
		
		$this.set("refineSectionDirty", false);
		$this.set("translationInProgress", false);
		$this.set("location", "");
		$this.set("keyword", "");
		$this.set("sortBy", "relevance");
		$this.set("isAsc", true);
		$this.set("page", 0)

		if(MST.ENV.ServiceCode == null) {
		} else {
			$this.setService(MST.ENV.ServiceCode);
		}
  	},
  	markRefineSectionAsDirty : function() {
  		this.set("refineSectionDirty", true);
  	},
  	isRefineSectionDirty : function() {
  		return (this.get("refineSectionDirty") === true);
  	},
  	unsetRefineSectionDirty : function() {
  		this.set("refineSectionDirty", false);
  	},
  	markTranslationInProgress : function() {
  		this.set("translationInProgress", true);
  	},
  	isTranslationInProgress : function() {
  		return (this.get("translationInProgress") === true);
  	},
  	resetJobData : function() {
		var $this = this;
	},
  	initProfile : function() {
  	},
  	hasMOSes : function() {
  		return (this.getMOSes().length > 0);
  	},
  	clearMOSes : function() {
  		if(this.getMOSes().length > 0) {
  			// guaranteed to only be 1
  			this.getMOSes().remove(this.getMOSes().at(0));
  		}
  	},
  	getSubspecialtyIDs : function() {
  		var entityIds = []
  		var entityIds = $.map(this.getSelectedSubspecialties(), function(element, index) {
  			return element.id;
  		});
  		return entityIds;
  	},
  	getSelectedSubspecialties : function() {
  		var entities = {};
  		var arrays = this.getMOSes().map(function(e) { return e.getSelectedSubspecialties()});
  		$.each(arrays, function(idx, val) {
  			$.extend(entities, val);
  		});
  		var array = [];
  		$.each(entities, function(idx, val) {
  			array.push(val);
  		});
  		array.sort(function(a, b) {
  			return a.title.localeCompare(b.title);
  		});
  		return array;
  	},
  	getSelectedTrainings : function() {
  		var entityIds = [];
  		var trainings = [];
  		var arrays = this.getMOSes().map(function(e) { return e.getSelectedTrainings()});
  		$.each(arrays, function(idx, val) {
  			if (val && ("object" == typeof val)) {
  				$.each(val, function(idx, t) {
  					if (t && t.id && $.inArray(t.id, entityIds) == -1) {
  		  				entityIds.push(t.id);
  						trainings.push(t);
  					}
  		  		});
  			} else if (val && val.id && $.inArray(val.id, entityIds) == -1) {
  				entityIds.push(val.id);
  				trainings.push(val);
  			}
  		});
  		return trainings;
  	},
  	getTrainingIDs : function() {
  		var entityIds = [];
  		var arrays = this.getMOSes().map(function(e) { return e.getSelectedTrainings()});
  		$.each(arrays, function(idx, val) {
  			if (val && ('object' == typeof val)) {
  				$.each(val, function(idx, t) {
  					if (t && t.id && $.inArray(t.id, entityIds) == -1) {
  		  				entityIds.push(t.id);
  					}
  		  		});
  			} else if (val && val.id && $.inArray(val.id, entityIds) == -1) {
  				entityIds.push(val.id);
  			}
  		});
  		return entityIds;
  	},
  	getMosIDs : function() {
  		return this.getMOSes().map(function(e) { return e.getId()});
  	},
  	getMOSes : function() {
  		return this.get("mosList");
  	},
  	getMOS : function(id) {
  		$id = id;
  		return this.getMOSes().find(function(m) {return (m.id==$id);});
  	},
  	onMosAdd : function(id) {
  		var $this = this;
  		id = parseInt(id);
		console.log("Profile:onMosAdd, step #4, make a REST api call for the MOS metadata.");
  		$.ajax({
			url : MST.ENV.APIURL + "/entity/mos/" + id,
			data : { deepCopy : true },
			dataType : "json",
			type: "GET",
			success : function(data) {
				var mos = new MST.Model.Profile.MOS(data);
				$this.getMOSes().reset();
				$this.getMOSes().add(mos);
			},
			error : function(xhr, textStatus, errorThrown) {
				MST.ENV.VIEW.error(xhr, textStatus, function() {
					$this.addMOS(id);
				});
			}
		});
  	},
  	setService : function(service) {
  		this.set("service", service);
  	},
  	getService : function() {
  		return this.get("service");
  	},
  	getLocation : function() {
  		var z = this.get("location");
  		return (z != null) ? z : "";
	},
	setLocation : function(location) {
		this.set("location", location);
	},
	getKeyword : function() {
		var k = this.get("keyword")
		return (k != null) ? k : "";
	},
	setKeyword : function(keyword) {
		this.set("keyword", keyword);
	},
	getOrder : function() {
		return this.get("sortBy");
	},
	isAsc : function() {
		return this.get("isAsc");
	},
	setPage : function(page) {
		this.set("page", page);
	},
	incrementPage : function() {
		var internalPage = this.get("page");
		internalPage += 1;
		this.set("page", internalPage);
	},
	resetPages : function() {
		this.setPage(0);
	},
	getRefineFormData : function() {
		var $this = this;
		var refineData = {};
		refineData[MST.ENV.Key] = {
			zipcode : $this.getLocation(),
			keyword : $this.getKeyword(),
			size : $this.getSize(),
			start : $this.getFrom(),
			order : $this.getOrder(),
			asc : $this.isAsc()
		};
		return refineData;
	},
	getDefaultAsc : function() {
		if(MST.Jobs && $.isFunction(MST.Jobs.getDefaultIsAsc)) {
			return MST.Jobs.getDefaultIsAsc();
		} else {
			return true;
		}
	},
	getSize : function() {
		return MST.ENV.App.getNumOfJobsPerDesktopPage();
	},
	getFrom : function() {
		var p = this.getPage();
		var s = this.getSize();
		return p*s;
	},
	getPage : function() {
		return this.get("page");
	},
	getTranslateToSkillsJobsData : function() {
		return {
			mosIds : this.getMosIDs(),
			subspecialtyIdList : this.getSubspecialtyIDs(),
			trainingIdList : this.getTrainingIDs(),
			customSkillIdList : [],
			tenantId : MST.ENV.App.getAppId(),
			filterData : this.getRefineFormData()
		};
	},
	getTranslateToJobsData : function() {
		return {
			mosIds : this.getMosIDs(),
			skillMatchWrappers : [], // legacy, send empty array
			tenantId : MST.ENV.App.getAppId(),
			filterData : this.getRefineFormData()
		};
	},
	getFilterData : function() {
		return {
			mosIds : this.getMosIDs(),
			tenantId : MST.ENV.App.getAppId(),
			filterData : this.getRefineFormData(),
			occupationMatchMap : {}, // legacy, send empty obj
			skillMatchWrappers : [] // legacy, send empty array
		};
	},
	translateToSkillsJobs : function() {
		var $this = this;
		this.markTranslationInProgress();
		var $this = this;
		var requestData = this.getTranslateToSkillsJobsData();

		MST.ENV.VIEW.abortXhr();
		var xhr = $.ajax({
			url : MST.ENV.APIURL + "/translation/translateToSkillsJobsAndOccupations",
			dataType : "json",
			contentType: "application/json",
			type: "POST",
			data : JSON.stringify(requestData),
			success : function(data) {
				$this.set("translationInProgress", false);
				$this.set("skillsJobsData", data);
				$this.trigger("skillsJobsDataSet");
			},
			error : function(xhr, textStatus, errorThrown) {
				var ignore = (textStatus == "abort");
				if(!ignore) { /* window.location changed */
					MST.ENV.VIEW.error(xhr, textStatus, function() {
						$this.translateToSkillsJobs();
					});
				}
			}
		});
		MST.ENV.VIEW.setXhr(xhr);
	},
	getSkillsJobsData : function() {
		return this.get("skillsJobsData");
	},
	translateToJobs : function() {
		var $this = this;
		this.markTranslationInProgress();
		var requestData = this.getTranslateToJobsData();
		MST.ENV.VIEW.abortXhr();
		this.resetPages();
		var xhr = $.ajax({
			url : MST.ENV.APIURL + "/translation/translateToJobsAndOccupations",
			dataType : "json",
			contentType: "application/json",
			type: "POST",
			data : JSON.stringify(requestData),
			success : function(data) {
				$this.set("translationInProgress", false);
				$this.set("jobsData", data);
				$this.trigger("jobsDataSet");
			},
			error : function(xhr, textStatus, errorThrown) {
				var ignore = (textStatus == "abort");
				if(!ignore) { /* window.location changed */
					MST.ENV.VIEW.error(xhr, textStatus, function() {
						$this.translateToJobs();
					});
				}
			}
		});
		MST.ENV.VIEW.setXhr(xhr);
	},
	getJobsData : function() {
		return this.get("jobsData");
	},
	refineJobs : function() {
		var $this = this;
		this.markTranslationInProgress();
		var requestData = this.getFilterData();

		MST.ENV.VIEW.abortXhr();
		var xhr = $.ajax({
			url : MST.ENV.APIURL + "/translation/refineJobSearch",
			dataType : "json",
			contentType: "application/json",
			type: "POST",
			data : JSON.stringify(requestData),
			success : function(data) {
				$this.set("translationInProgress", false);
				$this.set("refineData", data);
				$this.trigger("refineDataSet");
			},
			error : function(xhr, textStatus, errorThrown) {
				var ignore = (textStatus == "abort");
				if(!ignore) { /* window.location changed */
					MST.ENV.VIEW.error(xhr, textStatus, function() {
						$this.refineJobs();
					});
				}
			}
		});
		MST.ENV.VIEW.setXhr(xhr);
	},
	getRefineData : function() {
		return this.get("refineData");
	}
});

MST.Model.Profile.AbstractEntity = Backbone.Model.extend({
	initialize: function() {
  	},
  	getId : function() {
  		return this.get("id");
  	},
  	getName : function() {
  		return this.get("name");
  	},
});

MST.Model.Profile.AbstractBase = MST.Model.Profile.AbstractEntity.extend({
	initialize: function() {
		
  	},
	getDescription : function() {
  		return this.get("description");
  	}
});

MST.Model.Profile.AbstractSkilled = MST.Model.Profile.AbstractBase.extend({
	initialize: function() {
		
  	}
});

MST.Model.Profile.SkillMatch = MST.Model.Profile.AbstractEntity.extend({
	skill : null,
	skillMatchRefs : null,
	initialize: function(args) {
		this.skill = new MST.Model.Profile.Skill(args.skill);
		this.skillMatchRefs = args.skillMatchRefs  || [];
	},
	getSkill : function() {
		return this.skill;
	},
	getSkillMatchRefs : function() {
		return this.skillMatchRefs;
	}
});

MST.Model.Profile.Skill = MST.Model.Profile.AbstractBase.extend({
	initialize: function() {
		
  	}
});

MST.Model.Profile.MOS = MST.Model.Profile.AbstractSkilled.extend({
	initialize: function() {
		this.set("isDutyDescriptionEmpty", false);
		this.setSelectedSubspecialties({});
  	},
  	getAutocompleteString : function() {
  		return this.getMosCode() + " " + this.getTitle() + " (" + this.getServiceName() + " - " +  this.getRankTitle() + ")";
  	},
  	getMosCode : function() {
  		return this.get("mosCode");
  	},
  	getServiceName : function() {
	  	return this.get("militaryServiceName");
  	},
  	getRankTitle : function() {
  		return this.get("rankTitle");
  	},
  	getRankName : function() {
  		return this.get("rankName");
  	},
  	setPaygrade : function(arg) {
  	  	this.set("payGrade", arg)
  	},
  	getPaygrade : function() {
  		return this.get("payGrade");
  	},
  	getTitle : function() {
  		return this.get("mosTitle");
  	},
  	setSelectedSubspecialties : function(arg) {
  		this.set("selectedSubspecialties", arg);
  	},
  	setSelectedTrainings : function(arg) {
  		this.set("selectedTrainings", arg);
  	},
  	getSelectedTrainings : function() {
  		return this.get("selectedTrainings");
  	},
  	getSelectedSubspecialties : function() {
  		return this.get("selectedSubspecialties");
  	},
  	getSubspecialties : function() {
  		return this.get("subspecialties");
  	},
  	addSelectedTraining : function(t) {
  		if (t && t.id) {
  	  		var obj = this.getSelectedTrainings();
  	  		if (!obj) {obj={};}
  	  		obj[t.id]=t;
  	  		this.setSelectedTrainings(obj);
  	  		return true;
  		}
  		return false;
  	},
  	removeSelectedTraining : function(t) {
  		if (t && t.id) {
  	  		var obj = this.getSelectedTrainings();
  	  		if (obj && obj[t.id]) {
  	  	  		delete obj[t.id];
  	  	  		return true;
  	  		}
  		}
  		return false;
  	},
  	getTrainings : function() {
  		return this.get("trainings");
  	}
});

MST.Collection.MOS = Backbone.Collection.extend({
	model : MST.Model.Profile.MOS,
	initialize: function() {
		this.on("add", function(mos) {
			try {
			} catch (e) {}
		});
	}
});

MST.Model.Profile.Job = MST.Model.Profile.AbstractBase.extend({
	job : null,
	initialize: function() {
  	},
  	getId : function() {
  		return this.get("jobId")
  	},
  	getJobURL : function() {
  		var href;
  		if(parseBoolean(MST.ENV.App.isUseJobUrlFromJobData()) && !$.isNullorUndefined(this.get("url"))) {
  			href = this.get("url");
  		} else {
  	  		var $format = MST.ENV.App.getJobURLFormat();
  	  		var useRefCode = parseBoolean(MST.ENV.App.isUseRefCodeForJobUrl());
  	  		if (useRefCode) {
  	  	  		$format = ($format != null && $format != undefined) ? $format : "https://www.military.com/jobView/{0}-{1}-id-core-{2}?page_index=1";
  	  	  		var title = ($.trim(this.getTitle()).length > 0) ? this.getTitle().replace(/[.,\/#!$%\^&\*;:{}=_`~()\s]/g, '-') : "";
  	  	  		var loc = ($.trim(this.getLocation()).length > 0) ? this.getLocation().replace(/[.,\/#!$%\^&\*;:{}=_`~()\s]/g, '-') : "";
  	  	  		href = $format.format(title,loc,this.getRefCode());
  	  	  		href = href.toLowerCase();
  	  		} else {
  	  	  		$format = ($format != null && $format != undefined) ? $format : "http://jobview.military.monster.com/getjob.aspx?jobid={0}";
    	  		href = $format.format(this.getId());
  	  		}
  		}
  		return href;
  	},
  	getTitle : function() {
  		return this.getJobTitle();
  	},
  	getURL : function() {
  		return this.getJobURL();
  	},
  	getJobTitle : function() {
  		return this.get("jobTitle");
  	},
  	getRefCode : function() {
  		return this.get("refCode");
  	},
  	getAgency : function() {
  		return this.get("agency");
  	},
  	getLocation : function() {
  		return this.get("location");
  	},
  	getCompanyName : function() {
  		return this.get("companyName");
  	},
  	getDatePosted : function() {
  		return this.get("datePosted");
  	},
  	getSummary : function() { 
  		return this.get("summary");
  	}
});