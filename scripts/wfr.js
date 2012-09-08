$(document).ready(function(){

	// semantic class to give meaning to the reference numbers
	// reference is the direction where the robot should turn first if it has the possibility to
	var Reference = {
	
		left: 1,
		right: 0,
		
	};
	
	// semantic class to give meaning to direction numbers
	var Direction = {
		
		top: 1,
		right: 2,
		bottom: 3,
		left: 4,
		
	};
	
	// class for representing a map
	function Map(mC, m){
	
		this.mapCanvas = mC;
		this.rawMap = m;
		this.arrayMap = [];
		
		
		
		// function to draw the map on the map canvas
		this.draw = function(){
			
			var stringMap = '';
	
			for(var r in this.arrayMap){
				for(var c in this.arrayMap[r]){
					if(this.arrayMap[r][c] == 0){
						stringMap += '&nbsp;&nbsp;';
					}
					else{
						stringMap += this.arrayMap[r][c]+'&nbsp;';
					}
				}
				stringMap += '<br>';
			}
			
			this.mapCanvas.html(stringMap);
				
		};
		
		// function to translate the map into a numeric matrix
		this.parse = function(){
			
			var rawMap = $.trim(this.rawMap.replace(/[ \t\r]+/g,''));
			var rawRows = rawMap.split("\n");
			
			var arrayMap = new Array();
			
			for(var row in rawRows){
			
				var cells = rawRows[row].split('');
				var intCells = new Array();
				
				for(var cell in cells){
					
					intCells.push(parseInt(cells[cell]));
				}
				
				arrayMap.push(intCells);
			}
			
			this.arrayMap = arrayMap;
			
		};
		
		this.parse();
		
		// updates the robot position on the map
		this.updateRobotPosition = function(oldPos, newPos){
		
			
			this.arrayMap[oldPos.y][oldPos.x] = 0;
			this.arrayMap[newPos.y][newPos.x] = 2;
			
			this.draw();
		};
		
		this.surroundingsOf = function(pos){
		
			var surroundings = [];
			var relRows = this.arrayMap.slice(pos.y -1, pos.y +2);
		
			for(var relRow in relRows){
				var relCells = relRows[relRow].slice(pos.x -1, pos.x +2);
				surroundings.push(relCells);
			}
			
			return surroundings;
		};
	};

	// helper function that checks the map for a (2) and instantiates a new robot
	function robotFromMap(map){
		
		var position = {};
		
		var arrMap = map.arrayMap;
		
		for(var r in arrMap){
			for(var c in arrMap[r]){
				if(arrMap[r][c] == 2){
					position = {y: parseInt(r), x: parseInt(c)}; // use the y, x notation
				}
			}
		}
		
		// first reference is choosen randomly
		var reference = Math.round(Math.random());
		
		return new Robot(map, Direction.top, position, Reference.left);
	}
	
	// robot class for storing robot's info (direction, position, reference wall)
	function Robot(map, direction, position, reference){
		
		this.map = map;
		this.direction = direction;
		this.position = position;
		this.reference = reference;
		this.view = new View(this.map, this.direction, this.position);
		
		// return the coordinates in order to update the map
		this.moveForward = function(){
			switch(this.direction){
				
				case Direction.top:
					this.position.y--;
				break;
				case Direction.right:
					this.position.x++;
				break;
				case Direction.bottom:
					this.position.y++;
				break;
				case Direction.left:
					this.position.x--;
				break;
				
			}
		};
		
		
		this.turnLeft = function(){
			
			switch(this.direction){
				
				case Direction.top:
					this.position.x--;
					this.direction = Direction.left;
				break;
				case Direction.right:
					this.position.y--;
					this.direction = Direction.top;
				break;
				case Direction.bottom:
					this.position.x++;
					this.direction = Direction.right;
				break;
				case Direction.left:
					this.position.y++;
					this.direction = Direction.bottom;
				break;
			}
		};
		
		this.turnRight = function(){
			
			switch(this.direction){
			
				case Direction.top:
					this.position.x++;
					this.direction = Direction.right;
				break;
				case Direction.right:
					this.position.y++;
					this.direction = Direction.bottom;
				break;
				case Direction.bottom:
					this.position.x--;
					this.direction = Direction.left;
				break;
				case Direction.left:
					this.position.y--;
					this.direction = Direction.top;
				break;
			}
		};
		
		this.moveBack = function(){
			
			switch(this.direction){
			
				case Direction.top:
					this.position.y++;
					this.direction = Direction.bottom;
				break;
				case Direction.right:
					this.position.x--;
					this.direction = Direction.left;
				break;
				case Direction.bottom:
					this.position.y--;
					this.direction = Direction.top;
				break;
				case Direction.left:
					this.position.x++;
					this.direction = Direction.right;
				break;
				
			}
		};
		
		this.updateView = function(){
		
			this.view = new View(this.map, this.direction, this.position);
			
		};
		
		this.run = function(){
		
			// copy the position values not the object
			var currentPosition = $.extend({},r.position);
			
			// chose where to move the robot based on its view
			
			if(this.reference == Reference.left && this.view.canTurnLeft()){
				this.turnLeft();
			}
			else if(this.reference == Reference.right && this.view.canTurnRight()){
				this.turnRight();
			}
			else if(this.view.canMoveForward()){
				this.moveForward();
			}
			else if(this.reference == Reference.left && this.view.canTurnRight()){
				this.turnRight();
			}
			else if(this.reference == Reference.right && this.view.canTurnLeft()){
				this.turnLeft();
			}
			else if(this.view.canMoveBack()){
				this.moveBack();
			}
			else if(this.view.couldMoveForward()){
				this.moveForward();
			}
			
			// draw the new map
			
			/*console.log(currentPosition);
			console.log(r.position);*/
			
			this.map.updateRobotPosition(currentPosition, this.position);
						
			// update the robot's view
			this.updateView();
			
		};
	}
	
	// view class for representing what the robot has in front of its eyes (map, position, direction)
	function View(map, direction, position){
		
		this.map = map;
		this.direction = direction;
		this.position = position;
		
		// get the surroundings of the robot
		this.surroundings = this.map.surroundingsOf(this.position);
		
		// orient them based on the direction so that our calculations can be made easy.
		this.orientedsurroundings = [];
		
		switch(this.direction){
			case Direction.top:
				this.orientedsurroundings = this.surroundings;
			break;
			case Direction.right:
				this.orientedsurroundings = rotate90(this.surroundings);
			break;
			case Direction.bottom:
				this.orientedsurroundings = rotate180(this.surroundings);
			break;
			case Direction.left:
				this.orientedsurroundings = rotate270(this.surroundings);
			break;
			
		}
		
		this.canMove = function(c, r){
			
			var sum = 0;
			
			// let's find the sum of the surroundings of the iphotetical new direction
			for(var i = -1; i <= 1; i++){
				for(var j = -1; j <= 1; j++){
					if(typeof(this.orientedsurroundings[r+i]) !== 'undefined' && typeof(this.orientedsurroundings[r+i][c+j]) !== 'undefined'){
						sum += this.orientedsurroundings[r+i][c+j];
					}
				}
			}
			
			// if the sum of the surroundings of the new point is greater than 2 (cause of the robot count) we can move
			if(sum > 2 && !this.orientedsurroundings[c][r]){
				return true;
			}
			return false;
		};
		
		// the robot has the possibility to move forward only if it has a free square on the front and a reference square on the top-right or top-left side
		// or if it has a free square in front and both left and right reference corners
		this.canMoveForward = function(){
			
			return this.canMove(0,1);
		};
		
		// helper function in case the robot is completely free
		this.couldMoveForward = function(){
			
			if(!this.canMoveForward() && !this.orientedsurroundings[0][1]){
				return true;
			}
			return false;
				
		};
		
		// the robot has the possibility to turn left only if it has a free square on the left and a reference square on the back-left side
		this.canTurnLeft = function(){
		
			return this.canMove(1,0);
		};
		
		// the robot has the possibility to turn right only if it has a free square on the right and a reference square on the back-right side
		this.canTurnRight = function(){
			return this.canMove(1,2);
		};
		
		// the robot has the possibility to move back only if it has a free square behind and a reference wall on the back-left or back-right side
		this.canMoveBack = function(){
			return this.canMove(2,1);
		};
	};
	
	function rotateCCW(arr){
		var newArray = [[0,0,0],[0,0,0],[0,0,0]];
		var M = 3;
		var N = 3;
		for (var r = 0; r < M; r++) {
			for (var c = 0; c < N; c++) {
			    newArray[c][M-1-r] = arr[r][c];
			    
			}
		}
		return newArray;
	};
	
	function rotate90(arr){
		
		// apply 3 CCW rotations
		return rotateCCW(rotateCCW(rotateCCW(arr)));
	};
	
	function rotate180(arr){
		
		// apply 2 CCW rotations
		return rotateCCW(rotateCCW(arr));
	};
	
	function rotate270(arr){
	
		// apply 1 CW rotation
		return rotateCCW(arr);
		
	};
	
	var m = new Map($('#map-canvas'), $('#simple-map').html());
	m.draw();
	
	var r = robotFromMap(m);
	
	function run(){
		r.run();
	}
	
	setInterval(run, 1000);

});