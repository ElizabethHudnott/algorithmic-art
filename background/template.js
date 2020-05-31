/* A template for creating new sketches. At present this is beta quality and subject to
 * potential future revisions (including the possibility of breaking changes).
 */

function MySketch() {
	const me = this;
	this.title = 'My Sketch';
	this.hasRandomness = true;
	this.credits = 'Acknowledgements go here.'; // Optional

	this.optionsDocument = downloadFile('my-sketch.html', 'document').then(function (optionsDoc) {
		/* Here we download the HTML file containing the controls for adjusting the
		 * sketch's parameters and attach our event handlers to them. Query operations
		 * such as optionsDoc.getElementById won't work after this function returns so
		 * be sure to save any references you need in local variables rather than
		 * using these functions inside the event handlers.
		 */

		optionsDoc.getElementById('my-parameter').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.myParameter = value;
				generateBackground(0); // Zero is the preview level. See generate().
			}
		});

		// ... add more event listeners here ...

		return optionsDoc;
	});

	// Establish the initial values for the sketch's parameters.
	this.myParameter = 0;
	this.myThingyMin = 0;
	this.myThingyMax = 10;
}

/** This method is optional. During animation the environment will assign values
 *  directly to the sketch's parameters' properties. If this causes the results of any
 *  cached calculations to become invalid then erase that data here.
 */
MySketch.prototype.purgeCache = function () {

}

/** This property is optional and if it is provided then each of the object's properties
 *  is also optional. It lists the names of the parameters that can be animated and
 *  specifies the manner in which they should be animated.
 */
MySketch.prototype.animatable = {
	/* Floating point numbers, colours and arrays containing these values of these
	 * types can be interpolated between the start and end frames in a smooth manner.
	 */
	continuous: [
		'myParameter'
	],
	// Integers and other data types can be adjusted in discrete jumps.
	stepped: [
	],
	/* Paired parameters are useful for things like when two parameters determine the
	 * start and end points of a line. When end - start = 0 in the beginning and at the
	 * end then the start and end frames have an equivalence, a zero length line.
	 * This lets us make more interesting looped animations where we first move the
	 * start point and then move the end point to make it catch up with the start point.
	 */
	pairedContinuous: [
		['myThingyMax', 'myThingyMin']
	],
	pairedStepped: [
	]
};

/** This method is called by the environment whenever it needs to redraw the image.
 *	@param {CanvasRenderingContext2D} context The context to draw with and to draw onto.
 *	@param {number} canvasWidth The area the method is supposed to fill and confine itself within.
 *	@param {number} canvasHeight The area the method is supposed to fill and confine itself within.
 *	@param {number} preview The preview level. Zero means a complete redraw with
 *		maximum detail. Your event handlers can use other numbers with sketch specific
 *		meanings.
 */
MySketch.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {
	let beginTime = performance.now();

	// Do our drawing here. I'll assume you'll be using some sort of loop.
	for (let i = 0; ...; i++) {

		/* Occasionally check if we need to relinquish control back to the GUI. Adjust
		 * the numeric values according to need.
		 */
		if (i % 20 === 19 && performance.now() >= beginTime + 20) {
			yield;
			beginTime = performance.now();
		}
	}
}

return MySketch;
