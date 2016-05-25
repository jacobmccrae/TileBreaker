// Project - Tile Breaker
// Jacob McCrae
// 100199022
// 04.03.2016

/*jslint white: true */

//I used the website below for spatial collision detection and ball bouncing
//http://blog.sklambert.com/html5-canvas-game-2d-collision-detection/ 

// I also used this tutorial but I only took some ideas from it which are referrenced in the comments below:
// https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript/Finishing_up
// I borrowed the idea of using an alert to win or lose and the idea of using the score output.

//////////////////// CONSTANTS ////////////////////
var SPACEBAR = 32;
var LEFTARROW = 37;
var UPARROW = 38;
var RIGHTARROW = 39;
var DOWNARROW = 40;

var TILEWIDTH = 100;
var TILEHEIGHT = 10;
var TILESPEED = 10;

var BALLRADIUS = 10;
var BALLSPEED = 5;

var TIMER = 30;

var BOUNCEANGLE;
var VERTICALANGLE = 360;
var HORIZONTALANGLE = 180;

var rows = 5;
var columns = 8;

//////////////////// Properties ////////////////////
var board;
var boardContext;

var gameDetailOutput;

var gameBoard;
var gamePaused;

var gameBall;
var tiles = [[]];
var playerTile;

var timerId = null;

var radians;
var dxBall;
var dyBall;

var lastX;
var score;

//////////////////// Constructors ////////////////////
// Ball Constructor
// xPos, yPos, and radius are type Number
// colour is a string colour
function Ball(xPos, yPos, radius, colour) {
    "use strict";
    
    // Properties
    this.x = xPos;
    this.y = yPos;
    this.radius = radius;
    this.colour = colour;
    
    // Methods
    this.move = function (x, y) {
        this.x += x;
        this.y += y;
    };
    
    // Ball top surface
    this.top = function () {
        return this.y - this.radius;
    };
    
    // Ball bottom surface
    this.bottom = function () {
        return this.y + this.radius;
    };
    
    // Ball left surface
    this.left = function () {
        return this.x - this.radius;
    };
    
    // Ball right surface
    this.right = function () {
        return this.x + this.radius;
    };
    
    // Draws a ball
    this.drawBall = function (context) {
        context.save();
        context.beginPath();
        context.fillStyle = this.colour;
        context.strokeStyle = this.colour;
        context.arc(this.x, this.y, this.radius, 0, 7);
        context.fill();
        context.stroke();
        context.restore();
    };
}

// Tile Constructor
// xPos, yPos, width, and height are Numbers
// colour is a string colour
function Tile(xPos, yPos, width, height, colour) {
    "use strict";
    
    // Properties
    this.x = xPos;
    this.y = yPos;
    this.width = width;
    this.height = height;
    this.colour = colour;
    this.removed = false;
    
    // Methods
    // Moves a tile along the horizontal axis
    this.moveX = function (x) {
        this.x += x;
    };
    
    // Checks if top of tile hit
    this.checkTopHit = function (object) {
        return object === this.y;
    };
    
    // Checks if bottom of tile hit
    this.checkBottomHit = function (object) {
        return object === this.y + this.height;
    };
    
    // Checks if left side of tile hit
    this.checkLeftHit = function (object) {
        return object === this.x;
    };
    
    // Checks if right side of tile hit
    this.checkRightHit = function (object) {
        return object === this.x + this.width;
    };
    
    // Checks if hit is within the width of the tile
    this.checkHorizontalBounds = function (object) {
      return (object >= this.x) && (object <= (this.x + this.width));
    };
    
    // Checks if hit is within the height of the tile
    this.checkVerticalBounds = function (object) {
      return (object >= this.y) && (object <= (this.y + this.height));
    };
    
    // Draws a single tile
    this.drawTile = function (context) {
        context.save();
        context.beginPath();
        context.fillStyle = this.colour;
        context.rect(this.x, this.y, this.width, this.height);
        context.fill();
        context.stroke();
        context.restore();
    };
}

// Game Board Specs Constructor
// width and height are game board boundaries
function GameBoardSpecs(width, height) {
    "use strict";
    
    // Properties
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    
    // Methods
    
    // Returns true if hitting or about to hit the top wall
    // Returns false if it isn't hitting the top wall
    this.violatesTopBound = function (yPos) {
        return yPos <= 0;
    };
    
    // Returns true if hitting or about to hit the bottom wall
    // Returns false if it isn't hitting the bottom wall
    this.violatesBottomBound = function (yPos) {
        return yPos >= this.height;
    };
    
    // Returns true if hitting or about to hit the left wall
    // Returns false if it isn't hitting the left wall
    this.violatesLeftBound = function (xPos) {
        return xPos <= 0;
    };
    
    // Returns true if hitting or about to hit the right wall
    // Returns false if it isn't hitting the right wall
    this.violatesRightBound = function (xPos) {
        return xPos >= this.width;
    };
}

//////////////////// Game Initializations ////////////////////
// Create the game tiles for the board
function createGameTiles(){
    "use strict";
    
    //var x = 10;
    var x = 10;
    var y = 30;
    var newX;
    
    var i, j, tile;
    
    for (i = 0; i < rows; i += 1 ){
        newX = x;
        
        tiles[i] = [];
        for (j = 0; j < columns; j += 1){
            tiles[i][j] = new Tile(newX, y, TILEWIDTH + 5, TILEHEIGHT * 2, "green");
            newX += (TILEWIDTH + 25);
        }
        
        y += (TILEHEIGHT * 2);
    }
}

// Draws the game tiles on the canvas
function drawGameTiles(context){
    "use strict";
    
    var i, j, tile;
    
    for ( i = 0; i < tiles.length; i += 1){
        tile = tiles[i];
        
        // Does not draw game tiles that have been removed
        for (j = 0; j < tile.length; j += 1){
            if (tile[j].removed === false){
                tile[j].drawTile(context);
            }
        }
    }
}

// Start a new game
function startGame(){
    "use strict";
    
    gamePaused = true;
    gameDetailOutput.innerHTML = "Tap Mouse or Spacebar to Start / Pause<br>Use mouse or arrows (RECOMMENDED) to move player tile.";
    
    // Set initial change values for the ball
    BOUNCEANGLE = 35;
    radians = 0;
    dxBall = BALLSPEED;
    dyBall = BALLSPEED;
    
    gameBall = new Ball(gameBoard.centerX, gameBoard.centerY, BALLRADIUS, "red");
    gameBall.drawBall(boardContext);
    
    var tileOffset = gameBoard.height - (gameBoard.height / 5);
    playerTile = new Tile(gameBoard.centerX - (TILEWIDTH / 2), tileOffset - (TILEHEIGHT / 2), TILEWIDTH, TILEHEIGHT, "gray");
    playerTile.drawTile(boardContext);
    
    lastX = playerTile.x;
    
    createGameTiles();
    drawGameTiles(boardContext);
    
    score = 0;
}

// stops the game time
function stopGameTimer() {
    "use strict";
    
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
}


//////////////////// Board Updates Based on the Happenings on the Board ////////////////////
// Erases the canvas 
function resetBoard(resetContext, width, height) {
    "use strict";
    
    resetContext.setTransform(1, 0, 0, 1, 0, 0);
    resetContext.clearRect(0, 0, width, height);
}

// borrowed this function from here:
// https://developer.mozilla.org/en-US/docs/Games/Tutorials/2D_Breakout_game_pure_JavaScript/Finishing_up
function drawScore() {
    "use strict";
    boardContext.font = "16px Arial";
    boardContext.fillStyle = "blue";
    boardContext.fillText("Score: "+ score, 8, 20);
}

// Resets and redraws objects on the board
function boardUpdates(){
    "use strict";
    
    resetBoard(boardContext, gameBoard.width, gameBoard.height);
    drawGameTiles(boardContext);
    gameBall.drawBall(boardContext);
    playerTile.drawTile(boardContext);
    drawScore();
}

// Updates the balls position
function ballUpdates() {
    "use strict";
    
    radians = BOUNCEANGLE * Math.PI / 180;
    dxBall = Math.cos(radians) * BALLSPEED;
    dyBall = Math.sin(radians) * BALLSPEED;
}

//////////////////// Collision Detections ////////////////////
// Any collisions that happens to the ball
function checkBallCollisions() {
    "use strict";
    
    var collisionAngle, collision = false;
    
    // Check upper quadrant tile collisions
    if (gameBall.top() < gameBoard.centerY) {
        
        // Check upper left tile collisions 0 - 2
        if (gameBall.right() < gameBoard.centerX){
            var i, j;
            
            // Checks if an upper left tile has been hit
            for (i = tiles.length - 1; i >= 0; i -= 1){
                for (j = 0; j < (tiles[i].length / 2) - 1; j += 1) {
                    if ( tiles[i][j].removed === false ) {
                        if ( tiles[i][j].checkHorizontalBounds(Math.round(gameBall.x)) && tiles[i][j].checkVerticalBounds(Math.round(gameBall.y))){
                            collisionAngle = VERTICALANGLE;
                            collision = true;
                            tiles[i][j].removed = true;
                            score += 1;
                            
                        }
                    }
                }
            }
        }
        // Check upper right tile collisions 3 - 5
        else{
            var m, n;
            // Checks if an upper right tile has been hit
            for (m = tiles.length - 1; m >= 0; m -= 1){
                for (n = tiles[m].length / 2; n < tiles[m].length; n += 1) {
                    if(tiles[m][n].removed === false){
                        if ( tiles[m][n].checkHorizontalBounds(Math.round(gameBall.x)) && tiles[m][n].checkVerticalBounds(Math.round(gameBall.y)) ){
                            collisionAngle = VERTICALANGLE;
                            collision = true;
                            tiles[m][n].removed = true;
                            score += 1;
                        }
                    }
                }
            }
        }
        
        if(score === rows * columns) {
            window.alert("You Win!");
            document.location.reload();
        }
        
         // Check top board collision
        if (gameBoard.violatesTopBound(gameBall.top())){
            collisionAngle = VERTICALANGLE;
            collision = true;
        }
    }
    // Check lower quadrant collisions
    else {
        // check player tile collision
        if ( playerTile.checkHorizontalBounds(Math.round(gameBall.x)) && playerTile.checkVerticalBounds(Math.round(gameBall.bottom()))){
            collisionAngle = VERTICALANGLE;
            collision = true;
        }
        
        // check end game / board bottom collision
        if (gameBoard.violatesBottomBound(gameBall.bottom())){
            window.alert("Game Over!");
            stopGameTimer();
            startGame();
        }
    }
    
    // Check horizontal wall collisions
    if (gameBoard.violatesLeftBound(gameBall.left()) || gameBoard.violatesRightBound(gameBall.right())){
        collisionAngle = HORIZONTALANGLE;
        collision = true;
    }
    
    // if collision update ball direction
    if (collision){
        BOUNCEANGLE = collisionAngle - BOUNCEANGLE;
        ballUpdates();
    }
    
    gameBall.move(dxBall, dyBall);
    boardUpdates();
}

// Player Tile Updates based on tile movement
// Update player tile to move right
function moveBoardRight(speed){
    "use strict";
    
    // makes sure it doesn't go too far right
    if (gameBoard.violatesRightBound(playerTile.x + playerTile.width) === false) {
        playerTile.moveX(speed);    
    }
    
     boardUpdates();
}

// update player tile to move left
function moveBoardLeft(speed){
    "use strict";
    
    // makes sure it doesn't go too far left
    if (gameBoard.violatesLeftBound(playerTile.x) === false) {
        playerTile.moveX(-speed);
    }
    
    boardUpdates();
}


/////////////// Event Functions ///////////////
// Starts the gametimer
function startGameTimer() {
    "use strict";
    if (timerId === null) {
        // continuosly checks ball collisions
        timerId = setInterval(checkBallCollisions, TIMER);
    }
}

// Click to play / pause game
function playGame() {
    "use strict";
    
    if (gamePaused === true) {
        gamePaused = false;
        startGameTimer();
    }
    else{
        gamePaused = true;
        stopGameTimer();
    }
}

// Move mouse to move board
function actionForMouse(event) {
    "use strict";
    
    var x = event.offsetX;
    
    // x decreasing
    if (x < lastX){
        moveBoardLeft(TILESPEED);
    }
    // x increasing
    else{
        moveBoardRight(TILESPEED);
    }
    
    lastX = x;
}

// Keyboard actions
function actionForKeyPressed(event) {
    "use strict";
    var speed = TILESPEED;
    var keyPressed = event.keyCode;
    var repeat = event.repeat;
    
    if(repeat){
        speed += 10;
    }
    else{
        speed += 5;
    }
    
    // Space bar to play / pause game
    if (keyPressed === SPACEBAR){
        playGame();
    }
    // Move player tile left
    else if (keyPressed === LEFTARROW){
        moveBoardLeft(speed);
    }
    // move player tile right
    else if (keyPressed === RIGHTARROW){
        moveBoardRight(speed);
    }
}

function setupEvents(){
    "use strict";
    window.addEventListener("keydown", actionForKeyPressed, false);
}

// Game Setups
// main setup
function gameSetup() {
    "use strict";
    
    setupEvents();
    
    board = document.getElementById("canvas");
    boardContext = board.getContext("2d");
    
    gameDetailOutput = document.getElementById("gameDetails");
    
    gameBoard = new GameBoardSpecs(board.width, board.height);
    
    startGame();
}