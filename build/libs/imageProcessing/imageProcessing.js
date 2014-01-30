// Self executing function, to not polute the global scope.
(function() {
	
	// Creating the class (JS prototype)
	var imageProcessing = function(container, options) {
		var scope 		= this;
		
		this.container 	= container;
		
		// Default options
		this.options = _.extend({
			src:		"http://i.imgur.com/Lzvw7g8.jpg",
			container:	$(),
			onBuild:	function() {}
		}, options);
		
		// Variables
		this.image	= {
			width:		false,
			height:		false
		};
		
		this.build(function() {
			scope.options.onBuild();
		});
	};
	
	// Build the canvas, resize it, load the image
	imageProcessing.prototype.build = function(callback) {
		var scope 		= this;
		
		// Load the image in the DOM, to get a callback and check its size
		var image = dom("img", this.container);
		image.hide();
		image.bind('load', function() {
			// Show the image
			image.show();
			
			// get the size
			scope.image.width		= image.width();
			scope.image.height		= image.height();
			
			// Delete the image, we don't need it anymore
			image.remove();
			
			// Build the canvas and set it to the image size
			scope.canvas = dom("canvas", scope.container);
			scope.canvas.attr('width', scope.image.width);
			scope.canvas.attr('height', scope.image.height);
			
			// Get the context
			scope.ctx 	= scope.canvas.get(0).getContext('2d');
			
			// Load the image on the canvas
			var canvasImage 	= new Image();
			canvasImage.onload = function() {
				scope.ctx.drawImage(canvasImage, 0, 0);
				
				callback();
			}
			canvasImage.src = scope.options.src;
			
			
		});
		image.bind('error', function() {
			alert("Image "+scope.options.src+" couldn't be loaded.");
		});
		image.attr('src', this.options.src);
		
	};
	
	// Reset the canvas and reload the image
	imageProcessing.prototype.reset = function(callback) {
		var scope 			= this;
		
		// Clear the canvas:
		this.ctx.clearRect(0, 0, this.image.width, this.image.height);
		
		var canvasImage 	= new Image();
		canvasImage.onload 	= function() {
			scope.ctx.drawImage(canvasImage, 0, 0, scope.image.width, scope.image.height);
			
			// Reload the image data
			scope.imageData = scope.ctx.getImageData(0, 0, scope.image.width, scope.image.height);
			
			callback();
		}
		canvasImage.src = this.options.src;
		
	};
	
	// Get the image data and cache it
	imageProcessing.prototype.getImageData = function() {
		if (!this.imageData) {
			this.imageData = this.ctx.getImageData(0, 0, this.image.width, this.image.height);
		}
		return this.imageData;
	};
	
	// Get a pixel's RGBA values
	imageProcessing.prototype.getPixel = function(x, y) {
		var imageData	= this.ctx.getImageData(x, y, 1, 1);
		var data		= imageData.data;
		
		return {
			r:	data[0],
			g:	data[1],
			b:	data[2],
			a:	data[3]
		};
	};
	
	// Update the imageData (but do not apply it, run apply() when you're done)
	imageProcessing.prototype.setPixels = function(x, y, rgba) {
		var imageData	= this.getImageData();
		// Find the index
		index = (x + y * imageData.width) * 4;
		imageData.data[index+0] = rgba.r;
		imageData.data[index+1] = rgba.g;
		imageData.data[index+2] = rgba.b;
		imageData.data[index+3] = rgba.a;
		return rgba;
	};
	
	// Apply the updated imageData
	imageProcessing.prototype.apply = function() {
		this.ctx.putImageData(this.imageData, 0, 0);
	};
	
	// Scan an image, pixel by pixel, adn apply the filter (callback - function) on each one
	imageProcessing.prototype.scan = function(filter, options) {
		options = _.extend({
			increment:	1,
			from:		[0,0],
			to:			[this.image.width,this.image.height]
		}, options);
		
		// Get the image data
		var imageData	= this.getImageData();
		var data		= imageData.data;
		
		var x, y;
		
		// Scan the image, get RGBA values and execute the filter
		for(var y=options.from[1]; y<options.to[1]; y+=options.increment) {
			for(var x=options.from[0]; x<options.to[0]; x+=options.increment) {
				var rgba = {
					r:	data[((this.image.width * y) + x) * 4],
					g:	data[((this.image.width * y) + x) * 4 + 1],
					b:	data[((this.image.width * y) + x) * 4 + 2],
					a:	data[((this.image.width * y) + x) * 4 + 3]
				};
				filter(x, y, rgba);
			}
		}
		
		return data;
	};
	
	
	
	// Convert to grayscale
	imageProcessing.prototype.grayscale = function() {
		var scope 			= this;
		this.scan(function(x, y, rgba) {
			
			var pxc = Math.round((rgba.r+rgba.g+rgba.b)/3);
			
			scope.setPixels(x, y, {
				r:	pxc,
				g:	pxc,
				b:	pxc,
				a:	rgba.a	// We do not change the Alpha
			});
		});
		this.apply();
	};
	
	// Utility: Create new DOM elements, returns a jQuery object
	var dom = function(nodeType, appendTo, raw) {
		var element = document.createElement(nodeType);
		if (appendTo != undefined) {
			$(appendTo).append($(element));
		}
		return (raw === true)?element:$(element);
	};
	
	// Export the class
	window.imageProcessing = imageProcessing;
})();