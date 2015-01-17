(function(){

    var game = new Game(document.getElementById('canvas'));

    var i = 0;

    // reused variable to create pieces
    var piece;

    for(i = 11 ;i >= 0; i--){
        addPiece('white','bottom',game.bottomStartSet[i]);
        addPiece('black','top',game.topStartSet[i]);
    }

    // function to add the piece
    function addPiece(type,orientation,startSet){
        piece = new Piece();
        piece.setType(type)
            .setOrientation(orientation)
            .setPosition(startSet);
        game.board.addPiece(piece);
    }

    // update canvas with pieces
    game.update();

    document.getElementById('canvas').addEventListener('click', function(e) {
        var position = game.coordsToGrid(e.x, e.y);
        var piece = game.board.grid[position.x][position.y];

        if(game.getEnemy() == piece.type) return;

        if(piece != 0){
            game.lastCliked = piece;
            game.getAvailable(position);

            game.update();
        }else if(piece === 0){

            for(i = game.available.length-1; i>= 0; i--){
                if(game.available[i] === undefined) continue;

                var available = game.available[i];

                if((position.x == available.x) && (position.y == available.y)){
                    game.lastCliked.move(available);
                    game.changeTurn();
                }
            }

            for(i = game.availableToEat.length-1; i>= 0; i--){
                if(game.availableToEat[i] === undefined) continue;

                var availableToEat = game.availableToEat[i];

                if((position.x == availableToEat.position.x) && (position.y == availableToEat.position.y)){
                    game.lastCliked.move(availableToEat.position);
                    game.board.remove(availableToEat.enemy);
                    game.changeTurn();
                }
            }

            game.resetAvailable();
            game.update('all');
        }

    }, false);

    //constructor
    function Game(canvas){

        this.outsideCanvas = canvas;
        this.context = this.outsideCanvas.getContext('2d');

        this.board = new Grid(this.outsideCanvas);

        this.bottomStartSet = [[0,0],[0,2],[4,0],[6,0],[1,1],[3,1],[5,1],[7,1],[2,0],[2,2],[4,2],[6,2]];
        this.topStartSet =    [[7,7],[5,7],[3,7],[1,7],[6,6],[4,6],[2,6],[0,6],[7,5],[5,5],[3,5],[1,5]];

        this.i = 0;
        this.j = 0;

        this.available = [];

        this.availableToEat = [];

        this.currentTurn = 'white';

        this.lastCliked = undefined;

        this.direction = {
            right:1,
            left:-1
        };

        this.orientation = {
            bottom:1,
            top:-1
        };

        this.availableOrientation = [
            ['left','bottom'],
            ['right','bottom'],
            ['left','top'],
            ['right','top']
        ];

        this.changeTurn = function(){
            this.currentTurn = (this.currentTurn == 'white' ? 'black': 'white');
            return this.currentTurn;
        };

        this.getCurrent = function(){
            return this.currentTurn;
        };

        this.getEnemy = function(){
            if(this.currentTurn === 'white') return 'black';
            else return 'white';
        };

        this.resetAvailable = function(){
            this.available = [];
            this.availableToEat = [];
        };

        this.drawPieces = function(){
            var i = this.i;
            var l = this.board.pieces.length-1;
            for(i=l; i>=0; i--){
                if(this.board.pieces[i].eaten) continue;
                this.board.pieces[i].draw(canvas,this.board.context);
            }
        };

        this.drawBlankPieces = function(position){

            var context = this.context;

            context.beginPath();



            var x = canvas.width*0.125 * position.x + (canvas.width*0.125*0.5);
            var y = canvas.width - (canvas.width*0.125 * position.y + (canvas.width*0.125*0.5));

            context.arc(x, y, 15, 0, 2 * Math.PI, false);
            context.lineWidth = 1;
            context.strokeStyle = 'gray';
            context.stroke();

        };

        this.getAvailable = function(position){
            this.resetAvailable();
            var reference = this.board.grid[position.x][position.y];

            var check;

            for(var i = 3; i>=0; i--){
                check = this.checkIfCanMove(
                    this.availableOrientation[i][0],
                    this.availableOrientation[i][1],
                    reference
                );
                if(check != 0){
                    this.available.push(check);
                }
            }
        };

        this.whatTile = function(position){
            if( position.x > 7 || position.x < 0 || position.y > 7 || position.y < 0) return false;
            return this.board.grid[position.x][position.y];
        };

        this.diagonalCoords = function(direction,position,orientation){
            return {
                x:position.x + this.direction[direction],
                y:position.y + this.orientation[orientation]
            };
        };

        this.checkIfCanMove = function(direction, orientation, piece){
            if(piece.orientation != orientation && !piece.queen) return 0;

            var position = this.diagonalCoords(direction, piece.position, orientation);
            var returnedTile = this.whatTile(position);

            if(returnedTile === false || returnedTile.type == this.currentTurn){
                return 0;
            }else if(returnedTile === 0){
                return position;
            }else {
                this.checkIfCanEat(direction, orientation, piece);
            }
        };

        this.checkIfCanEat = function(direction, orientation, piece){

            if(piece.orientation != orientation && !piece.queen) return 0;

            var position = this.diagonalCoords(direction, piece.position, orientation);
            var returnedTile = this.whatTile(position);

            if(returnedTile.type == this.getEnemy()){
                position = this.diagonalCoords(direction, returnedTile.position, orientation);

                if(this.whatTile(position) === 0){

                    this.availableToEat.push({
                        enemy:returnedTile,
                        position:position
                    });

                }else{
                    return 0;
                }
            }
        };

        this.coordsToGrid = function(eX,eY){
            var x;
            var y;
            for(i=0;i<=8;i++){
                if(50 * i > eX){
                    x = i-1;
                    break;
                }
            }
            for(i=0;i<=8;i++){
                if(400 - 50 * i < eY){
                    y = i-1;
                    break;
                }
            }
            return {
                x:x,
                y:y
            }
        };

        this.update = function(){

            this.board.resetGrid();
            this.board.setPiecesInGrid();
            this.board.draw();
            this.drawPieces();

            for(var i = this.available.length-1; i >= 0; i--){
                if(this.available[i] === undefined) continue;
                this.drawBlankPieces(this.available[i]);
            }

            for(var i = this.availableToEat.length-1; i >= 0; i--){
                if(this.availableToEat[i] === undefined) continue;
                this.drawBlankPieces(this.availableToEat[i].position);
            }
        };

    }

    //constructor
    function Grid(canvas){

        this.outsideCanvas = canvas;
        this.context = this.outsideCanvas.getContext('2d');

        this.tileSize = 0;

        this.grid = [
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0]
        ];

        this.pieces = [];

        this.count = {
            x:0,
            y:0
        };

        this.addPiece = function(piece){
            this.pieces.push(piece)
        };

        this.remove = function(piece){
            piece.eaten = true;
        };

        this.resetGrid = function(){
            this.grid =
                [
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0],
                    [0,0,0,0,0,0,0,0]
                ];
        };

        this.setPiecesInGrid = function(){
            var i = this.i;
            var l = this.pieces.length-1;
            for(i=l; i>=0; i--){
                if(this.pieces[i].eaten === true) continue;
                this.grid[this.pieces[i].position.x][this.pieces[i].position.y] = this.pieces[i];
            }
        };

        this.draw = function(){

            var count = this.count;
            var i = this.i;

            for(i = 63;i >= 0;i--){

                this.context.beginPath();
                var x = this.outsideCanvas.width*0.125*count.x;
                var y = this.outsideCanvas.width*0.125*count.y;
                var square = this.outsideCanvas.width*0.125;

                this.context.rect(x, y, square, square);

                if(count.y%2==0){
                    if(i%2 == 0){
                        this.context.fillStyle = 'brown';
                    }else{
                        this.context.fillStyle = 'white';
                    }
                }else{
                    if(i%2 == 0){
                        this.context.fillStyle = 'white';
                    }else{
                        this.context.fillStyle = 'brown';
                    }
                }

                this.context.fill();

                if(count.x >= 7){
                    count.x=0;
                    count.y++;
                }else{
                    count.x++;
                }

            }

        };

    }

    //constructor
    function Piece(){
        this.type = '';

        this.orientation = '';

        this.queen = false;

        this.eaten = false;

        this.position = {
            x:0,
            y:0
        };

        // black or white
        this.setType = function(type){
            this.type = type;
            return this;
        };

        // were does it start bottom or top
        this.setOrientation = function(orientation){
            this.orientation = orientation;
            return this;
        };

        // x & y position on board
        this.setPosition = function(position){
            this.position.x = position[0];
            this.position.y = position[1];
        };

        this.draw = function(canvas, context){

            context.beginPath();

            var x = canvas.width*0.125 * this.position.x + (canvas.width*0.125*0.5);
            var y = canvas.width - (canvas.width*0.125 * this.position.y + (canvas.width*0.125*0.5));

            context.arc(x, y, 15, 0, 2 * Math.PI, false);
            context.fillStyle = this.type;
            context.fill();
            if(this.queen){
                context.lineWidth = 3;
                context.strokeStyle = 'gold';
                context.stroke();
            }

        };

        this.move = function(position){
            this.position = position;
            this.checkIfQueen();

        };

        this.checkIfQueen = function(){
            if(this.queen) return;

            if((this.orientation == 'bottom') && (this.position.y == 7)){
                console.log('hi');
                this.queen = true;
            }

            if((this.orientation == 'top') && (this.position.y == 0)){
                console.log('hi');
                this.queen = true;
            }
        };

    }
})();