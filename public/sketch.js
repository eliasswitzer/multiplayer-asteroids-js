var stage = 0;
var asteroidsMenu = [];

var myShip;
var teammateShips = [];
var asteroids = [];
var lasers = [];
var teammateLasers = [];
var teammateColors = [];

var roomCode;
var enteringCode = false;
var code;

var jgHover = false;
var cgHover = false;
var subHover = false;
var htpHover = false;
var backHover = false;

var playerCount = 0;
var countdown = 60;

var level = 0;
var colorUI = 0;

var invincible = false;
var invincibilityTimer = 4;

function setup() {
	createCanvas(800, 575);
	roomCode = createInput();
	roomCode.position(-1000,-1000);
	myShip = new Ship();

	for (var i = 0; i < 10; i++) {
		asteroidsMenu.push(new Asteroid);
	}

	socket.on('roomFound', function(data) {
		countdown = data.countdown;
		socket.emit('joinGame', data);
	});

	socket.on('waiting', function(data) {
		myShip.colorChoice = data.colorChoice;
		stage = 1;
		code = data.code;
		roomCode.position(-100, -100);
		populatePlayer();
	});
	socket.on('colorChanged', function(data) {
		myShip.colorChoice = data.choice;
	})
	socket.on('teammateColorChanged', function(teammateColor) {
		for (var i = 0; i < teammateShips.length; i++) {
			if (teammateColor.id == teammateShips[i].id) {
				teammateShips[i].colorChoice = teammateColor.current;
			}
		}
	});
	socket.on('playerJoined', function(data) {
		playerCount = data.playerCount;
	});
	socket.on('playerLeft', function(data){
		teammateLeft(data);
	});
	socket.on('timer', function(data){
		countdown = data.countdown;
	});
	socket.on('gameStart', function(){
		stage = 2;
		var id = socket.id;
	});
	socket.on('asteroidsPopulated', function(data) {
		populateAsteroids(data);
		invincibilityTimer = 4;
		invincible = true;
	});
	socket.on('asteroidsUpdated', function(data) {
		updateAsteroids(data);
	});
	socket.on('teammatesPopulated', function(data){
		teammatesPopulated(data);
	});
	socket.on('playersUpdated', function(data){
		if (stage == 2) playersUpdated(data);
	});
	socket.on('shipWasSaved', function() {
		myShip.isDamaged = false;
		myShip.onCooldown = false;
	});
	socket.on('teammateLaserCreated', function(data) {
		teammateLaserCreated(data);
	});
	socket.on('teammateLaserUpdated', function(data) {
		teammateLaserUpdated(data);
	});
	socket.on('laserHitAsteroid', function() {
		lasers.splice(0, 1);
		myShip.onCooldown = false;
	});
	socket.on('teammateLaserHitAsteroid', function(data) {
		for (var i = 0; i < teammateLasers.length; i++) {
			if (teammateLasers[i].id == data.id) {
				teammateLasers.splice(i, 1);
			}
		}
	})
	socket.on('asteroidHit', function(asteroid) {
		asteroidHit(asteroid);
	})
	socket.on('asteroidSplit', function(newAsteroids) {
		asteroidSplit(newAsteroids);
	});
	socket.on('invTimerUpdated', function() {
		invincibilityTimer--;

		if(invincibilityTimer == 0) {
			invincible = false;
		}
	})
	socket.on('gameOver', function(data) {
		level = data.level;
		stage = 3;
		invincibilityTimer = 4;
		invincible = false;
	});
}

function draw() {
	background(0);
	checkHover();

	if (stage == 0) {
		displayMainMenu();
	}
	else if (stage == 1) {
		displayWaiting();
	}
	else if (stage == 2) {
		displayGame();
		shipUpdated();
	}
	else if (stage == 3) {
		displayGameOver();
	}
	else if (stage == -1) {
		displayHowToPlay();
	}
}

function displayMainMenu() {
	for (var i = 0; i < asteroidsMenu.length; i++) {
		asteroidsMenu[i].update();
		asteroidsMenu[i].checkEdges();
		asteroidsMenu[i].render();
	}

	push();
	fill(255);
	textSize(52);
	textAlign(CENTER, CENTER);
	text("A S T E R O I D S", width/2, 150);

	rectMode(CENTER);
	stroke(255);
	strokeWeight(3);
	if(!cgHover) noFill();
	else fill(255, 70);
	rect(width/2, 380, 150, 60);
	if(!htpHover) noFill();
	else fill(255, 70);
	rect(525, 380, 60, 60);
	textSize(18);
	fill(255);
	strokeWeight(1);
	text("JOIN GAME", width/2, 300);
	text("CREATE GAME", width/2, 380);
	textSize(24);
	text("?", 525, 380);
	pop();

	if (!enteringCode) {
		push();
		rectMode(CENTER);
		if(!jgHover) noFill();
		else fill(255, 70);
		stroke(255);
		strokeWeight(3);
		rect(width/2, 300, 150, 60);
		pop();
	}
	else if (enteringCode) {
		roomCode.position(width/2 - 74, 290);
		roomCode.size(140);
		push()
		fill(255);
		textSize(14)
		textAlign(CENTER, CENTER);
		text("ENTER ROOM CODE", 200, 300);
		text("SUBMIT", 600, 300);
		if(!subHover) noFill();
		else fill(255, 70);
		stroke(255);
		strokeWeight(3);
		rectMode(CENTER);
		rect(600, 300, 100, 40);
		pop();
	}
}

function checkHover() {
	if (stage == 0 || stage == 3) {
		if(mouseX > width/2-75 && mouseX < width/2+75 && mouseY > 270 && mouseY < 330) jgHover = true;
		else jgHover = false;

		if(mouseX > width/2-75 && mouseX < width/2+75 && mouseY > 350 && mouseY < 410) cgHover = true;
		else cgHover = false;

		if(mouseX > 550 && mouseX < 650 && mouseY > 280 && mouseY < 320) subHover = true;
		else subHover = false;

		if(mouseX > 495 && mouseX < 555 && mouseY > 350 && mouseY < 410) htpHover = true;
		else htpHover = false;
	}
	else if (stage == -1) {
		if(mouseX > 670 && mouseX < 730 && mouseY > 470 && mouseY < 530) backHover = true;
		else backHover = false;
	}
}

function displayHowToPlay() {
	for (var i = 0; i < asteroidsMenu.length; i++) {
		asteroidsMenu[i].update();
		asteroidsMenu[i].checkEdges();
		asteroidsMenu[i].render();
	}
	push();
	fill(255);
	textSize(32);
	text('H O W  T O  P L A Y:', 50, 60);
	pop();

	push();
	noFill();
	stroke(255);
	strokeWeight(3);
	rectMode(CENTER);
	square(400, 150, 80);
	square(400, 250, 80);
	square(300, 250, 80);
	square(500, 250, 80);
	rect(400, 330, 200, 40);
	fill(255);
	noStroke();
	textAlign(CENTER,CENTER);
	textSize(18);
	text('up / W', 400, 150);
	text('down / S', 400, 250);
	text('left / A', 300, 250);
	text('right / D', 500, 250);
	text('spacebar', 400, 330);
	stroke(255);
	strokeWeight(2);
	line(360, 150, 270, 130);
	line(260, 250, 170, 260);
	line(540, 250, 630, 230);
	line(500, 330, 590, 330);
	noStroke();
	text('boost', 240, 130);
	text('turn left', 130, 260);
	text('turn right', 675, 230);
	text('shoot laser', 645, 330);
	textAlign(LEFT, TOP);
	text('- You gain a point every time all the asteroids of a level are destroyed.', 50, 400);
	text('- If all ships are destroyed, it is game over.', 50, 425);
	text('- Large asteroids are split in two when hit by a laser.', 50, 450);
	text('- Each level has an increasing chance of being harder than the last.', 50, 475);
	pop();

	push();
	rectMode(CENTER);
	if(!backHover) noFill();
	else fill(255, 70);
	strokeWeight(3);
	stroke(255);
	rect(700, 500, 60, 60);
	textAlign(CENTER, CENTER);
	textSize(24);
	fill(255);
	strokeWeight(1);
	text("<", 700, 500);
	pop();
}

function displayWaiting() {
	push();
	fill(255);
	textAlign(CENTER, CENTER);
	textSize(32);
	if (playerCount <= 3) {
		text("Waiting for players", width/2, 150);
	}
	else if (playerCount == 4) {
		text("Game will start soon", width/2, 150);
	}
	textSize(26);
	text("Room Code: " + code, width/2, 250);
	text("Players Waiting: " + playerCount, width/2, 300);
	text(countdown, width/2, 400);
	pop();

	push();
	rectMode(CENTER);
	stroke(255);
	strokeWeight(2);
	fill(255, 255, 102);
	rect(150, 150, 120, 50);
	fill(252, 110, 34);
	rect(150, 225, 120, 50);
	fill(255, 20, 147);
	rect(150, 300, 120, 50);
	fill(195, 76, 246);
	rect(150, 375, 120, 50);
	fill(184, 251, 60);
	rect(650, 150, 120, 50);
	fill(92, 229, 222);
	rect(650, 225, 120, 50);
	fill(88, 153, 251);
	rect(650, 300, 120, 50);
	fill(253, 203, 252);
	rect(650, 375, 120, 50);
	pop();

	push();
	fill(0);
	textAlign(CENTER, CENTER);
	textSize(16);
	if (myShip.colorChoice >= 1 && myShip.colorChoice <= 4) text("You", 150, 75 + myShip.colorChoice*75);
	else if (myShip.colorChoice >= 5 && myShip.colorChoice <= 8) text("You", 650, 75 + (myShip.colorChoice-4)*75);
	
	textSize(9);
	for (var i = 0; i < teammateShips.length; i++) {
		if (teammateShips[i].colorChoice >= 1 && teammateShips[i].colorChoice <= 4) text(teammateShips[i].id, 150, 75 + teammateShips[i].colorChoice*75);
		else if (teammateShips[i].colorChoice >= 5 && teammateShips[i].colorChoice <= 8) text(teammateShips[i].id, 650, 75 + (teammateShips[i].colorChoice-4)*75);
	}
	pop();
}

function displayGame() {

	for (var i = 0; i < asteroids.length; i++) {
		if(myShip.hits(asteroids[i]) && invincible == false) {
			myShip.isDamaged = true;
			myShip.isBoosting = false;
			myShip.onCooldown = true;
			myShip.rotation = 0;
			var data = {
				id: socket.id
			}
			socket.emit('shipDamaged', data);
		}
		asteroids[i].render();
	}

	for (var i = lasers.length-1; i >= 0; i--) {
		lasers[i].update();
		var data = {
			id: socket.id,
			x: lasers[i].pos.x,
			y: lasers[i].pos.y
		}
		socket.emit('laserUpdated', data);
		lasers[i].render();

		if (lasers[i].checkOffscreen()) {
			lasers.splice(i, 1);
			myShip.onCooldown = false;
			break;
		}
	}
	
	for (var i = teammateLasers.length-1; i >= 0; i--) {
		teammateLasers[i].render();

		if (teammateLasers[i].checkOffscreen()) {
			teammateLasers.splice(i, 1);
			break;
		}
	}

	for (var i = 0; i < teammateShips.length; i++) {
		if (teammateShips[i].isDamaged == true) {
			if (myShip.saved(teammateShips[i])) {
				data = {
					id: teammateShips[i].id
				}
				socket.emit('shipSaved', data);
			}
		}
	}

	displayMyShip();
	displayTeammates();

}

function displayMyShip() {
	myShip.turn();
	myShip.update();
	myShip.checkEdges();
	myShip.render();
}

function displayTeammates() {
	for (var i = 0; i < teammateShips.length; i++) {
		teammateShips[i].turn();
		teammateShips[i].update();
		teammateShips[i].checkEdges();
		teammateShips[i].render();
	}
}

function displayGameOver() {
	push();
	fill(255, 138, 130);
	stroke(255, 138, 130);
	textAlign(CENTER, CENTER);
	textSize(48);
	text("G A M E  O V E R", width/2, 150);
	textSize(18);
	fill(255);
	stroke(255);
	text("MAIN MENU", width/2, 380);
	textSize(24);
	noStroke();
	text("LEVEL REACHED: " + level, width/2, 265);
	rectMode(CENTER);
	stroke(255);
	strokeWeight(3);
	if(!cgHover) noFill();
	else fill (255, 70);
	rect(width/2, 380, 150, 60);
	pop();
}

function populatePlayer() {
	var data = {
		id: socket.id,
		initX: myShip.pos.x,
		initY: myShip.pos.y,
		initHeading: myShip.heading
	}
	socket.emit('playerInit', data);
}

function shipUpdated() {
	if (stage == 2) {
		var data = {
			id: socket.id,
			x: myShip.pos.x,
			y: myShip.pos.y,
			vx: myShip.velocity.x,
			vy: myShip.velocity.y,
			isBoosting: myShip.isBoosting,
			isDamaged: myShip.isDamaged,
			r: myShip.r,
			heading: myShip.heading,
			rotation: myShip.rotation,
			col: myShip.colour
		}
		socket.emit('shipMoved', data);
	}
}

function teammatesPopulated(data) {
	for(var i = 0; i < data.teammates.length; i++) {
		if (data.teammates[i].id != socket.id && teammateShips.length == 0) {
			var newTeammate = new Ship();
			newTeammate.id = data.teammates[i].id;
			newTeammate.pos.x = data.teammates[i].x;
			newTeammate.pos.y = data.teammates[i].y;
			newTeammate.heading = data.teammates[i].heading;
			newTeammate.colorChoice = data.teammates[i].colorChoice;
			teammateShips.push(newTeammate);
		}
		for (var j = 0; j < teammateShips.length; j++) {
			if (data.teammates[i].id != socket.id && data.teammates[i].id != teammateShips[j].id && teammateShips.length != 0) {
				var newTeammate = new Ship();
				newTeammate.id = data.teammates[i].id;
				newTeammate.pos.x = data.teammates[i].x;
				newTeammate.pos.y = data.teammates[i].y;
				newTeammate.heading = data.teammates[i].heading;
				newTeammate.colorChoice = data.teammates[i].colorChoice;
				teammateShips.push(newTeammate);	
			}
		}
	}
}

function playersUpdated(data) {
	for(var i = 0; i < data.players.length; i++) {
		for (var j = 0; j < teammateShips.length; j++) {
			if (data.players[i].id == teammateShips[j].id) {
				teammateShips[j].pos.x = data.players[i].x;
				teammateShips[j].pos.y = data.players[i].y;
				teammateShips[j].heading = data.players[i].heading;
				teammateShips[j].velocity.x = data.players[i].vx;
				teammateShips[j].velocity.y = data.players[i].vy;
				teammateShips[j].rotation = data.players[i].rotation;
				teammateShips[j].isBoosting = data.players[i].isBoosting;
				teammateShips[j].isDamaged = data.players[i].isDamaged;
			}
		}
	} 
}

function teammateLeft(data) {
	playerCount = data.playerCount;
	for (var i = 0; i < teammateShips.length; i++) {
		if (teammateShips[i].id == data.id) {
			teammateShips.splice(i, 1);
		}
	}
}

function populateAsteroids(data) {
	for (var i = 0; i < data.asteroids.length; i++) {
		var asteroid = new Asteroid();
		asteroid.pos.x = data.asteroids[i].x;
		asteroid.pos.y = data.asteroids[i].y;
		asteroid.r = data.asteroids[i].r;
		asteroid.velocity.x = data.asteroids[i].vx;
		asteroid.velocity.y = data.asteroids[i].vy;
		asteroid.total = data.asteroids[i].total;
		asteroid.offset = data.asteroids[i].offset;
		asteroids.push(asteroid);
	}
}

function updateAsteroids(data) {
	for (var i = 0; i < data.asteroids.length; i++) {
		asteroids[i].pos.x = data.asteroids[i].x;
		asteroids[i].pos.y = data.asteroids[i].y;
	}
}

function teammateLaserCreated(data) {
	var position = createVector(data.x, data.y, data.id);
	var newTeammateLaser = new Laser(position, data.heading, data.id);
	teammateLasers.push(newTeammateLaser);
}

function teammateLaserUpdated(data) {
	for (var i = 0; i < teammateLasers.length; i++) {
		if (data.id == teammateLasers[i].id) {
			teammateLasers[i].pos.x = data.x;
			teammateLasers[i].pos.y = data.y;
		}
	}
}

function asteroidHit(asteroid) {
	asteroids.splice(asteroid.ind, 1);
}

function asteroidSplit(newAsteroids) {
	var splitAsteroids = [];
	for (var i = 0; i < newAsteroids.length; i++) {
		var splitAsteroid = new Asteroid();
		splitAsteroid.pos.x = newAsteroids[i].x;
		splitAsteroid.pos.y = newAsteroids[i].y;
		splitAsteroid.r = newAsteroids[i].r;
		splitAsteroid.velocity.x = newAsteroids[i].vx;
		splitAsteroid.velocity.y = newAsteroids[i].vy;
		splitAsteroid.total = newAsteroids[i].total;
		splitAsteroid.offset = newAsteroids[i].offset;
		splitAsteroids.push(splitAsteroid);
	}
	asteroids = asteroids.concat(splitAsteroids);
	splitAsteroids = [];

}

function mouseClicked() {
	if(stage == 0) {
		if (playerCount < 4) {
			if(mouseX > width/2-75 && mouseX < width/2+75 && mouseY > 270 && mouseY < 330) {
				enteringCode = true;
			}
			if(mouseX > 550 && mouseX < 650 && mouseY > 280 && mouseY < 320) {
				var data = {
					code: roomCode.value()
				}
				socket.emit('checkForGameWithCode', data);
			}
			if(mouseX > width/2-75 && mouseX < width/2+75 && mouseY > 350 && mouseY < 410) {
				const characters = 'abcdefghijklmnopqrstuvwxyz1234567890';
				const rand1 = int(random(0, characters.length-1));
				const rand2 = int(random(0, characters.length-1));
				const rand3 = int(random(0, characters.length-1));
				const rand4 = int(random(0, characters.length-1));
				var newCode = characters[rand1] + characters[rand2] + characters[rand3] + characters[rand4];
				var data = {
					code: newCode,
					countdown: 60
				}
				socket.emit('newRoomCode', data);
				socket.emit('joinGame', data);
			}
		}
		if (mouseX > 495 && mouseX < 555 && mouseY > 350 && mouseY < 410) {
			enteringCode = false;
			roomCode.position(-1000, -1000);
			stage = -1;
		}
	}
	else if (stage == -1) {
		if (mouseX > 670 && mouseX < 730 && mouseY > 470 && mouseY < 530) stage = 0;
	}
	else if (stage == 1) {
		var previous = myShip.colorChoice;
		var choice;
		if (mouseX >= 90 && mouseX <= 210 && mouseY >= 125 && mouseY <= 175) choice = 1;
		else if (mouseX >= 90 && mouseX <= 210 && mouseY >= 200 && mouseY <= 250) choice = 2;
		else if (mouseX >= 90 && mouseX <= 210 && mouseY >= 275 && mouseY <= 325) choice = 3;
		else if (mouseX >= 90 && mouseX <= 210 && mouseY >= 350 && mouseY <= 400) choice = 4;
		else if (mouseX >= 590 && mouseX <= 710 && mouseY >= 125 && mouseY <= 175) choice = 5;
		else if (mouseX >= 590 && mouseX <= 710 && mouseY >= 200 && mouseY <= 250) choice = 6;
		else if (mouseX >= 590 && mouseX <= 710 && mouseY >= 275 && mouseY <= 325) choice = 7;
		else if (mouseX >= 590 && mouseX <= 710 && mouseY >= 350 && mouseY <= 400) choice = 8;
		var data = {
			choice: choice,
			previous: previous
		}
		socket.emit('colorSelected', data);
	}
	else if (stage == 3) {
		if(mouseX > width/2-75 && mouseX < width/2+75 && mouseY > 350 && mouseY < 410) {
			stage = 0;
			socket.emit('leaveRoom');
			myShip = new Ship();
			teammateShips = [];
			asteroids = [];
			lasers = [];
			playerCount = 0;
			countdown = 60;
			enteringCode = false;
			roomCode.value("");
			roomCode.position(-1000,-1000);

		}
	}
}

function keyPressed(){
	if(stage == 2) {
		if (myShip.isDamaged == false) {
			if (keyCode == RIGHT_ARROW || key == 'd' || key == 'D') {
				myShip.setRotation(0.1);
				shipUpdated();
			}
			else if (keyCode == LEFT_ARROW || key == 'a' || key == 'A') {
				myShip.setRotation(-0.1);
				shipUpdated();
			}
	
			if (keyCode == UP_ARROW || key == 'w' || key == 'W') {
				myShip.boosting(true);
				shipUpdated();
			}
		}
	}
}

function keyReleased() {
	if(stage == 0) {
		if (keyCode == ENTER && roomCode.value() != '') {
			var data = {
				code: roomCode.value()
			}
			socket.emit('checkForGameWithCode', data);
		}
	}

	if (stage == 1) {
		if (keyCode == ENTER) {
			socket.emit('forceStart', code);
		}
	}

	else if (stage == 2) {
		if (myShip.isDamaged == false) {
			if (keyCode == RIGHT_ARROW || key == 'd' || key == 'D' || keyCode == LEFT_ARROW || key == 'a' || key == 'A') {
				myShip.rotation = 0;
				shipUpdated();
			}
			if (keyCode == UP_ARROW || key == 'w' || key == 'W') {
				myShip.boosting(false);
				shipUpdated();
			}
		}

		if (key == ' ' && myShip.onCooldown == false) {
			var newLaser = new Laser(myShip.pos, myShip.heading);
			lasers.push(newLaser);
			var data = {
				id: socket.id,
				x: newLaser.pos.x,
				y: newLaser.pos.y,
				heading: myShip.heading
			}
			socket.emit('laserCreated', data);
			myShip.onCooldown = true;
		}
	}
}
