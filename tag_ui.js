/*
* jQuery UI TagInput
*
* @version v1.0 (10/2014)
*
* Copyright 2014, William Pickard
* 
* Big Thanks To:
*    https://github.com/aehlke/tag-it
*
*
* Authors:
*   Will Pickard
*  
*
* Maintainer:
*   Will Pickard
*
* Dependencies:
*   jQuery v1.4+
*   jQuery UI v1.8+
*/
(function($) {
	$.widget('ui.taginput', {
		options: {
			/** animate tag additions and substractions **/
			animate: 		true,
			
			/** how the tags will be seperated  **/
			delimeter: 		',',
			
			/** when the tag box is on focus and space is pressed... submit the tag **/
			space: 			true,
			
			/** capitalize the tags **/
			caps: 			true,
			
			/** class of the tag box where tags will be shown **/
			tagbox_class: 		'tag-box',
			
			/** class of the tags to add **/
			tag_class: 		'tag',
			
			/** tag input class **/
			taginput_class:		'tag_ui-tag-input' ,
			/** boolean  ... delete the tag if it is clicked while in the box **/
			delete_onclick: 	true,
			
			/** data src for autocompletion **/
			autocomplete_url : 	'',
			
			/** results returned from the autocomplete_url **/
			autocomplete_tags : 	[],
			
			/** the data type returned from the autocomplete_url **/
			autocomplete_datatype: 	'json',
			
			/***
			*Trigger callbacks
			****/
			beforeBox: 		null,
			afterBox: 		null,
			
			beforeInput:		null,
			afterInput:		null,
			
			collectInput:		null,
			
			beforeTag:		null,
			afterTag:		null,
			
			beforeDelete:		null,
			afterDelete:		null,
		},
		
		/**
		*called at beginning
		**/
		_create: function(){
			
			//handle static scoping
			var that = this;
			
			//only allow single input tags
			if(this.element.is('input')){
				this._trigger('beforeBox', null);
				this.tagBox = $('<div class="tag-box"></div>').insertAfter(this.element);
				this._trigger('afterBox', null, {box: this.tagBox});
								
				//now make the main input hidden
				this.element.addClass('hidden');
			}
			
			//set the array of current values and tags
			this.values = [];
			this.tags = [];
			if($(this.element).val()){
				this.batchTags();
			}
				
			this.tagInput = $('<input type="text" />').addClass(this.options.taginput_class);
			
			this._trigger('beforeInput', null, {input: this.tagInput});
			$(this.tagInput).insertAfter(this.tagBox);
			this._trigger('afterInput', null, {input: this.tagInput});
			
			
			/****
			*
			*Events
			*
			*****/
		
			/** bind space insert tag events **/
			if(this.options.space){
				$(this.tagInput).on('keydown', function(evt){
					if(evt.which == 32){
						that.collectInput();
					}
				});
			}
			
			/** bind enter to insert **/
			$(this.tagInput).on('keydown', function(evt){
				if(evt.which == 13){//enter
					evt.preventDefault();
					that.collectInput();
				}
			});
			
			/*** delete the tags withiin the tag box on click ***/
			if(this.options.delete_onclick){
				/*** format the tag class for a bind **/
				/*** ex: tag_class = "tag tag-example my_tag" becomes: .tag.tag-example.my_tag" ***/
				var tagClass = this.options.tag_class.replace(' ', '.');
				//now add a period to the start
				tagClass = (tagClass.indexOf('.') == 0) ? tagClass : '.'+tagClass;
				
				$(this.tagBox).on('click', tagClass, function(event){
					var target = this;
					that.removeTag(target);
				});
			}

		},
		
		/**
		*Called when option key value is sent
		**/
		_setOption: function(key, value){
			console.log('setOption');
		}, 
		
		_effectExists: function(name) {
            		return Boolean($.effects && ($.effects[name] || ($.effects.effect && $.effects.effect[name])));
       		},
		
		/*** 
		*called when we need to gather the input from the tag and format it to be made into hmtl
		**/
		collectInput: function(){
			//save the val
			var value = $(this.tagInput).val();
			
			//clear the val
			$(this.tagInput).val('');
			
			//trigger to allow alteration of the value
			this._trigger('collectInput', null, {value: value});
			
			//now make the tag
			this.makeTag(value);
		},
		
		/***
		*Create the actual tag then refresh the hidden value
		***/
		makeTag: function(value){
			var tag = this.toTag(value);
						
			this._trigger('beforeTag', null, {tag: tag});
			
			//set the appropariate arrays
			this.values[this.values.length] = value;
			this.tags[this.tags.length] = tag;
			
			tag = $(tag);
			var that = this;
			if(this.options.animate){
				tag.hide(400, function(){
					tag.appendTo(that.tagBox).fadeIn('slow');
				});
			}
			else{
				tag.appendTo(this.tagBox);
			}
			
			this._trigger('afterTag', null, {tag: tag});
			
			this.refresh();
		},
		

		/***
		*Remove a tag from the box, name is a string
		****/
		removeTag: function(tag){			
			var name = $(tag).children('.name').first().text();
			
			tag = $(tag);
			
			var index = this.values.indexOf(name);
			
			this._trigger('beforeDelete', null, {target: tag});
			
			//now remove that element
			//then call refresh
			this.values.splice(index, 1);
			this.tags.splice(index, 1);
			
			if(this.options.animate){
				var hide_args = this._effectExists('blind') ? ['blind', {direction: 'horizontal'}, 'fast'] : ['fast'];
				var this_tag = this;
				
				hide_args.push(function(){
					tag.remove();
					this_tag._trigger('afterDelete', null, {tag: tag});
				});
				
				tag.fadeOut('fast').hide.apply(tag, hide_args).dequeue();
			}
			else{
				tag.remove();
				this._trigger('afterDelete', null);
			}
			
			
			
			this.refresh();
		},
		
		/***
		*This function is called if there is a value in the input tag at the beginning
		***/
		batchTags: function(){
			var rawString = $(this.element).val();
			var split = rawString.split(',');
			
			var tags = [];
			var tag;
			var i=0;
			for(i; i<split.length; i++){
				tag = this.toTag(split[i]);
				
				tags.push(tag);
				this.values.push(split[i]);
				this.tags.push(tag);
			}
			
			while(tags.length > 0){
				tag = tags.pop();
				this._trigger('beforeTag', null, {tag: tag});
				$(tag).appendTo(this.tagBox);
				this._trigger('afterTag', null, {tag: tag});
			}
		},
		
		/***
		*Look at the current value of the tags and update the hidden element
		***/
		refresh: function(){
			var values = "";
			var i = 0;
			for(i; i<this.values.length; i++){
				values += this.options.delimeter + this.values[i]; 
			}
			
			$(this.element).val(values.substring(1));
			
			console.log($(this.element).val());
		},
		
		/***
		*ToTag just takes a value and returns a tag
		***/
		toTag: function(value){
			return $('<span class="'+this.options.tag_class+'">'+
					'<span class="name">'+value+'</span>' +
					'<span class="tag-delete">&times</span>' +
				     '</span>');
		}
	});
	
})(jQuery);