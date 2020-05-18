window.console = window.console || {};
window.console.log = window.console.log || function() {};
window.console.warn = window.console.warn || function() {};

window.getUrlParameter = function(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

window.parseBoolean = function(test) {
	var retVal = false;
	if(test != null && test != undefined) {
		if(typeof(test) === 'boolean') {
			retVal = test;
		} else if(typeof(test) === 'string') {
			retVal = (test == "true");
		}
	}
	return retVal;
};

$.isNullorUndefined = function(arg) {
	return (arg == null || arg == undefined);
};

$.browser = {msie:false};

/* defined in later versions */
if(!$.isFunction(_.findIndex)) {
	console.log("Old version of underscore detected");
	_.findIndex = function(array, predicate) {
		var retval = -1;
		if($.isArray(array) && $.isFunction(predicate)) {
			$.each(array, function(idx, val) {
				if(predicate(val)) {
					retval = idx;
				}
			});
		}
		return retval;
	}
};

window.console = window.console || {};
window.console.log = window.console.log || function() {};
window.trackingCallback = [];

String.prototype.format = function() {
    var s = this,
    i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

MSTP = window.MSTP || {};

MSTP.SkillMatch = {
	/* returns a plain javascript object representing a skill match */
	/* NOT prototyped since this is meant to be sent to the server */
	newInstance : function(id, name) {
		var obj = {};
		obj.isCustom = true;
		obj.skillMatch = {};
		obj.skillMatch.id = null;
		obj.skillMatch.skillMatchRefs = null;
		obj.skillMatch.skill = {};
		obj.skillMatch.skill.id = id;
		obj.skillMatch.skill.key = id;
		obj.skillMatch.skill.active = true;
		obj.skillMatch.skill.name = name;
		obj.skillMatch.skill.description = null;
		obj.skillMatch.skill.modifiedDateTime = null;
		obj.skillMatch.skill.skillReferences = null;
		obj.skillMatch.skill.sourceWeight = null;
		obj.skillMatch.skill.targetWeight = null;
		return obj;
	}
};

MSTP.SkillRepository = {
	_skillMatches : null,
	_deleteHistory : null,
	setData : function(skillMatches, deleteHistory) {
		this._skillMatches = skillMatches;
		this._deleteHistory = deleteHistory;
	},
	setSkillMatches : function(skillMatches, callback) {
		if(skillMatches != null && skillMatches != undefined && skillMatches.length) {
			this._skillMatches = skillMatches;
		} else {
			this._skillMatches = [];
		}

		if($.isFunction(callback)) {
			callback($.extend(true, [], this._skillMatches));
		}
		this._sort();
	},
	getSkillMatches : function() {
		var retVal = [];
		if(this._skillMatches != null && this._skillMatches != undefined && this._skillMatches.length) {
			retVal = $.extend(true, [], this._skillMatches);
		}
		return retVal;
	},
	getSkillIds : function() {
		var ids = [],i,cnt;
		if(this._skillMatches != null && this._skillMatches != undefined) {
			cnt = this._skillMatches.length;
			for(i = 0; i < cnt; i++) {
				var match = this._skillMatches[i];
				ids.push(match.skillMatch.skill.id);
			}
		}
		return ids;
	},
	isEmpty : function() {
		return (this._skillMatches == null || this._skillMatches == undefined ||
				this._skillMatches.length == null || this._skillMatches.length == undefined ||
				this._skillMatches.length == 0);
	},
	_sort : function() {
		if(this._skillMatches != null && this._skillMatches != undefined && this._skillMatches.length > 0) {
			this._skillMatches.sort(function(a, b) {
				return a.skillMatch.skill.name.localeCompare(b.skillMatch.skill.name);
			});
		}
	},
	deleteSkills : function(idList) {
		if(this._skillMatches != null && this._skillMatches != undefined) {
			idList = (idList != null && idList != undefined) ? ((typeof(idList) === 'number') ? [idList] : idList) : [];
			for(var i = 0; i < idList.length; i++) {
				var id = idList[i];
				for(var j = 0; j < this._skillMatches.length; j++) {
					var match = this._skillMatches[j];
					if(match.skillMatch.skill.id == id) {
						this._skillMatches.splice(j, 1);
						if(match.isCustom) {
							//this._pushDeleteHistory(match);
							this._purgeSkillFromHistory(id);
						} else {
							this._pushDeleteHistory(match);
						}
						break;
					}
				}
			}
		}
	},
	addCustomSkills : function(skillMatchCollection, callback) {
		if(this._skillMatches == null || this._skillMatches == undefined) {
			this._skillMatches = [];
		}

		for(var i = 0; i < skillMatchCollection.length; i++) {
			var exists = false;
			var candidate = skillMatchCollection[i];
			for(var j = 0; j < this._skillMatches.length; j++) {
				var match = this._skillMatches[j];
				if(match.skillMatch.skill.id == candidate.skillMatch.skill.id) {
					match.isCustom = true;
					match.skillMatch.skillMatchRefs = [];
					this._purgeSkillFromHistory(candidate.skillMatch.skill.id);
					exists = true;
				}
			}

			if(!exists) {
				this._skillMatches.push(candidate);
				this._purgeSkillFromHistory(candidate.skillMatch.skill.id);
			}
		}
		if($.isFunction(callback)) {
			callback($.extend(true, [], this._skillMatches));
		}
		this._sort();
	},
	_pushDeleteHistory : function(match) {
		if(this._deleteHistory == null || this._deleteHistory == undefined) {
			this._deleteHistory = [];
		}

		var merged = false;
		for(var i = 0; i < this._deleteHistory.length; i++) {
			if(this._deleteHistory[i].skillMatch.skill.id == match.skillMatch.skill.id) {
				merged = true;
				this._mergeSkillMatchRefs(this._deleteHistory[i].skillMatch.skillMatchRefs, match.skillMatch.skillMatchRefs);
			}
		}

		if(!merged) {
			this._deleteHistory.push(match);
		}
	},
	_mergeSkillMatchRefs : function(to, from) {
		if(to != null && to != undefined && to.length != null && to.length != undefined) {
			if(from != null && from != undefined && from.length != null && from.length != undefined) {
				var itemsToMerge = [];
				for(var j = 0; j < from.length; j++) {
					var exists = false;
					for(var i = 0; i < to.length; i++) {
						if(from[j].referenceId == to[i].referenceId && from[j].referenceType == to[i].referenceType) {
							exists = true;
							break;
						}
					}

					if(!exists) {
						to.push(from[j]);
					}
				}
			}
		}
	},
	/*
	purgePaygradeHistory : function() {
		for(var i in MSTP.ENV.paygradeLookupMap) {
			this._purgeHistory(parseInt(i), "PAY");
		}
	},
	purgeMosHistory : function(idArray) {
		this._purgeHistory(idArray, "MOS");
	},
	purgeTrainingHistory : function(idArray) {
		this._purgeHistory(idArray, "TRN");
	},
	purgeSubspecialtyHistory : function(idArray) {
		this._purgeHistory(idArray, "SUB");
	},
	purgeExperienceHistory : function(idArray) {
		this._purgeHistory(idArray, "OCC");
	},
	*/
	_purgeSkillFromHistory : function(id) {
		var that = this;
		if(this._deleteHistory != null || this._deleteHistory != undefined) {
			var indeciesToPurge = [];
			for(var i = 0; i < this._deleteHistory.length; i++) {
				var val = this._deleteHistory[i];
				if(val.skillMatch.skill.id == id) {
					indeciesToPurge.push(i);
				}
			}

			if(indeciesToPurge.length > 0) {
				for(var i = indeciesToPurge.length - 1; i >= 0; i--) {
					this._deleteHistory.splice(indeciesToPurge[i], 1);
				}
			}
		}
	},
	_purgeHistory : function(referenceIds, referenceType) {
		referenceIds = (referenceIds != null && referenceIds != undefined) ? ((typeof(referenceIds) === 'number') ? [referenceIds] : referenceIds) : [];
		if(this._deleteHistory != null || this._deleteHistory != undefined) {
			var _skillMatchIndeciesToPurge = [];
			for(var i = 0; i < referenceIds.length; i++) {
				var referenceId = referenceIds[i];
				for(var j = 0; j < this._deleteHistory.length; j++) {
					if(!parseBoolean(this._deleteHistory[j].isCustom)) {
						var skillMatchRefs = this._deleteHistory[j].skillMatch.skillMatchRefs;
						if(skillMatchRefs == null || skillMatchRefs == undefined) {
							_skillMatchIndeciesToPurge.push(j);
						} else {
							var refIndeciesToPurge = [];
							for(var k = 0; k < skillMatchRefs.length; k++) {
								var skillMatch = skillMatchRefs[k];
								if(skillMatch.referenceType == referenceType && skillMatch.referenceId == referenceId) {
									refIndeciesToPurge.push(k);
								}
							}

							for(var k = refIndeciesToPurge.length - 1; k >= 0; k--) {
								skillMatchRefs.splice(refIndeciesToPurge[k], 1);
							}

							if(skillMatchRefs.length == 0) {
								_skillMatchIndeciesToPurge.push(j);
							}
						}
					}
				}
			}

			for(var i = _skillMatchIndeciesToPurge.length - 1; i >= 0; i--) {
				this._deleteHistory.splice(_skillMatchIndeciesToPurge[i], 1);
			}
		}
	},
	/*
	getSkillsForMos : function(id) {
		return this._getSkillsForEntity(id, "MOS");
	},
	getSkillsForTraining : function(id) {
		return this._getSkillsForEntity(id, "TRN");
	},
	getSkillsForSubspecialty : function(id) {
		return this._getSkillsForEntity(id, "SUB");
	},
	getSkillsForExperience : function(id) {
		return this._getSkillsForEntity(id, "OCC");
	},
	*/
	_getSkillsForEntity : function(id, refType) {
		var retVal = [];
		if(id != null && id != undefined) {
			id = parseInt(id);
			if(!isNaN(id)) {
				if(this._skillMatches != null && this._skillMatches != undefined) {
					for(var i = 0; i < this._skillMatches.length; i++) {
						var match = this._skillMatches[i];
						if(!parseBoolean(match.isCustom)) {
							var skillMatch = match.skillMatch;
							var matchRefs = skillMatch.skillMatchRefs;
							if(matchRefs != null && matchRefs != undefined && matchRefs.length) {
								for(var j = 0; j < matchRefs.length; j++) {
									var ref = matchRefs[j];
									if(ref.referenceId == id && ref.referenceType == refType) {
										retVal.push($.extend(true, {}, skillMatch.skill));
									}
								}
							}
						}
					}
				}
			}
		}
		return retVal;
	},
	getSkill2SourceMapping : function() {
		 var retVal = {};
		 if(this._skillMatches != null && this._skillMatches != undefined) {
		 	for(var i = 0; i < this._skillMatches.length; i++) {
		 		var skillMatchWrapper = this._skillMatches[i];
		 		if(skillMatchWrapper != null && skillMatchWrapper != undefined) {
		 			var skillMatch = skillMatchWrapper.skillMatch;
		 			if(skillMatch != null && skillMatch != undefined) {
		 				var skill = skillMatch.skill;
		 				var skillMatchRefs = null;
		 				if(!parseBoolean(skillMatchWrapper.isCustom)) {
		 					skillMatchRefs = skillMatch.skillMatchRefs;
		 					skillMatchRefs = (skillMatchRefs != null && skillMatchRefs != undefined && $.isArray(skillMatchRefs)) ? skillMatchRefs : [];
		 					retVal[skill.id] = $.extend(true, [], skillMatchRefs);
		 				} else {
		 					retVal[skill.id] = null;
						}
					}
				}
			}
		}
		return retVal;
	}
};

(function( $ ){
	var initialized = false;
	var mos2SubspecialtyMap = {};
	var mos2TrainingMap = {};

	var privateMethods = {
		getEvar11Value : function() {
			var suffix = (window.location.pathname.toLowerCase().indexOf("/career-discovery") > -1) ? "Career_Discovery" : "MST";
			return MSTP.ENV.TenantCode + "_" + suffix;
		},
		encode : function(arg) {
			try {
				return encodeURIComponent(arg);
			} catch(e) {
				return null;
			}
		},
		pageView : function() {
		},
		paygradeListen : function() {
		}
	};

	var methods = {
		init : function(args) {
			initialized = true;
		},
		refreshJobSearch : function(args) {
			if(initialized) {
			}
		},
		editCivilianSkillsLinkClicked : function() {
			if(initialized) {
			}
		},
		editTrainingsLinkClicked : function() {
			if(initialized) {
			}
		},
		editSubspecialtiesLinkClicked : function() {
			if(initialized) {
			}
		},
		viewMoreJobsLinkClicked : function() {
			if(initialized) {
			}
		},
		jobViewLinkClicked : function() {
			if(initialized) {
			}
		},
		noJobsFound : function() {
			if(initialized) {
			}
		}
	};
})( jQuery );

$(document).ready(function() {
	if(self != parent) {
		$("body").addClass("mst-iframed");
	}
});