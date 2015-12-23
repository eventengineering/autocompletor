
//auto complete lookup widget, attach to input

(function($) {
	$.widget("ui.autocomp", {

	list: $(""), //list holder for autocomplete
	currentTitle : "", //holding current title incase undo is called
	currentGroup:null, //currently selected group

 	//options array
 	options: {
 	  location: "bottom", //position of box realtive to input
 	  icon: "fa-list-alt", //icon to indicate it is a autocompletable field
 	  resultTitle:"search_title", //field to use for result title
 	  outputDataMap:{"id":"id"}, //map selected value to input elements data fields

 	  groupedData:false, //input data will be group, will need toggle to handle groups
 	  groupSelector:null, //render group selector tabs
 	  defaultGroup:null, //default group to start filtering by
 	  dataGroups:false, //specify data groups to show

 	  minSearch:0, // minimum characters needed before search results show

 	  maxWidth: false, //max results width
 	  width: false, //standard opening width

 	  addNew: false, //display add new element
 	  addNewTitle:"Add New", //title for add new button
 	  addNewClick:function(){}, //Callback for add new button click
 	  addNewElement:null, //Element for add new button

 	  allowFreeText:false, //allow the element to sotre freetext with now key values lookedup

 	  choiceClick:null, //callback for choice;

 	  search:function(){return[]}, //search Callback
 	  defaultSearch:function(){return[]}, //search to call of focust of emtey element}
 	  resultLine:null, //render line Callback

 	  chosen:function(){}, //callback for when data is loaded

 	  filter:null,
 	  render:null,
 	  select:null,
 	},

 	//object constructor
 	_create: function() {
 		var self = this;
 		var options = this.options;
 		var element = this.element;

 		element.addClass("autocomp no-autoblur");
 		//add icon
 		if(options.icon){
 			element.after("<i class='fa " + options.icon + " autocomp-icon'></i>");
 			element.css({"padding-right":"25px"})
 		}

 		element.on("keyup", function(e){
 			self._keyup(e);
 		});


 		element.on("focus", function(){
 			if(element.val() == ""){

 					//get results from search
 					var results = options.defaultSearch();
 					if(results){
	 					//filter the results and format for adding to list
	 					results = self.filter(results);

	 					//render the list
	 					results = self.render(results);
 					}

 			}
 		})

 		//bind on blur behaviour
 		element.blur(function(e){

 			if(!element.prop('readonly')){
 				if(ee.blurOrigin.closest(".autocomp-list").length == 1){
 					element.focus();
 				}else{
 					self.list.remove();

 					if(element.val() == "" && !options.allowFreeText){
 						$.each(options.outputDataMap, function(key, item) {
 							element.data(key, "");
 						});
 						self.element.attr("title", "");
 					}else{
 						if (options.allowFreeText){

 							if(self.currentTitle  != element.val()){
 								self.currentTitle = element.val();
 								self.element.attr("title", "New Project - " + element.val());
 								$.each(options.outputDataMap, function(key, item) {
 									element.data(key, "");
 								});

 								self.options.chosen(false);
 							}
 						}else{
 							element.val(self.currentTitle);
 							self.element.attr("title", self.currentTitle);
 						}
 					}
 				}
 			}

 		});
 	},

 	//set a value in the autocomplete field
 	set:function(title,data){

 		var self = this;

 		self.currentTitle = title;
 		self.element.val(title);
 		self.element.attr("title", title);

 		$.each(data, function(index, item) {
 			self.element.data(index, item);
 		});
 	},

 	//clear value from the autocomplete field
 	clear:function(){
 		var self = this;
 		self.currentTitle = "";
 		$.each(self.options.outputDataMap, function(key, item) {
 			self.element.data(key, "");
 		});
 	},

 	//handle keyup events on the input
 	_keyup:function(e){

 		var self = this;
 		var options = self.options;
 		var element = self.element;

 		if(!element.prop('readonly')){
 			switch(e.keyCode){
 				case 13: //enter
 				self._nav_enter();
 				break;

 				case 38:// up arrow
 				self._nav_up();
 				break;

 				case 40: //down arrow
 				self._nav_down();
 				break;

 				default: //other
 				//if value length is larger than the min length
 				if(element.val().length >= options.minSearch){

 					//get results from search
 					var results = self._search(element.val());

 					//filter the results and format for adding to list
 					results = self.filter(results);

 					//render the list
 					results = self.render(results);

 				}
 			}
 		}
 	},

 	//navigate up the list
 	_nav_up:function(){
 		if($(".active", this.list).length != 0){
 			var current = $("li.active", this.list);
 			if(current.prev("li").length){
 				current.removeClass('active');
 				current.prev("li").addClass('active');
 			}else{
 				if($(".autocomp-new", this.list).length == 1){
 					current.removeClass('active');
 					current.prev("li").addClass('active');
 					$(".autocomp-new", this.list).addClass("active");
 				}
 			}
 		}
 	},

 	//navigate down the list
 	_nav_down:function(){
 		if($(".active", this.list).length == 0){
 			if($(".autocomp-new", this.list).length == 1){
 				$(".autocomp-new", this.list).addClass("active");
 			}else{
 				$("ul:visible li:first", this.list).addClass("active");
 			}
 		}else{
 			if($(".autocomp-new", this.list).length == 1 && $(".autocomp-new", this.list).hasClass("active")){
 				$(".autocomp-new", this.list).removeClass('active')
 				$("ul:visible li:first", this.list).addClass("active");
 			}else{
 				var current = $("li.active", this.list);

 				if(current.next("li").length){
 					current.removeClass('active');
 					current.next("li").addClass('active');
 				}
 			}
 		}
 	},

 	//use the currently selected item
 	_nav_enter:function(){
 		var element = $(".active", this.list);

 		if(element.length != 0){

 			if(element.hasClass("autocomp-new")){
 				this._addnew(element); //trigger add button
 			}else{
 				this._selected(element); //trigger element selected
 			}

 			this.list.remove();
 		}else{
 			//select item if only one is present
 			if($(".autocomp-group-select", this.list).length == 0){
 				if($("li:not(.autocomp-new)", this.list).length == 1){

 					this._selected($("li:not(.autocomp-new)", this.list)); //trigger element selected

 					this.list.remove();
 				}
 			}
 		}
 	},

 	//search function
 	_search:function(term){

 		//add function to clear element data when typing occours YET TO FINISH!!!!!!!!!
 		//probs clear to just the typed character if first click

 		return term == "" ? [] : this.options.search(term);
 	},

 	filter:function(data){//custom render function
 		var self = this;
 		var func = this.options.filter ? this.options.filter : function(data){

 			if(self.options.groupedData){
 				for(var key in data){
 					$.each(data[key], function(index, item) {
 						item.autocomp_title_data = item[self.options.resultTitle];
 					});
 				}
 			}else{
 				$.each(data, function(index, item) {
 					item.autocomp_title_data = item[self.options.resultTitle];
 				});
 			}

 			return data;
 		}

 		return func(data);
 	},

 	//render list to DOM
 	render:function(data){

 		var self = this;

 		$(".autocomp-list").remove();

 		self.list = $("<div class='autocomp-list'></div>");

 		//add new button if option is enabled
 		if(self.options.addNew){

 			var adder = "";

 			if(self.options.addNewElement){
 				adder = self.options.addNewElement;
 			}else{
 				adder = $("<div class='autocomp-new'><i class='fa fa-plus'></i>" + self.options.addNewTitle + "</div>");
 			}

 			//trigger add new click function click
 			adder.click(function(){
 				self.options.addNewClick(self.element);
 				self.list.remove();
 			});

 			self.list.append(adder);
 		}

 		//handle groups if they exist
 		if(self.options.groupedData){

 			var grouper = "";

 			if(self.options.groupSelector){
 				grouper = self.options.groupSelector(data);
 			}else{
 				grouper = $("<table class='autocomp-group-select'><tr></tr></table>");


 				if(self.options.dataGroups){

 					self.options.dataGroups.forEach(function(group, index){
 						var dataLength = typeof(data[group]) == "undefined" ? 0 : data[group].length
 						$("tr", grouper).append("<td data-group='" + group + "'>" + group[0].toUpperCase() + group.slice(1) + " (" + dataLength + ")</td>");
 					});
 				}else{
 					for(var key in data){
 						$("tr", grouper).append("<td data-group='" + key + "'>" + key[0].toUpperCase() + key.slice(1) + " (" + data[key].length + ")</td>");
 					}
 				}


 			}

 			$("td", grouper).click(function(){
 				self._selectGroup($(this).data("group"));
 			})

 			self.list.append(grouper);

 			for(var key in data){
 				self.list.append(self._renderList(data[key], key));
 			}

 			self.currentGroup = self.options.defaultGroup == true ? self.options.defaultGroup : $("td:first", grouper).data("group");

 			self._selectGroup(self.currentGroup);

 		}else{
 			//create list
 			self.list.append(self._renderList(data));
 		}

 		//bind click function on items YET TO FINISH!!!!!!!!!
 		$("li", self.list).click(function(){});

 		//handle up down and enter in list YET TO FINISH!!!!!!!!!
 		$("list").keydown(function(){})

 		//handle up down and enter in text box YET TO FINISH!!!!!!!!!
 		self.element.keydown(function(){})

 		var position = self.element[0].getBoundingClientRect();
 		self.list.css({top: (position.top + position.height) + "px", left: position.left + "px"})

 		if(!self.options.maxWidth === true){
 			if(self.options.maxWidth === false){
 				self.list.css({width: position.width + "px"});
 			}else{
 				self.list.css({"min-width": position.width + "px"});
 				self.list.css({width: self.options.maxWidth + "px"});
 			}
 		}else{
 			self.list.css({"min-width": position.width + "px"});
 		}

 		$("body").append(self.list)
 		self.list.on("click", function(e){
 		});

 		$("li, .autocomp-new",self.list).on("mouseover", function(e){
 			$(".active", self.list).removeClass("active");
 			$(this).addClass("active");
 		});

 		$("li",self.list).on("click", function(e){
 			self._selected($(this));
 		});

 		$(".autocomp-new",self.list).on("click", function(e){
 			self._addnew();
 		});
 	},

 	_selectGroup:function(group){

 		$(".active", this.list).removeClass('active');

 		$(".autocomp-group-select td", this.list).removeClass("selected");
 		$(".autocomp-group-select td", this.list).each(function(){
 			if($(this).data("group") == group){
 				$(this).addClass("selected");
 			}
 		});

 		$("ul", this.list).hide();
 		$("ul", this.list).each(function(){
 			if($(this).data("group") == group){
 				$(this).show();
 			}
 		});
 	},

 	_renderList:function(data, group){


 		var self = this;
 		var func = self.options.render ? self.options.render : function(data){
 			var ul = $("<ul></ul>");

 			if(group){
 				ul.data("group", group);
 			}

 			$.each(data, function(index, item) {
 				var content = typeof(self.options.resultLine) == "function" ? self.options.resultLine(item) : item.autocomp_title_data;
 				var line = $("<li>" + content + "</li>");
 				line.data("data", item);

 				ul.append(line);
 			});

 			return ul;
 		}

 		return func(data);
 	},

 	//handle onclick of element
 	_selected:function(element){

 		if(typeof(this.options.choiceClick) == "function"){
 			this.options.choiceClick(this.element, element);
 		}else{
 			this._choose(element);
 		}

 		this.list.remove();

 	},

 	//save chosen data to element
 	_choose:function(element){

 		var self = this;

 		//set current title
 		self.currentTitle = typeof(self.options.resultTitle) == "function" ? self.options.resultTitle(element) : element.data("data")[self.options.resultTitle]

 		//set element text
 		self.element.val(self.currentTitle);
 		self.element.attr("title", self.currentTitle);

 		//map data to selected data attributes
 		$.each(self.options.outputDataMap, function(key, source) {
 			self.element.data(key,element.data("data")[source]);
 		});

 		//trigger chosen callback
 		self.options.chosen(element.data("data"));
 	},

 	//handle onclick of element
 	_addnew:function(){
 		this.options.addNewClick(this.element);
 		this.list.remove();
 	},


 	//allow options to be changed after creation
 	_setOption: function(option, value) {
 		$.Widget.prototype._setOption.apply( this, arguments );
 	},


 	//clean out bindings if element is removed
 	destroy: function() {

 	},
 });
})(jQuery);