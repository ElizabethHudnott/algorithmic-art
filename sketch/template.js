/* A template for creating new sketches. At present this is beta quality and subject to
 * potential future revisions, including the possibility of incompatible changes.
 */

export default function MySketch() {
	const me = this;
	this.title = 'My Sketch';
	this.helpFile = 'my-sketch-help.html'; // Optional
	this.backgroundColor = [0, 0, 0]; // Optional. Suggested background color as [r, g, b].

	this.optionsDocument = downloadFile('my-sketch.html', 'document').then(function (optionsDoc) {
		/* Here we download the HTML file containing controls for adjusting the
		 * sketch's parameters and attach our event handlers to them. Query operations
		 * such as optionsDoc.getElementById won't work after this function returns.
		 */

		optionsDoc.getElementById('my-parameter').addEventListener('input', function (event) {
			const value = parseFloat(this.value);
			if (Number.isFinite(value)) {
				me.myParameter = value;
				generateBackground(0); // Zero is the preview level. See generate() comments.
			}
		});

		// Add more event listeners here.

		return optionsDoc;
	});

	// Establish initial values for the sketch's parameters.
	this.myParameter = 0;
	this.myThingyMin = 0;
	this.myThingyMax = 10;
}

/** This property is optional and if it is provided then each of the object's properties
 *  is also optional. It lists the names of the parameters that can be animated and
 *  specifies the manner in which they should be animated.
 */
MySketch.prototype.animatable = {
	/* Names of parameters that hold floating point values, RGB (or RGBA) colour values,
	 * arrays of floats or arrays of colours should be listed here if they're not listed
	 * under the pairedContinuous or xy properties instead (see below).
	 */
	continuous: [
		'myParameter'
	],

	// Integer, boolean, string or object typed parameters and arrays of integers go here.
	stepped: [
	],

	// Arrays of booleans, arrays of strings or arrays of objects go here.
	nominalArray: [
	],

	/* Paired parameters are useful for things like when two parameters determine the
	 * start and end points of a line. When end - start = 0 in the beginning and at the
	 * end then the start and end frames have an equivalence, a zero length line in this
	 * case. This lets us make interesting looped animations where we first move the
	 * start point and then move the end point to make it catch up with the start point.
	 */
	pairedContinuous: [
		['myThingyMax', 'myThingyMin']
	],

	pairedStepped: [
	],

	/* [x, y] pairs are described in the same way as other pairs but instead we interpret
	 * the start and end values as two points on a plane and move around the plane in a
	 * sort of figure-of-eight shape.
	 */
	xy: [
	]

};

/** This method is called by the environment whenever it needs to redraw the image.
 *	@param {CanvasRenderingContext2D} context The canvas context to draw onto.
 *	@param {number} canvasWidth The area the method is supposed to fill and confine itself within.
 *	@param {number} canvasHeight The area the method is supposed to fill and confine itself within.
 *	@param {number} preview The preview level. Zero means a complete redraw with
 *		maximum detail. Your event handlers can use other numbers with sketch specific
 *		meanings.
 */
MySketch.prototype.generate = function* (context, canvasWidth, canvasHeight, preview) {

	// We do our drawing here. For demo purposes I'll assume you'll be using some sort of loop.
	for (let i = 0; ...; i++) {

		// Occasionally check if we need to relinquish control back to the GUI.
		unitsProcessed++;

		if (unitsProcessed >= benchmark) {
			const now = calcBenchmark();
			if (now >= yieldTime) {
				/* Important! If you previously used context.save() then call
				 * context.restore() here so we don't accumulate saved states on the stack
				 * if the environment decides to abort drawing.
				 */
				yield;
				/* Add context.save() here if needed, so that context.restore() doesn't
				 * get called too many times.
				 */
			}
		}
	}
}
