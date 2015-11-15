angular.module('Pipter', []);

angular.module('Pipter').service('Pipter', function ($http, $q) {
	var my = {};
	var that = {};

	that.list = function () {
		var dfd = $q.defer();
		$http.get('api/index').then(function (response) {
			my.references = response.data;
			dfd.resolve(my.references);
		});
		return dfd.promise;
	};

	that.refresh = function(image) {
		var dfd = $q.defer();
		$http.get('api/refresh', { params: {image: image} }).then(function(response) {
			dfd.resolve(response.data);
		});
		return dfd.promise;
	};

	that.accept = function(image) {
		var dfd = $q.defer();
		$http.get('api/accept', { params: {image: image} }).then(function(response) {
			dfd.resolve(response.data);
		});
		return dfd.promise;
	};

	return that;
});


angular.module('Pipter').controller('main', function ($rootScope, $scope, Pipter) {
	$rootScope.pending = 0;
	$rootScope.failed = 0;
	$rootScope.success = 0;

	Pipter.list().then(function (images) {
		$scope.references = images;
	});
});

angular.module('Pipter').directive('diffView', function ($q, $parse, $rootScope, Pipter) {
	var difference = function(a, b, c) {
		var diff, canvas, context;

		// Once they are ready, create a diff.
		// This returns an ImageData object.
		diff = imagediff.diff(a, b, { align: 'top' });
		equal = imagediff.equal(a, b);

		console.log('images are equal?', equal);
		
		// Now create a canvas,
		canvas = imagediff.createCanvas(diff.width, diff.height);
		// get its context
		context = canvas.getContext('2d');
		// and finally draw the ImageData diff.
		context.putImageData(diff, 0, 0);
		// Add the canvas element to the container.
		c.appendChild(canvas);

		return equal;
	};

	var loadImg = function($img) {
		var dfd = $q.defer();
		$img.on('load', function() {
			dfd.resolve($img);
		});
		return dfd.promise;
	};

	var compare = function($scope, $elem) {
		var imgs = [];
		imgs.push(loadImg($elem.find('.reference img')));
		imgs.push(loadImg($elem.find('.current img')));
		$rootScope.pending = $rootScope.pending + 1;
		$q.all(imgs).then(function(images) {
			$rootScope.pending = $rootScope.pending - 1;
			$scope.equal = difference(images[0].get(0), images[1].get(0), $elem.find('.diff').get(0));
			if(!$scope.equal) {
				$rootScope.failed = $rootScope.failed + 1;
			}
			else {
				$rootScope.success = $rootScope.success + 1;
			}
		});
	};


	return {
		restrict: 'E',
		templateUrl: 'diffview.html',
		link: function ($scope, elem, attrs) {
			$scope.image = $parse(attrs.image)($scope);
			$scope.name = $scope.image.replace('.png', '').replace('.', '/');
			compare($scope, $(elem));

			$scope.refresh = function() {
				$scope.equal = undefined;
				Pipter.refresh(this.image).then(function(image) {
					$scope.image = image + '?'+ new Date().valueOf();
					compare($scope, $(elem));
				});
			};

			$scope.accept = function() {
				$scope.equal = undefined;
				Pipter.accept(this.image).then(function(image) {
					$scope.image = image + '?'+ new Date().valueOf();
					compare($scope, $(elem));
				});
			};
		}
	};

});