class Operator {

	constructor(lhs, rhs) {
		this.lhs = lhs;
		this.rhs = rhs;
	}

}

class Add extends Operator {

	eval() {
		return this.lhs.eval() + this.rhs.eval();
	}

}

class Equal extends Operator {

	eval() {
		return this.lhs.eval() === this.rhs.eval();
	}

}

class Param {
	// Abstract superclass.
	reset() { }
	addVar(set) { }
}

class Value extends Param {

	constructor(value) {
		super();
		this.value = value;
	}

	match(value) {
		return this.value === value;
	}

	eval() {
		return this.value;
	}

}

class Wildcard extends Param {

	match(value) {
		return true;
	}

}

class Variable extends Param {

	constructor() {
		super();
		// Value is initially unknown.
		this.value = undefined;
	}

	match(value) {
		const thisValue = this.value;
		if (thisValue === undefined) {
			this.value = value;
			return true;
		} else {
			return thisValue === value;
		}
	}

	reset() {
		this.value = undefined;
	}

	addVar(set) {
		set.add(this);
	}

	eval() {
		return this.value;
	}

}

class InputSymbol {

	/**Creates a symbol.
	 * @param {string} name The symbol's name.
	 * @param {*[]} parameters The symbol's parameter values.
	 */
	constructor(name, parameters) {
		this.name = name;
		this.parameters = parameters;
	}

	match(symbol) {
		if (this.name !== symbol.name) {
			return false;
		}
		const thisParams = this.parameters;
		const otherParams = symbol.parameters;
		const numParams = otherParams.length;
		for (let i = 0; i < numParams; i++) {
			if (!otherParams[i].match(thisParams[i])) {
				return false;
			}
		}
		return true;
	}

}

const Specificity = Object.freeze({
	LESS_SPECIFIC: -1,
	EQUAL: 0,
	MORE_SPECIFIC: 1,
	INCOMPARABLE: 2,
});

class GrammarSymbol {

	/**Creates a symbol.
	 * @param {string} name The symbol's name.
	 * @param {Param[]} parameters The symbol's parameter pattern.
	 */
	constructor(name, parameters) {
		this.name = name;
		this.parameters = parameters;
	}

	addVars(set) {
		for (let param of this.parameters) {
			param.addVar(set);
		}
	}

	eval() {
		const args = [];
		for (let expression of this.parameters) {
			args.push(expression.eval());
		}
		return new InputSymbol(this.name, args);
	}

	compareSpecificity(symbol) {
		if (this.name !== symbol.name) {
			return Specificity.INCOMPARABLE;
		}

		const thisParams = this.parameters;
		const numThisParams = thisParams.length;
		const otherParams = symbol.parameters;
		const numOtherParams = otherParams.length;
		const numCommonParams = Math.min(numThisParams, numOtherParams);

		let moreSpecific = false;
		for (let i = numOtherParams; i < numThisParams; i++) {
			if (thisParams[i].value !== undefined || thisParams.indexOf(thisParams[i]) < i) {
				moreSpecific = true;
				break;
			}
		}
		let lessSpecific = false;
		for (let i = numThisParams; i < numOtherParams; i++) {
			if (otherParams[i].value !== undefined || otherParams.indexOf(otherParams[i]) < i) {
				lessSpecific = true;
				break;
			}
		}

		for (let i = 0; i < numCommonParams; i++) {
			const thisValue = thisParams[i].value;
			const otherValue = otherParams[i].value;

			if (thisValue === undefined) {
				if (otherValue !== undefined) {
					if (moreSpecific) {
						return Specificity.INCOMPARABLE;
					}
					lessSpecific = true;
				} else {

				}
			} else {
				if (otherValue === undefined) {
					if (lessSpecific) {
						return Specificity.INCOMPARABLE;
					}
					moreSpecific = true;
				} else if (thisValue !== otherValue) {
					return Specificity.INCOMPARABLE;
				}
			}
		}

		if (lessSpecific) {
			return Specificity.LESS_SPECIFIC;
		} else if (moreSpecific) {
			return Specificity.MORE_SPECIFIC;
		} else {
			return Specificity.EQUAL;
		}
	}
}

class Rule {

	constructor(prefix, symbol, suffix, condition, frequency, newSymbols) {
		this.prefix = prefix;
		this.lhsSymbol = symbol;
		this.suffix = suffix;
		this.condition = condition;
		this.frequency = frequency;
		this.rhsSymbols = newSymbols;
		const variables = new Set();
		this.variables = variables;
		for (let prefixSymbol of prefix) {
			prefixSymbol.addVars(variables);
		}
		symbol.addVars(variables);
		for (let suffixSymbol of suffix) {
			suffixSymbol.addVars(variables);
		}
	}

	match(input, index) {
		for (let variable of this.variables) {
			variable.reset();
		}
		let i = 0;

		for (prefixSymbol of this.prefix) {
			const inputSym = input[index + i];
			if (!inputSym.match(prefixSymbol)) {
				return undefined;
			}
			i++;
		}

		if (!input[index + i].match(this.lhsSymbol)) {
			return undefined;
		}
		i++

		for (suffixSymbol of this.prefix) {
			const inputSym = input[index + i];
			if (!inputSym.match(suffixSymbol)) {
				return undefined;
			}
			i++;
		}

		if (this.condition && !this.condition.eval()) {
			return undefined;
		}

		const output = [];
		for (let rhsSymbol of this.rhsSymbols) {
			output.push(rhsSymbol.eval());
		}
		return output;
	}

	compareSpecificity(rule) {

	}

}
