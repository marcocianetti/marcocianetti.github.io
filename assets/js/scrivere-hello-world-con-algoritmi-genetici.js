const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,;.:-_+/\'^$!|';

function onWindowLoad(callback) {
	if (document.readyState === 'complete') {
		callback();
	} else {
		window.addEventListener('load', callback);
	}
}

function createGeneticAlgorithm() {
	const ga = Genetic.create();

	ga.optimize = Genetic.Optimize.Maximize;
	ga.select1 = Genetic.Select1.Tournament2;
	ga.select2 = Genetic.Select2.Tournament2;

	// Seed: create a new chromosomal
	ga.seed = function() {

		const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,;.:-_+/\'^$!|';

		function getRandomChar() {
			return CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
		}

		function getRandomString(size) {
			var text = '';
			for(var i = 0; i < size; i++) {
				text += getRandomChar();
			}
		
			return text;
		}

		return getRandomString(this.userData.solution.length);
	};

	// Mutate: mutate a chromosomal
	ga.mutate = function(entity) {

		const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ,;.:-_+/\'^$!|';

		function getRandomChar() {
			return CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
		}

		function replaceChar(str, index, char) {
			return str.substr(0, index) + char + str.substr(index + 1);
		}
		
		// chromosomal drift
		var randomGeneIndex = Math.floor(Math.random() * entity.length);

		// return replaceChar(entity, i, String.fromCharCode(entity.charCodeAt(i) + (Math.floor(Math.random()*2) ? 1 : -1)));
		return replaceChar(entity, randomGeneIndex, getRandomChar());
	};

	// Crossover: generate two new chromosomals 
	ga.crossover = function(mother, father) {

		function onePointCrossover() {
			const size = mother.length;
			var crossoverPoint = Math.floor(Math.random() * size);
				
			var son = father.substr(0, crossoverPoint) + mother.substr(crossoverPoint, size);
			var daughter = mother.substr(0, crossoverPoint) + father.substr(crossoverPoint, size);
			
			return [son, daughter];
		}

		function twoPointsCrossover() {
			var size = mother.length;
			var ca = Math.floor(Math.random() * size);
			var cb = Math.floor(Math.random() * size);		
			if (ca > cb) {
				var tmp = cb;
				cb = ca;
				ca = tmp;
			}
				
			var son = father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb);
			var daughter = mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb);
			
			return [son, daughter];
		}
		
		return onePointCrossover();
	};
	
	// Fitness: calc the fitness score for a chromosomal
	ga.fitness = function(entity) {

		function exactMatchFitness(solution) {
			let fitness = 0;
			for (let i = 0; i < entity.length; i++) {

				// Increase fitness for each character that matches
				if (entity[i] === solution[i]) {
					fitness += 1;
				}
			}
		
			return fitness;
		}

		function similarityMatchFitness(solution) {
			let fitness = 0;
			for (let i = 0; i < entity.length; i++) {
	
				// Increase fitness for each character that matches
				if (entity[i] == solution[i]) {
					fitness += 1;
				}
				
				// Award fractions of a point as we get warmer
				fitness += (127 - Math.abs(entity.charCodeAt(i) - solution.charCodeAt(i))) / 50;
			}
		}

		return exactMatchFitness(this.userData.solution);
	};
	
	// Generation: return true if the algorithm has found a solution
	ga.generation = function(pop, generation, stats) {
		
		// Stop running once we've reached the solution
		return pop[0].entity !== this.userData.solution;
	};
	
	// Notification: (the only function called on main thread) is used to notify the user with the actual population score
	ga.notification = function(pop, generation, stats, isFinished) {
		
		const value = pop[0].entity;
		this.last = this.last || value;
		
		// If there is no change from last top value then we skip the page update
		if (pop !== 0 && value === this.last) {
			return;
		}
		
		var solution = [];
		for (let i = 0; i < value.length; i++) {
			var diff = value.charCodeAt(i) - this.last.charCodeAt(i);
			var style = ''
			if (diff > 0) {
				style = 'background: rgb(0, 200, 50);';
			} else if (diff < 0) {
				style = 'background: rgb(0, 100, 50);';
			}
	
			solution.push(`<span style="${style}">${value[i]}</span>`);
		}
		
		var buf = '';
		buf += `<tr class="table__row">`;
		buf += `<td class="table__cell">${generation}</td>`;
		buf += `<td class="table__cell">${pop[0].fitness.toPrecision(3)}</td>`;
		buf += `<td class="table__cell">${solution.join('')}</td>`;
		buf += '</tr>';
		
		const resultsTable = document.querySelector('#results-table > tbody');
		resultsTable.innerHTML = buf + resultsTable.innerHTML;
		
		this.last = value;
	};

	return ga;
}

function init() {

	const genetic = createGeneticAlgorithm();

	var startButton = document.querySelector('#start-button');
	var solutionInput = document.querySelector('#solution-input');
	var resultsTable = document.querySelector('#results-table > tbody');
	var solutionInputError = document.querySelector('#solution-input-error');
	
	const gaConfig = {
		iterations: 5000,
		size: 25,
		crossover: 1,
		mutation: 0.3,
		skip: 10,
	};

	function handleStartClick() {
		var solution = (solutionInput.value || '').trim();
		if (solution.length === 0 || solution.length >= 30) {
			solutionInputError.textContent = 'Inserisci un testo minore di 30 caratteri';
			solutionInputError.classList.remove('hidden');
			return;
		}

		for (let i = 0; i < solution.length; i++) {
			if (CHARSET.indexOf(solution[i]) === -1) {
				solutionInputError.textContent = `Il carattere "${solution[i]}" non è ammesso`;
				solutionInputError.classList.remove('hidden');
				return;
			}
		}
		
		solutionInputError.classList.add('hidden');
		solutionInputError.textContent = '';

		var userData = {
			solution,
		};

		resultsTable.innerHTML = '';

		genetic.evolve(gaConfig, userData);
	}
	
	function handleSolutionInputChange() {
		solutionInputError.classList.add('hidden');
		solutionInputError.textContent = '';
	}

	solutionInput.addEventListener('input', handleSolutionInputChange);
	startButton.addEventListener('click', handleStartClick);
}

// Start here
onWindowLoad(init);