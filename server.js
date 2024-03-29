const PORT = process.env.PORT || 3000;

var express = require('express');
var app = express();
var server = app.listen(PORT);
app.use(express.static('public'));

var socket = require('socket.io');
var io = socket(server);

console.log("Server is running");

var rooms = [];

class Room {
    constructor(code) {
        this.code = code;
        this.stage = 0;
        this.countdownDelay = 20;
        this.countdown = 60;

        this.level = 1;
        this.countMultiplier = 5;
        this.countChance = 0.2;
        this.speedMultiplier = 1;
        this.speedChance = 0.3;
        this.sizeMultiplier = 0;
        this.sizeChance = 0.4;

        this.players = [];
        this.playersDamaged = 0;
        this.gameoverTimer = 2;
        this.gameoverDelay = 20;
        this.invincibilityTimer = 4;
        this.invTimerDelay = 20;
        this.availableColors = [1,2,3,4,5,6,7,8];

        this.asteroids = [];
        this.levelPopulated = false;
    }
}

class Player {
    constructor(id) {
        this.id = id;
        this.teammates = [];
        this.x = undefined;
		this.y = undefined;
		this.vx = 0;
		this.vy = 0;
		this.isBoosting = false;
        this.isDamaged = false;
		this.r = 12;
		this.heading = undefined;
		this.rotation = 0;
        this.col;
        this.colorChoice;
        this.invincibilityTimer = 3;
    }
}

class Asteroid {
    constructor(x, y, r) {
        if (x) {
            this.xCopy = x;
            this.x = this.xCopy;
        }
        else {
            this.x = Math.random()*(800);
            if (this.x > 300 && this.x < 500) {
                this.x += 200;
            }
        }
        if (y) {
            this.yCopy = y;
            this.y = this.yCopy;
        }
        else {
            this.y = Math.random()*(575);
            if (this.y > 237.5 && this.y < 337.5) {
                this.y += 100;
            }
        }
        if (r) {
            this.rCopy = r;
            this.r = this.rCopy*0.5;
        }
        else {
            this.r = Math.random()*(50-15)+15;
        }
        this.vx = Math.random()*(3-(-3))-3;
        this.vy = Math.random()*(3-(-3))-3;
        this.total = Math.floor(Math.random()*(15-5)+5);
        this.offset = [];
        for (var i = 0; i < this.total; i++) {
            this.offset[i] = Math.random()*(this.r*0.5 - (-this.r*0.5))-this.r*0.5;
        }
    }

    breakup() {
        var newAsteroids = [];
        newAsteroids[0] = new Asteroid(this.x, this.y, this.r);
        newAsteroids[1] = new Asteroid(this.x, this.y, this.r);
        return newAsteroids;
    }
}

io.sockets.on('connection', (socket) => {

    socket.on('joinGame', (data) => {

        socket.join(data.code);

        for(var i = 0; i < rooms.length; i++) {
            if(rooms[i].code == data.code) {

                var player = new Player(socket.id);

                player.colorChoice = rooms[i].availableColors[0];
                rooms[i].availableColors.splice(0, 1);
                rooms[i].players.push(player);

                var data = {
                    code: rooms[i].code,
                    colorChoice: player.colorChoice
                }

                if (rooms[i].players.length == 1) {
                    rooms[i].stage = 1;
                }
                socket.emit('waiting', data);

                var data = {
                    teammates: rooms[i].players
                }
                io.in(rooms[i].code).emit('teammatesPopulated', data);

                var data = {
                    playerCount: rooms[i].players.length
                }
            
                io.in(rooms[i].code).emit('playerJoined', data);
            }
        }

    });

    socket.on('forceStart', (code) => {
        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (socket.id == rooms[i].players[j].id) {
                    rooms[i].stage = 2;
                    rooms[i].level = 1;
                    io.in(rooms[i].code).emit('gameStart');
                }
            }
        }
    });

    socket.on('newRoomCode', (data) => {
        rooms.push(new Room(data.code));
    });

    socket.on('checkForGameWithCode', (data) => {
        for(var i = 0; i < rooms.length; i++) {
            if(rooms[i].code == data.code) {
                if(rooms[i].players.length < 4 && rooms[i].stage == 1) {
                    data.countdown = rooms[i].countdown;
                    socket.emit('roomFound', data);
                }
                else {
                    console.log('Room is full or game has already started');
                }
            }
        }
    });

    socket.on('disconnect', () => {

        var ind = findIndex(socket.id);
        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (rooms[i].players[j].id == socket.id) {
                    rooms[i].availableColors.push(rooms[i].players[j].colorChoice);
                    rooms[i].players.splice(ind, 1);
                    var data = {
                        id: socket.id,
                        playerCount: rooms[i].players.length
                    }
                    io.in(rooms[i].code).emit('playerLeft', data);
                }
            }
            if(rooms[i].players.length <= 0) {
                rooms.splice(i, 1);
            }
        }
    });

    socket.on('leaveRoom', () => {
        var ind = findIndex(socket.id);
        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (rooms[i].players[j].id == socket.id) {
                    rooms[i].players.splice(ind, 1);
                }
            }
            if(rooms[i].players.length <= 0) {
                rooms.splice(i, 1);
            }
        }
    });

    socket.on('colorSelected', (data) => {
        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (socket.id == rooms[i].players[j].id) {
                    for (var k = 0; k < rooms[i].availableColors.length; k++) {
                        if (data.choice == rooms[i].availableColors[k]) {
                            rooms[i].players[j].col = data.choice;
                            rooms[i].players[j].colorChoice = data.choice;
                            rooms[i].availableColors.splice(k, 1);
                            rooms[i].availableColors.push(data.previous);
                            io.to(socket.id).emit('colorChanged', data);
                            var teammateColor = {
                                current: data.choice,
                                previous: data.previous,
                                id: socket.id
                            }
                            socket.to(rooms[i].code).emit('teammateColorChanged', teammateColor);
                        }
                    }
                }
            }
        }
    });

    socket.on('playerInit', (data) => {
        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (data.id == rooms[i].players[j].id) {
                    rooms[i].players[j].x = data.initX;
                    rooms[i].players[j].y = data.initY;
                    rooms[i].players[j].heading = data.initHeading;
                }
            }
        }
    });

    socket.on('shipMoved', (data) => {

        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (data.id == rooms[i].players[j].id) {
                    rooms[i].players[j].x = data.x;
                    rooms[i].players[j].y = data.y;
                    rooms[i].players[j].vx = data.vx;
                    rooms[i].players[j].vy = data.vy;
                    rooms[i].players[j].isBoosting = data.isBoosting;
                    rooms[i].players[j].isDamaged = data.isDamaged;
                    rooms[i].players[j].heading = data.heading;
                    rooms[i].players[j].rotation = data.rotation;
                }
            }
        }

    });

    socket.on('shipSaved', (data) => {
        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (data.id == rooms[i].players[j].id) {
                    rooms[i].players[j].isDamaged = false
                    io.to(rooms[i].players[j].id).emit('shipWasSaved');
                }
            }
        }
    });

    socket.on('laserCreated', (data) => {
        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (data.id == rooms[i].players[j].id) {
                    socket.to(rooms[i].code).emit('teammateLaserCreated', data);
                }
            }
        }
    });

    socket.on('laserUpdated', (data) => {
        for (var i = 0; i < rooms.length; i++) {
            for (var j = 0; j < rooms[i].players.length; j++) {
                if (data.id == rooms[i].players[j].id) {
                    for (var k = 0; k < rooms[i].asteroids.length; k++) {
                        if (data.x > (rooms[i].asteroids[k].x - rooms[i].asteroids[k].r) && data.x < (rooms[i].asteroids[k].x + rooms[i].asteroids[k].r) && data.y > (rooms[i].asteroids[k].y - rooms[i].asteroids[k].r) && data.y < (rooms[i].asteroids[k].y + rooms[i].asteroids[k].r)) {
                            io.to(data.id).emit('laserHitAsteroid');
                            socket.to(rooms[i].code).emit('teammateLaserHitAsteroid', data);

                            if (rooms[i].asteroids[k].r > 15) {
                                var newAsteroids = rooms[i].asteroids[k].breakup();
                                rooms[i].asteroids = rooms[i].asteroids.concat(newAsteroids);
                                io.in(rooms[i].code).emit('asteroidSplit', newAsteroids);
                            }
                            var asteroid = {
                                ind: k
                            }
                            io.in(rooms[i].code).emit('asteroidHit', asteroid);
                            rooms[i].asteroids.splice(k, 1);
                            break;
                        }
                    }
                    socket.to(rooms[i].code).emit('teammateLaserUpdated', data);
                }
            }
        }
    });
    
});

setInterval(() => {
    for (var i = 0; i < rooms.length; i++) {
        if (rooms[i].stage == 1) {
            if(rooms[i].players.length > 0 && rooms[i].countdown > 0){
                rooms[i].countdownDelay--;
                if (rooms[i].countdownDelay == 0) {
                    updateCountdown(rooms[i]);
                    rooms[i].countdownDelay = 20;
                }
            }
        }
        else if (rooms[i].stage == 2) {
            var data = {
                players: rooms[i].players
            }
            io.in(rooms[i].code).emit('playersUpdated', data);

            checkShipsDamaged(rooms[i]);

            if (rooms[i].levelPopulated == false) {
                rooms[i].levelPopulated = true;
                for (var j = 0; j < rooms[i].countMultiplier; j++) {
                    var newAsteroid = new Asteroid();
                    newAsteroid.vx *= rooms[i].speedMultiplier;
                    newAsteroid.vy *= rooms[i].speedMultiplier;
                    newAsteroid.r += rooms[i].sizeMultiplier;
                    rooms[i].asteroids.push(newAsteroid);
                }
                var data = {
                    asteroids: rooms[i].asteroids
                }
                io.in(rooms[i].code).emit('asteroidsPopulated', data);
            }
            else if (rooms[i].levelPopulated == true) {
                rooms[i].invTimerDelay--;
                if(rooms[i].invTimerDelay == 0) {
                    runInvincibilityTimer(rooms[i]);
                    rooms[i].invTimerDelay = 20;
                }
                for (var j = 0; j < rooms[i].asteroids.length; j++) {
                    rooms[i].asteroids[j].x += rooms[i].asteroids[j].vx;
                    rooms[i].asteroids[j].y += rooms[i].asteroids[j].vy;
    
                    if (rooms[i].asteroids[j].x > 800 + rooms[i].asteroids[j].r) {
                        rooms[i].asteroids[j].x = -rooms[i].asteroids[j].r
                    }
                    else if (rooms[i].asteroids[j].x < -rooms[i].asteroids[j].r) {
                        rooms[i].asteroids[j].x = 800 + rooms[i].asteroids[j].r
                    }
    
                    if (rooms[i].asteroids[j].y > 575 + rooms[i].asteroids[j].r) {
                        rooms[i].asteroids[j].y = -rooms[i].asteroids[j].r
                    }
                    else if (rooms[i].asteroids[j].y < -rooms[i].asteroids[j].r) {
                        rooms[i].asteroids[j].y = 575 + rooms[i].asteroids[j].r
                    }
                }
                var data = {
                    asteroids: rooms[i].asteroids
                }
            
                io.in(rooms[i].code).emit('asteroidsUpdated', data);
            }

            if (rooms[i].asteroids.length == 0) {
                rooms[i].level++;

                var speedRand = Math.random();
                var countRand = Math.random();
                var sizeRand = Math.random();
                if (speedRand <= rooms[i].speedChance) {
                    rooms[i].speedMultiplier += 0.1;
                    rooms[i].speedChance += 0.05;
                }
                if (countRand <= rooms[i].countChance) {
                    rooms[i].countMultiplier += 1;
                    rooms[i].countChance += 0.10;
                }
                if (sizeRand <= rooms[i].sizeChance) {
                    rooms[i].sizeMultiplier += 1;
                    rooms[i].sizeChance += 0.02;
                }

                io.in(rooms[i].code).emit('shipWasSaved');
                rooms[i].invincibilityTimer = 4;
                rooms[i].levelPopulated = false;
            }
        } 
    }

}, 50);

function updateCountdown(room) {
    room.countdown--;
    if(room.players.length == 4 && room.countdown > 10) room.countdown = 10;
    var data = {
        countdown: room.countdown
    }
    io.in(room.code).emit('timer', data);
    if (room.countdown == 0) {
        room.stage = 2;
        room.level = 1;
        io.in(room.code).emit('gameStart'); 
    }
}

function runInvincibilityTimer(room) {
    if (room.invincibilityTimer > 0) {
        room.invincibilityTimer--;
        io.in(room.code).emit('invTimerUpdated');
    }
}

function checkShipsDamaged(room) {
    var n = 0;

    for (var i = 0; i < room.players.length; i++) {
        if (room.players[i].isDamaged == true) {
            n++;
        }
    }

    room.playersDamaged = n;

    if (room.playersDamaged >= room.players.length) {
        if (room.gameoverDelay > 0) {
            room.gameoverDelay--;
        }
        else if (room.gameoverDelay == 0) {
            room.gameoverTimer--;
        }

        if (room.gameoverTimer == 0) {
            room.stage = 3;
            var data = {
                level: room.level
            }
            io.in(room.code).emit('gameOver', data);
        }
    }
}

function findIndex(id) {
    for (var i = 0; i < rooms.length; i++) {
        return rooms[i].players.indexOf(rooms[i].players.find((player) => {
            return player.id === id;
        }));
    }
}