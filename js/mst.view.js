window.console = window.console || {};
window.console.log = window.console.log || function() {};
window.console.warn = window.console.warn || function() {};

MST = window.MST || {};
MST.Model = window.MST.Model || {};
MST.View = window.MST.View || {};
MST.View.OVERRIDE = MST.View.OVERRIDE || {};

/* legacy */
MSTP = window.MSTP || {};
MSTP.Profile = window.MSTP.Profile || {};

$(document).ready(function() {
	/* moved from mst.model.js */
	MST.ENV.Profile = new MST.Model.Profile();
	/* end moved from mst.model.js */
	
	MST.ENV.VIEW = new MST.View.Page();
	var refineSection = new MST.View.RefineSection();
	var firstTranslation = true;
	refineSection.listenTo(MST.ENV.Profile, "change:skillsJobsAndOccupationData", function(profile) {
		$(".mst-search-contianer-padding").hide();
		var data = profile.getSkillsJobsAndOccupationData();
		var skillMatches = data.skillMatches;
		MST.SkillRepository.setSkillMatches(skillMatches);
		this.render();
		if(firstTranslation) {
			$("[data-show-on-mos-edit='false']").show();
  			$("[data-show-on-mos-edit='true']").hide();
		}
		firstTranslation = false;
	});
	
	refineSection.listenTo(MST.ENV.Profile.getMOSes(), "add", function() {
		this.render();
	});
});

MST.View.AbstractEditEntitySection = MST.View.AbstractView.extend({
	initialize : function() {
		var $this = this;
		$this.$el.find(".edit-panel-heading").click(function() {
			$this.onEntityFinishedEdit();
			$this.$el.hide();
		});
	},
	onEntityFinishedEdit : function() {
		this.$el.find(".edit-panel-heading").hide();
		
  		$("[data-show-on-entity-edit='false']").show();
  		$("[data-show-on-entity-edit='true']").hide();
  		$("[data-show-on-entity-edit='never']").hide();
  		$("[data-show-on-entity-edit='always']").show();
  		$("#refineSearchBtnMobileContainer").css("display", ""); /* should use default style */
	},
	onEntityEdit : function() {
		this.$el.find(".edit-panel-heading").show();
		
		$("[data-show-on-mos-edit='false']").show();
  		$("[data-show-on-mos-edit='true']").hide();
  		$("[data-show-on-entity-edit]").hide();
  		$("[data-show-on-entity-edit='never']").hide();
  		$("[data-show-on-entity-edit='always']").show();
	}
}); 

MST.View.EditSkillSection = MST.View.AbstractEditEntitySection.extend({
	el : "#skillsEditSection",
	inputSelector : "#skillAutocomplete",
	cloned : [],
	deletedSkills : [],
	customSkills : [],
	initialize : function(args) {
		MST.View.AbstractEditEntitySection.prototype.initialize.call(this);
		var $this = this;
		$this.$el.hide();
		
		$(this.inputSelector).autocomplete({
			delay: 50,
			minLength: 1,
			appendTo: $(this.inputSelector).next(),
			source: function( request, response ) {
				var params = {from: 0,size: 10, searchTerm: request.term};
				MST.ENV.VIEW.abortXhr();
				var xhr = $.getJSON(MST.ENV.APIURL + "/entity/skill", params,
					function(data) {
						data.beanList = $.isArray(data.beanList) ? data.beanList : [];
				    	  var items = Array.prototype.slice.call(data.beanList).map(
		    	    		function(bean) {
		    	    			var item = {};
		    	    			item.label = bean.title
		    	    			item.id = bean.id;
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
				$this.addSkill(MSTP.SkillMatch.newInstance(ui.item.id, ui.item.label));
				setTimeout(function() {$($this.inputSelector).val("");}, 500);
				$this.draw();
			}
		});
	},
	addSkill : function(skill) {
		var $this = this;
		var exists = false;
		$.each($this.customSkills, function(idx, val) {
			if(val.skillMatch.skill.id == skill.skillMatch.skill.id) {
				exists = true;
			}
		});
		if(!exists) {
			$this.customSkills.push(skill);
		}

		if($this.deletedSkills != null && $this.deletedSkills != undefined) {
			$.each($this.deletedSkills, function(idx, val) {
				if(val == skill.skillMatch.skill.id) {
					$this.deletedSkills.splice(idx, 1);
				}
			});
		}
	},
	render : function() {
		var $this = this;
		$this.onEntityEdit();
		$this.$el.show();
		
		this.cloned = [];
		this.customSkills = [];
		this.deletedSkills = [];
		
		var skillMatches = MSTP.SkillRepository.getSkillMatches();
		if($.isArray(skillMatches)) {
			for(var i = 0; i < skillMatches.length; i++) {
				var skillMatch = skillMatches[i];
				var obj = {};
				$.extend(obj, skillMatch);
				$this.cloned.push(obj);
			}
		}
		
		this.draw();
	},
	draw : function() {
		var targetArray = [];
		var $this = this;
				
		$.each($this.customSkills, function(idx, val) {
			if(_.findIndex($this.deletedSkils, function($id) {return $id == val.skillMatch.skill.id;}) == -1) {
				targetArray.push(val);
			}
		});
		
		$.each($this.cloned, function(idx, val) {
			var inDeleteList = (_.findIndex($this.deletedSkils, function($id) {return $id == val.skillMatch.skill.id;}) > -1);
			var inCustomList = (_.findIndex($this.customSkills, function($sm) {return $sm.skillMatch.skill.id == val.skillMatch.skill.id;}) > -1);
			if(!inDeleteList && !inCustomList) {
				targetArray.push(val);
			}
		});
		
		targetArray.sort(function(a, b) {
			return a.skillMatch.skill.name.localeCompare(b.skillMatch.skill.name);
		});
		
		var $editablePanel = $("#skillsEditSection .panel-default-editable-list");
		$editablePanel.empty();
		var $editContainer = $(document.createElement("div"));
		$.each(targetArray, function(idx, match) {
			var skill = match.skillMatch.skill;
			var $div = $(document.createElement("div"));
			$editContainer.append($div);
			$div.mstRadioButton({title: skill.name, entityId : "skill-radio-" + skill.id, checked: true, onChange : function(checked) {
				if(checked) {
					$this.addSkill(match);
				} else {
					$this.removeSkill(match);
				}
			}});
		});
		$editablePanel.append($editContainer);
		
		//$("#skillCount").text("");
	}
});

MST.View.SubspecialtyEditSection = MST.View.AbstractEditEntitySection.extend({
	el : "#subspecialtiesEditSection",
	inputSelector : "#subspecialtyAutocomplete",
	clonedOptions : null,
	initialize : function(args) {
		MST.View.AbstractEditEntitySection.prototype.initialize.call(this);
		var $this = this;
		$this.$el.hide();
		
		/* 
		 * hold the initial paygrade values here.
		 * there is a bug in the jquery selectmenu() which renders hidden
		 * <select> options.  Consequently, the only way to hide them, is to 
		 * remove them fromthe menu.
		 * 
		 * However, when a user switches a MOS, he may have a different Rank, so this
		 * clonedoptions object will be appended to the paygrade every time
		 * the user goes to edit his subspecialty.
		 */
		$this.clonedOptions = $this.$el.find("#payGrade option").clone();
		
		$("#editSubspecialtiesBtn").click(function() {
			$this.$el.hide();
			$this.onEntityFinishedEdit();
			$this.save();
			return false;
		});
		
		$("#cancelSubspecialtiesEdit").click(function() {
			$this.$el.hide();
			$this.onEntityFinishedEdit();
			return false;
		});
		
		$($this.inputSelector).autocomplete({
			delay: 50,
			minLength: 1,
			appendTo: $($this.inputSelector).next(),
			source: function( request, response ) {
				var params = {from: 0,size: 10, searchTerm: request.term};
				MST.ENV.VIEW.abortXhr();
				var xhr = $.getJSON(MST.ENV.APIURL + "/entity/subspecialty", params,
					function(data) {
						data.beanList = $.isArray(data.beanList) ? data.beanList : []; 
				    	  var items = Array.prototype.slice.call(data.beanList).map(
		    	    		function(bean) {
		    	    			var item = {};
		    	    			item.label = bean.title
		    	    			item.id = bean.id;
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
				$this.addCustom(ui.item.id, ui.item.label);
				setTimeout(function() {$($this.inputSelector).val("");}, 500);
				$this.draw();
			}
		});
	},
	addCustom : function(id, title) {
		var subspecialty = { id : id, title : title, checked : true, custom : true};
		var $this = this;
		$this.custom[subspecialty.id] = subspecialty;
		$.each(MST.ENV.TenantBean.getPaygradeMap(), function(paygradeId) {
			/* remove old refernece, and add new reference */
			var index = _.findIndex($this.cloned[paygradeId], function($sm) {
				return $sm.id == subspecialty.id;
			});
			if(index > -1) {
				$this.cloned[paygradeId].splice(index, 1);	
			}
			$this.cloned[paygradeId].push(subspecialty);
		});
		this.check(subspecialty);
	},
	check : function(subspecialty) {
		var $this = this;
		subspecialty.checked = true;
		delete $this.deleted[subspecialty.id];
		$this.draw();
	},
	uncheck : function(subspecialty) {
		var $this = this;
		subspecialty.checked = false;
		$this.deleted[subspecialty.id] = subspecialty;
		$this.draw();
	},
	save : function() {
		var $this = this;

		
		/* we only have one mos */
		var numOfEntities = 0;
		MST.ENV.Profile.getMOSes().forEach(function(mos) {
			var $val = parseInt($("#payGrade").val());
			$val = (!isNaN($val)) ? $val : null;
			
			mos.setPaygrade($val);
			
			var selectedSubspecialties = {};
			
			$.each($this.cloned, function(paygradeId, subspecialties) {
				$.each(subspecialties, function(idx, subspecialty) {
					if(subspecialty.checked) {
						selectedSubspecialties[subspecialty.id] = subspecialty;
					}
				});
			});
			
			$.each($this.custom, function(idx, subspecialty) {
				if(subspecialty.checked) {
					selectedSubspecialties[subspecialty.id] = subspecialty;
				}
			});
			
			$.each($this.deleted, function(idx, subspecialty) {
				delete selectedSubspecialties[subspecialty.id];
			});
			
			numOfEntities = Object.size(selectedSubspecialties);
			mos.setSelectedSubspecialties(selectedSubspecialties);
		});
		
		var tooltipText = "Subspecialties updated";
		var $tooltip = $("#subspecialtiesSection .tooltip").attr("title", tooltipText).show();
		setTimeout(function() {
			$tooltip.fadeOut(500)
		}, 2000);
		
		if($("#subspecialtiesSectionAnchor").is(":visible")) {
			$('html, body').animate({
        		scrollTop: $("#subspecialtiesSectionAnchor").offset().top
    		}, 1);
		}
		
		Backbone.trigger("subspecialtiesChange");
	},
	render : function() {
		var $this = this;
		$this.onEntityEdit();
		
		$this.$el.find("#payGrade").empty().append($this.clonedOptions);
		
		this.custom = {};
		this.deleted = {};
		this.cloned = {};
		$.each(MST.ENV.TenantBean.getPaygradeMap(), function(paygradeId, val) {
			$this.cloned[paygradeId] = [];
		});
		
		MST.ENV.Profile.getMOSes().forEach(function(mos) {
			var tempSubspecialtyMap = {};
			
			$.each(mos.getSelectedSubspecialties(), function(idx, subspecialty) {
				if(subspecialty.custom) {
					var _obj = $.extend(_obj, subspecialty);
					$this.custom[_obj.id] = _obj;
					tempSubspecialtyMap[_obj.id] = _obj;
				}
			});
			
			$.each(mos.getSubspecialties(), function(idx, subspecialty) {
				var selected = mos.getSelectedSubspecialties()[subspecialty.id];
				if(selected == null || selected == undefined || !selected.custom) {
					var _obj = $.extend(_obj, subspecialty);
					_obj.checked = selected;
					/* if it exists twice, but with different paygrade ranges, just expand the ranges */
					if(tempSubspecialtyMap[_obj.id]) {
						if(tempSubspecialtyMap[_obj.id].paygradeBeginId < _obj.paygradeBeginId) {
							_obj.paygradeBeginId = tempSubspecialtyMap[_obj.id].paygradeBeginId;
						}
						
						if(tempSubspecialtyMap[_obj.id].paygradeEndId > _obj.paygradeEndId) {
							_obj.paygradeEndId = tempSubspecialtyMap[_obj.id].paygradeEndId;
						}
					}
					
					tempSubspecialtyMap[_obj.id] = _obj;
				}
			});
			
			$.each(MST.ENV.TenantBean.getPaygradeMap(), function(paygradeId) {
				if($.isArray(mos.getSubspecialties())) {
					$.each(tempSubspecialtyMap, function(idx, subspecialty) {
						var customObj = typeof(mos.getSelectedSubspecialties()[subspecialty.id]) === "object";
						var isCustom = (!customObj || !customObj.custom);
						if(isCustom) {
							if(paygradeId >= subspecialty.paygradeBeginId && paygradeId <= subspecialty.paygradeEndId) {
								$this.cloned[paygradeId].push(subspecialty);
							}
						}
					});
				}
				
				$.each(mos.getSelectedSubspecialties(), function(idx, subspecialty) {
					if(subspecialty.custom) {
						$this.cloned[paygradeId].push(subspecialty);
					}
				});
			});
		});
		
		try {
			$("#payGrade").selectmenu("destroy");
		} catch(ex) {}
		
		try {
			$("#payGrade").unbind("change");
		} catch(ex) {}
		
		var onPaygradeChange = function() {
			$this.$el.find(".subspecialtyPaygradeSection").hide();
			var $val = parseInt($(this).val());
			$val = (!isNaN($val)) ? $val : null;
			
			if($val != null) {
				$this.$el.find("#subspecialtyPaygradeSection-" + $val).show();
			} else {
				$this.$el.find("#subspecialtyPaygradeSectionEmpty").show();
			}
			$this.draw();
		};
		
		$("#payGrade").selectmenu( { change : function(ui, event) {
			onPaygradeChange.call(this);
		}});
		
		if(typeof($.mobile) === "object") {
			$("#payGrade").change(function() {
				onPaygradeChange.call(this);
			});
			
			/* jquery mobile incorrectly styles the select box, due to a conflict with jquery-ui */
			$("#payGrade-button").addClass("ui-btn ui-icon-tri-d ui-btn-icon-right ui-corner-all");
			$("#payGrade-button span").addClass("form-control input-lg");
		}
				
		/* we only have 1 mos for now */
		MST.ENV.Profile.getMOSes().forEach(function(mos) {
			var pg = parseInt(mos.getPaygrade());
			pg = (!isNaN(pg)) ? pg : null;
			
			$this.$el.find("#payGrade option").each(function(idx, option) {
				var $val = parseInt($(option).val());
				$val = (!isNaN($val)) ? $val : null;
				if($val != null && $(option).text().indexOf(mos.getRankName()) != 0) {
					$(option).remove();
				}
			});
			
			if(pg != null) {
				$this.$el.find("#payGrade").val(pg).trigger("change");
			} else {
				$this.$el.find("#subspecialtyPaygradeSectionEmpty").show().text("No default results.  Please enter subspecialties below.");
				$this.$el.find("#payGrade").val("").trigger("change");
			}
		});

		$this.$el.show();
		this.draw();
	},
	draw : function() {
		var $this = this;	
		
		var $pg = $this.$el.find("#payGrade").val();
		$pg = parseInt($pg);
		$pg = (!isNaN($pg)) ? $pg : null;
		
		if(typeof($.mobile) === "object") {
			/* jquery mobile incorrectly styles the select box, due to a conflict with jquery-ui */
			$("#payGrade-button span").addClass("form-control input-lg");
		}

		MST.ENV.Profile.getMOSes().forEach(function(mos) {
			$.each(MST.ENV.TenantBean.getPaygradeMap(), function(paygradeId) {
				$.each($this.cloned[paygradeId], function(idx, subspecialty) {
					var inDeleteList = typeof($this.deleted[subspecialty.id]) === "object";
					var inCustomList = typeof($this.custom[subspecialty.id]) === "object";
					
					if(!inDeleteList && inCustomList) {
						$this.cloned[paygradeId][idx].checked = true;
					}
				});
				
				$this.cloned[paygradeId].sort(function(a, b) {
					return a.title.localeCompare(b.title);
				});
			});
		});		

		
		var $editablePanel = $("#subspecialtiesEditSection .panel-default-editable-list .subspecialtyPaygradeSection");
		$editablePanel.empty();
		//No default results.  Please select subspecialties below.
		
		if(Object.size($this.custom) == 0) {
			$("#subspecialtyPaygradeSectionEmpty").text("No default results.  Please enter subspecialties below.");
		} else {
			$.each($this.custom, function(idx, subspecialty) {
				var $div = $(document.createElement("div"));
				$("#subspecialtyPaygradeSectionEmpty").append($div);
				$div.mstRadioButton({title: subspecialty.title, entityId : "subspecialty-custom-radio-" + subspecialty.id, checked: subspecialty.checked, onChange : function(checked) {
					if(checked) {
						$this.check(subspecialty);
					} else {
						$this.uncheck(subspecialty);
					}
				}});
			});
		}

		$.each($this.cloned, function(paygradeId, subspecialties) {
			if(subspecialties.length == 0) {
				$("#subspecialtyPaygradeSection-" + paygradeId).text("No default results.  Please enter subspecialties below.");
			} else {
				$.each(subspecialties, function(idx, subspecialty) {
					var $div = $(document.createElement("div"));
					$("#subspecialtyPaygradeSection-" + paygradeId).append($div);
					$div.mstRadioButton({title: subspecialty.title, entityId : "subspecialty-radio-" + paygradeId + "-" + subspecialty.id, checked: subspecialty.checked, onChange : function(checked) {
						if(checked) {
							$this.check(subspecialty);
						} else {
							$this.uncheck(subspecialty);
						}
					}});
				});
			}
		});
	}
});

MST.View.EditTrainingSection = MST.View.AbstractEditEntitySection.extend({
	el : "#trainingEditSection",
	inputSelector : "#trainingAutocomplete",
	initialize : function(args) {
		MST.View.AbstractEditEntitySection.prototype.initialize.call(this);
		this.isChanged = false;
		this.custom = [];
		var $this = this;
		$this.$el.hide();
		
		$("#editTrainingBtn").click(function() {
			$this.$el.hide();
			$this.isChanged = false;
			var numOfTrainings = 0;
			var list = _.union($this.cloned,$this.custom);
			$.each(list, function(idx, t) {
				var mos = t.custom ? MST.ENV.Profile.getMOSes().first():MST.ENV.Profile.getMOS(t.mos);
				if (t.selected) {
					numOfTrainings++;
					if (t.custom) {
						t.mos=mos.id;
					}
					$this.isChanged |= mos.addSelectedTraining(t);
				} else {
					$this.isChanged |= mos.removeSelectedTraining(t);
					
					/* clean up custom array on save */
					var customIndex = -1;
					$.each($this.custom, function(idx2, val) {
						if(val.id == t.id) {
							customIndex = idx2;
						}
					});
					if(customIndex > -1) {
						$this.custom.splice(customIndex, 1);
					}
					/* end cleaning array */
				}
	  		});
			$this.onEntityFinishedEdit();
			
			var tooltipText = "Training updated";
			var $tooltip = $("#trainingSection .tooltip").attr("title", tooltipText).show();
			setTimeout(function() {
				$tooltip.fadeOut(500)
			}, 2000);
			
			if($("#trainingSectionAnchor").is(":visible")) {
				$('html, body').animate({
	        		scrollTop: $("#trainingSectionAnchor").offset().top
	    		}, 1);
			}
			
			if ($this.isChanged) {Backbone.trigger('trainingsChange');}
			return false;
		});
		
		$("#cancelTrainingEdit").click(function() {
			$this.$el.hide();
			$this.onEntityFinishedEdit();
			$.each($this.custom, function(idx, t) {t.selected=false;});
			return false;
		});
		
		$($this.inputSelector).autocomplete({
			delay: 500,
			minLength: 1,
			appendTo: $($this.inputSelector).next(),
			source: function( request, response ) {
				var params = {from: 0,size: 10, searchTerm: request.term};
				MST.ENV.VIEW.abortXhr();
				var xhr = $.getJSON(MST.ENV.APIURL + "/entity/training", params,
					function(data) {
						data.beanList = $.isArray(data.beanList) ? data.beanList : [];
				    	  var items = Array.prototype.slice.call(data.beanList).map(
		    	    		function(bean) {
		    	    			var item = {};
		    	    			item.label = bean.title
		    	    			item.id = bean.id;
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
				$this.addCustom(ui.item.id, ui.item.label);
				setTimeout(function() {$($this.inputSelector).val("");}, 500);
				$this.draw();
			}
		});
		
	},
	add : function(t) {
		var mos = MST.ENV.Profile.getMOS(t.mos);
		if (mos) {
//			console.log('add training: ' + t.title + ' to ' + mos.get("title"));
//			this.selected[t.id]=t;
//			delete this.removed[t.id];
			t.selected=true;
//			t.removed=false;
		}
	},
	remove : function(t) {
		var mos = MST.ENV.Profile.getMOS(t.mos);
		if (mos) {
//			console.log('remove training: ' + t.title + ' to ' + mos.get("title"));
//			delete this.selected[t.id];
			$.each(this.custom, function(idx, val) {
				if(val.id == t.id) {
					val.selected = false;
				}
			});
			//delete this.custom[t.id];
//			this.removed[t.id]=t;
//			t.removed=true;
			t.selected = false;
		}
	},
	push : function(mos,t) {
		var obj = {};
		$.extend(obj, t);
		obj.mos = mos.getId();
		obj.selected = _.contains(this.selectedIds, t.id);
		this.cloned.push(obj);
	},
	render : function() {
		var $this = this;
		$this.onEntityEdit();
		
		this.cloned = [];
//		this.selected = {};
//		this.removed = {};
		this.selectedIds = _.map(MST.ENV.Profile.getSelectedTrainings(), function(t) {return t.id;})
		MST.ENV.Profile.getMOSes().forEach(function(mos) {
  			var val = mos.getTrainings();
  			if($.isArray(val)) {
  				$.each(val, function(idx, t) {
  					$this.push(mos,t);
  				});
  			} else {
  				$this.push(mos,val);
  			}
  		});
		$this.$el.show();
		this.draw();
	},
	draw : function() {
		var targetArray = [];
		var $this = this;
		
		var $editablePanel = $("#trainingEditSection .panel-default-editable-list");
		$editablePanel.empty();
		var $editContainer = $(document.createElement("div"));
		var list = _.sortBy(_.union($this.cloned,_.filter($this.custom, function(t){return t.selected;})), 'title');
		$.each(list, function(idx, t) {
			var $div = $(document.createElement("div"));
			$editContainer.append($div);
			var ckd = (true == t.selected);
			$div.mstRadioButton({title: t.title, entityId : "training-radio-" + t.id, checked: ckd, onChange : function(checked) {
				if(checked) {
					$this.add(t);
				} else {
					$this.remove(t);
				}
			}});
		});
		$editablePanel.append($editContainer);
	},
	
	addCustom : function(id, title) {
		var $this = this;
		var $id = id;
		/* guard againt adding duplicates */
		var customTraining = _.find($this.custom, function(t) { return $id==t.id});
		if(customTraining == null && customTraining == undefined) {
			var t = _.find(this.cloned,function(t) {return $id==t.id});
			if (t) {
				t.selected=true;
			} else {
				t = { id : id, title : title, selected : true, custom : true };
				$this.custom.push(t);
			}
		}
	}
});

MST.View.RefineSection = MST.View.AbstractMosFilterView.extend({
	serviceSelect : "#serviceRefine",
	inputSelector : "#queryRefine",
	el : "#refineColumn",
	editSkillSection : null,
	editTrainingSection : null,
	editSubspecialtySection : null,
	location : null,
	mobileRefineSectionOpened : false,
	initialize : function(args) {
		var $this = this;
		$this.editSkillSection = new MST.View.EditSkillSection();
		$this.editTrainingSection = new MST.View.EditTrainingSection();
		$this.editSubspecialtySection = new MST.View.SubspecialtyEditSection();
		$this.location = new MST.View.Location();
		
		$("#serviceRefine").selectmenu();
		/* plugin changes the 'for' tag of the label, which screws with 501 compliance */
		$("label[for='serviceRefine-button']").attr("for", "serviceRefine");
		
		this.listenTo(MST.ENV.Profile ,"change:translationInProgress", function(profile) {
			if(profile.isTranslationInProgress()) {
				$("#refineSearchBtn, #refineSearchBtnMobile").prop("disabled", true).addClass("disabled");
			} else {
				$("#refineSearchBtn, #refineSearchBtnMobile").prop("disabled", false).removeClass("disabled");
			}
		});
		
		$("#keyword").change(function() {
			MST.ENV.Profile.markRefineSectionAsDirty();
		}).keyup(function(e) {
			if(e.keyCode == 13) {
				$(this).trigger("change");
				$("#refineSearchBtn, #refineSearchBtnMobile").each(function() {
					if($(this).is(":visible")) {
						$(this).trigger("click");	
					}
				});
			}
		});
		
		$("#refineSearchBtn, #refineSearchBtnMobile").click(function() {
			var isDisabled = $(this).hasClass("disabled");
			var isMobile = ($(this).attr("data-role-mobile") == "true");
			var isDirty = MST.ENV.Profile.isRefineSectionDirty();
			if(!isDisabled) {
				var keyword = $("#keyword").val();
				var location = $("#location").text();
				MST.ENV.Profile.setKeyword(keyword);
				MST.ENV.Profile.setLocation(location);
				
				var onFinishedRefine = function() {
					if(isMobile) {
  						$("[data-show-on-entity-edit='never']").show();
						$("#toggeRefineBtn").trigger("click");
  					}
  					$("[data-show-on-mos-edit='false']").show();
	  				$("[data-show-on-mos-edit='true']").hide();
				};
				
				/* if this is desktop, refine
				 * if this is mobile, only refine if the keyword has changed (isDirty)
				 * otherwise, the last if statement will just collapse the mobile section
				 */
				if(!isMobile || (isMobile && isDirty)) { // desktop || dirty refine mobile
					MST.ENV.Profile.resetPages();
					MST.ENV.Profile.refineJobs();
					
					$this.listenToOnce(MST.ENV.Profile, "refineDataSet", function(profile) {
						MST.ENV.Profile.unsetRefineSectionDirty();
						onFinishedRefine();
					});
				} else {
					onFinishedRefine();
				}
			}
		});
		
		$("#cancelMobileRefine").click(function() {
			$("#toggeRefineBtn").trigger("click");
			return false;
		});
		
		$("#toggeRefineBtn, #mosXsContainer").click(function() {
  			$("#refineColumn").toggleClass('hidden-sm-down');
  			var icon = $("#refine-btn-icon");
  			if (icon) {
  				var text = icon.text();
  				text = (text == "keyboard_arrow_down") ? "keyboard_arrow_up" : "keyboard_arrow_down";
  				icon.text(text);
  				if (text == "keyboard_arrow_down") {
  					$this.mobileRefineSectionOpened = false;
  					$("#refine-btn-text").text('Refine Search');
  					
  					$("[data-show-on-mos-edit='false']").show();
  					$("[data-show-on-mos-edit='true']").hide();
  				} else {
  					$this.mobileRefineSectionOpened = true;
  					$("#refine-btn-text").text('Close');
  					
  					$("[data-show-on-mos-edit='false']").hide();
  					$("[data-show-on-mos-edit='true']").show();
  				}
  			}
  		});
  		
  		$("#editJobTitle").click(function() {
  			$("[data-show-on-mos-edit='false']").hide();
  			$("[data-show-on-mos-edit='true']").show();
  			return false;
  		});
  		
  		$("#editSkills").click(function() {
  			$this.editSkillSection.render();
  			return false;
  		});
  		
  		$("#editTrainings").click(function() {
  			$this.editTrainingSection.render();
  			return false;
  		});
  		
  		$("#editSubspecialties").click(function() {
  			$this.editSubspecialtySection.render();
  			return false;
  		});
  		
		Backbone.on('trainingsChange', function () {
			var $trainingList = $this.$el.find("#trainingList"); 
			$trainingList.empty();
			var selectedTrainings = MST.ENV.Profile.getSelectedTrainings();
			if ($.isArray(selectedTrainings) && (0 < selectedTrainings.length)) {
				var ul = $("<ul>");
				$.each(selectedTrainings, function(idx, t) {
					ul.append($("<li>").text(t.title).attr("id", "selected-training-" + t.id));
				});
				$trainingList.append(ul);
				$("#trainingCount").text("(" + selectedTrainings.length + ")");
				$(".mst-trainings-panel").show();
			} else {
				$("#trainingCount").text("");
				$(".mst-trainings-panel").hide();
			}
			MST.ENV.Profile.translateToSkillsJobsAndOccupations();
		});
  		
  		Backbone.on('subspecialtiesChange', function() {
  			var $list = $this.$el.find("#subspecialtyList");
  			$list.empty();
  			var selectedEntities = MST.ENV.Profile.getSelectedSubspecialties();
			if ($.isArray(selectedEntities) && (0 < selectedEntities.length)) {
				var ul = $("<ul>");
				$.each(selectedEntities, function(idx, t) {
					ul.append($("<li>").text(t.title).attr("id", "selected-subspecialty-" + t.id));
				});
				$list.append(ul);
				$("#subspecialtiesCount").text("(" + selectedEntities.length + ")");
				$(".mst-subspecialties-panel").show();
			} else {
				$("#subspecialtiesCount").text("");
				$(".mst-subspecialties-panel").hide();
			}
  			MST.ENV.Profile.translateToSkillsJobsAndOccupations();
  		});
  		
		Backbone.on('renderSkills', function () {
			var $skillList = $this.$el.find("#skillList"); 
			$skillList.empty();
			if($.isArray(MSTP.SkillRepository.getSkillMatches())) {
				$("#skillCount").text("(" + MSTP.SkillRepository.getSkillMatches().length + ")");
				var $ul = $(document.createElement("ul"));
				$skillList.append($ul);
			
				$.each(MSTP.SkillRepository.getSkillMatches(), function(idx, match) {
					var skill = match.skillMatch.skill;
					$ul.append(
						$(document.createElement("li")).text(skill.name).attr("id", "selected-skill-" + skill.id)
					);
				});
			}
		});
		
		//$this.$el.css("max-height", $(window).height()).css("overflow-y", "scroll");
		
		this.listenToRefineChange();
		MST.View.AbstractMosFilterView.prototype.initialize.call(this);
	},
	getPaddingTopAndBottom : function(element) {
		var paddingTop = parseInt($(element).css("padding-top"));
		var paddingBottom = parseInt($(element).css("padding-bottom"));
		if(!isNaN(paddingTop) && !isNaN(paddingBottom)) {
			return paddingTop + paddingBottom;
		} else if(!isNaN(paddingTop)) {
			return paddingTop
		} else if(!isNaN(paddingBottom)) {
			return paddingBottom;
		} else {
			return 0;
		}
	},
	listenToRefineChange : function() {
		var $this = this;		
		var $refineColumn = $("#refineColumn");
		
		if($refineColumn.is(":visible")) {
			$(document.body).addClass("refine-section-visible");
		} else {
			$(document.body).removeClass("refine-section-visible");
		}
		
		if($("#divVisibleOnlyInMobile").is(":visible")) {
			$(document.body).addClass("mst-mobile").removeClass("mst-desktop");
		} else {
			$(document.body).removeClass("mst-mobile").addClass("mst-desktop")
		}
		setTimeout(function(){
			$this.listenToRefineChange();
		}, 500);
			
	},
	render : function() {
		var $this = this;
		Backbone.trigger('renderSkills');
		
		var $mosReadOnlyInput = $("#mosXsContainer span");
  		
  		MST.ENV.Profile.getMOSes().forEach(function(mos) {
  			$mosReadOnlyInput.empty().append(
  				$(document.createElement("span")).text(mos.getMosCode()).addClass("mst-mos-code").attr("id", "mos-selection-" + mos.getId()),
  				$(document.createElement("span")).text(" " + mos.getTitle() + "( " + mos.getServiceName() + " - " + mos.getRankTitle() + " )")
  			);
  		});
  		
  		MST.View.AbstractMosFilterView.prototype.render.call(this);
		
		return this;
	}
});

MST.View.Page = MST.View.AbstractPageView.extend({
	errorTemplate : "#errorDialogTemplate",
	jobView : null,
	
	initialize : function(args) {
		MST.View.AbstractPageView.prototype.initialize.call(this);
	},
	initializeSpinner : function() {
		var $this = this;
		setTimeout(function() {
			var $e = $("#refineSearchBtn .glyphicon-refresh");
			var text = $e.text();
			text = (text == "cached") ? "autorenew" : "cached";
			//$e.text(text);
			$(".glyphicon-refresh").text(text);
			$this.initializeSpinner();
		}, 350);
	},
	onReady : function() {
		var $this = this;
		MST.View.AbstractPageView.prototype.onReady.call(this);
		
		var backText = MST.ENV.TenantBean.getBackButtonText();
		if(backText != null && backText != undefined && backText != "" && backText.length && backText.length > 0) {
			$(window).bind('beforeunload', function(){
				if(MST.ENV.Profile.getMOSes().length > 0) {
					return MST.ENV.TenantBean.getBackButtonText();
				}
			});
		}
		
		MSTP.getMaxPaygradeOnPage = function() {return null;};
		
		$("#profile-link").click(function() {
			var $mos = MST.ENV.Profile.getMOSes().at(0);
			
			var $href = "?mosId=" + $mos.getId()
			
			if($mos.getSelectedSubspecialties() != null && $mos.getSelectedSubspecialties() != undefined) {
				$.each($mos.getSelectedSubspecialties(), function(idx, subspecialty) {
					$href += ("&subspecialtyIds[]=" + idx);
				});
			}

			if($mos.getSelectedTrainings() != null && $mos.getSelectedTrainings() != undefined) {
				$.each($mos.getSelectedTrainings(), function(idx, training) {
					$href += ("&trainingIds[]=" + idx);
				})
			}
			
			$.each(MST.SkillRepository.getSkillMatches(), function(idx, match) {
				$href += ("&skillIds[]=" + match.skillMatch.skill.id);
			});
			
			$(this).attr("href", MST.ENV.ContextPathWithFilter + "/mos-translator/profile" + $href);
		});

		this.listenTo(MST.ENV.Profile.getMOSes(), "add", function(mos) {
			$this.onStateChanged(true);
		});
		
		$this.mosView.render();
		
		this.initializeSpinner();
		
		if(MST.ENV.ServiceCode != null) {
			$("#service").val(MST.ENV.ServiceCode).selectmenu("refresh");
		}
		
		if($.isArray(MSTP.ENV.MOSList) && MSTP.ENV.MOSList.length > 0) {
			var $mos = new MST.Model.Profile.MOS(MSTP.ENV.MOSList[0]);
			MST.ENV.Profile.getMOSes().add($mos);
			$("#query").val($mos.getAutocompleteString());
		}
	},
	onMOSRemoved : function($mos) {
		var $this = this;
		if(!MST.ENV.Profile.hasMOSes()) {
			$this.mosView.render();
			//new MST.View.MOS.Empty().render();
		}
		MST.ENV.isProfileDirty = true;
//		MST.SkillRepository.purgeMosHistory($mos.getId());		
		this.onStateChanged(true);
	},
	onStateChanged : function(fullTranslation) {
		MST.ENV.Profile.resetPages();
		if(fullTranslation === true) {
			MST.ENV.Profile.translateToSkillsJobsAndOccupations();
		} else {
			MST.ENV.Profile.translateToJobsAndOccupations();
		}
	},
	isPageEmpty : function() {
		var isEmpty = true;
		if(isEmpty) {
			isEmpty = (MST.ENV.Profile.getTrainingIDs().length == 0);
		}
		if(isEmpty) {
			isEmpty = (MST.ENV.Profile.getSubspecialtyIDs().length == 0);
		}
		if(isEmpty) {
			isEmpty = (MST.ENV.Profile.getMosIDs().length == 0);
		}
		return isEmpty;
	},
	error : function(xhr, textStatus, callback) {
		console.log(xhr, textStatus, callback);
		var $this = this;
		var html = _.template($(this.errorTemplate).html())({})
		$this.Dialog.show("Error", $(html));
		$this.Dialog.$dialog.find("a").click(function() {
			$this.Dialog.hide();
			return false;
		});
		$this.Dialog.$dialog.find("input").click(function() {
			$this.Dialog.hide();
			if($.isFunction(callback)) {
				callback();
			} else {
				$.error("No callback function specified");
			}
		});
	},
	onTranslationFinished : function() {
		//this.bottomPanelView.hideSpinner();
		this.jobView.hideSpinner();
	}
});


(function( $ ){
	var $radioHtml = "<div class='ui-controlgroup-controls'>" +
						"<div class='ui-checkbox'>" +
							"<i class=\"material-icons ui-checkbox-off\">panorama_fish_eye</i>" +
							"<label class='ui-btn ui-corner-all ui-btn-inherit'>" +
								"<div class='ui-label-table'>" +
									"<span class='ui-label'>" +
									"</span>" +
								"</div>" +
							"</label>" +
							"<input type='checkbox' data-cacheval='true' />" +
						"</div>" +
					"</div>";
	
	var privateMethods = {
	};

	var methods = {
		init : function(args) {
			var $this = $(this);
			$this.append($($radioHtml));
			$this.find(".ui-label").text(args.title);
			
			if(args.checked) {
				$this.find("input").attr("data-cacheval", false);
				$this.find("i").text("check_circle").removeClass("ui-checkbox-off").addClass("ui-checkbox-on");
			}
			
			$this.find(".ui-checkbox").attr("id", args.entityId).click(function() {
				var $i = $this.find("i");
				if($i.hasClass("ui-checkbox-on")) {
					$i.text("panorama_fish_eye").removeClass("ui-checkbox-on").addClass("ui-checkbox-off");
				} else {
					$i.text("check_circle").removeClass("ui-checkbox-off").addClass("ui-checkbox-on");
				}
				var isChecked = $i.hasClass("ui-checkbox-on");
				if($.isFunction(args.onChange)) {
					args.onChange.call($this, isChecked);
				}
			}).mouseover(function() {
				$(this).addClass("ui-state-hover");
			}).mouseout(function() {
				$(this).removeClass("ui-state-hover");
			});
		}
	};

	$.fn.mstRadioButton = function(method) {
		if ( methods[method] ) {
			return methods[ method ].apply( $, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply(this, arguments);
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.mstRadioButton' );
    	}
	};
})( jQuery );
