//NPC INFO
let lastDeliveries = 0;
let lastScore = 0;
let highScore = 0;

let townLevel = 1;


// Minimum score needed to unlock the next level
const TOWN_LEVEL_REQUIREMENTS = {
    1: 0,
    2: 500,
    3: 1000

};

//minigame levels//

const MINI_GAME_LEVELS = {
    1: "town",
    2: "flood",
    3: "snow"
};


//canvas//

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");


//setting up key bindings with arrowkeys

const keys = new Set();

window.addEventListener("keydown", (event) => {

    const key = event.key.toLowerCase();

    keys.add(key);

    // Prevent browser scrolling
    if (
        [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            " "
        ].includes(key)
    ) {
        event.preventDefault();
    }

});

window.addEventListener("keyup", (event) => {

    keys.delete(event.key.toLowerCase());

});


//variables in game
const PLAYER_SPEED = 200;

//player sprite//

const playerSprite = new Image();
playerSprite.src = "../sprites/Player.PNG";

let lastTime = 0;

//game mode//

let gameMode = "hub";
let activeMiniGame = null;

//intro screen 

let introScreenOpen = true;
let introType = "hub"

let introStarted = false;

//intro screen when you load in context//
const introScreens = {

    hub: {
        title: "WELCOME TO THE SIMULATION",
        subtitle: "Delivery Operations Hub",

        description: [
            "Welcome to the simulated delivery hub.",
            "Speak with the doctor in the hospital to begin your delivery missions.",
            "",
            "Complete missions to earn points and unlock",
            "new environments and challenges."
        ],

        controls: "WASD / Arrow Keys = Move    SPACE / ENTER = Continue"
    },

    town: {
        title: "LEVEL 1",
        subtitle: "DAYTIME TOWN DELIVERY",

        description: [
            "Your first delivery assignment begins here.",
            "",
            "Collect packages and deliver them to the",
            "correct buildings before time runs out.",
            "",
            "Watch your Battery Reserve while driving."
        ],

        controls: "WASD / Arrow Keys = Drive    SPACE / ENTER = Continue"
    },

    flood: {
        title: "LEVEL 2",
        subtitle: "FLOODED TOWN",

        description: [
            "Heavy rain has flooded parts of the town.",
            "",
            "Deliver packages while navigating puddles",
            "and difficult road conditions.",
            "",
            "Stay alert and manage your Battery Reserve."
        ],

        controls: "WASD / Arrow Keys = Drive    SPACE / ENTER = Continue"
    },

    snow: {
        title: "LEVEL 3",
        subtitle: "SNOW TOWN DELIVERY",

        description: [
            "Snow has covered the town.",
            "",
            "Ice reduces your traction while strong winds",
            "can push your vehicle off course.",
            "",
            "Complete as many deliveries as possible."
        ],

        controls: "WASD / Arrow Keys = Drive    SPACE / ENTER = Continue"
    }
};

//open the intro screen
function openIntro(type) {

    introType = type;
    introScreenOpen = true;

}

//close the intro screen
function closeIntro() {

    introScreenOpen = false;

}

//player character SPECIFICALLY in the hub//
const player = {

    x: 120,
    y: 350,

    width: 50,
    height: 50,

    speed: PLAYER_SPEED

};



//hospital building in the hub. Only building//

const building = {

    x: 300,
    y: 100,

    width: 300,
    height: 220

};

//sprites for the hospital const
const buildingSprite = new Image();
buildingSprite.src = "../sprites/hospital.png";

//the door to the hospital//

const door = {

    x: 425,
    y: 230,

    width: 50,
    height: 90

};

//sprite for the door//
const doorSprite = new Image();
doorSprite.src = "../sprites/hospital_door.PNG";

//when player enters the building, they can still exit through this exit//
const interiorExit = {

    x: 425,
    y: 460,

    width: 50,
    height: 40

};


//does not set the player inside the hospital building//
let playerInside = false;


//npc stuff//
const npc = {

    x: 450,
    y: 180,

    width: 50,
    height: 50,

    spriteHeight: 28,
    spriteWidth: 28,

    name: "Doctor C"

};

//sprite for the npc//
const npcSprite = new Image();

npcSprite.src = "../sprites/Dottore.PNG";

const overWorldSprite = new Image();
overWorldSprite.src = "../sprites/dottore_sprite.PNG";


//dialogue states for talking to the NPC//
let dialogueOpen = false;

let dialogueChoice = false;

//so npc talks in order//
let dialogueStep = 0;

//for the levels that get unlocked//

let levelSelectionOpen = false;
let selectedLevel = 1;

//previous key states//
let previousE = false;
let previousY = false;
let previousN = false;
let previousEnter = false;
let previousR = false;
let previousH = false;

//these for the level selection//

let previous1 = false;
let previous2 = false;
let previous3 = false;
let previousEscape = false;


//OBJECT COLLISION//
function isColliding(a, b) {

    return (

        a.x < b.x + b.width &&

        a.x + a.width > b.x &&

        a.y < b.y + b.height &&

        a.y + a.height > b.y

    );

}


//key press direction//
function keyPressed(key, previousState) {

    return keys.has(key) && !previousState;

}

//movement for the player//
function updatePlayer(deltaTime) {

    // Do not allow movement while dialogue is open
    if (dialogueOpen) {
        return;
    }

    let dx = 0;
    let dy = 0;


    //up W//
    if (
        keys.has("arrowup") ||
        keys.has("w")
    ) {
        dy -= 1;
    }


    //down s//
    if (
        keys.has("arrowdown") ||
        keys.has("s")
    ) {
        dy += 1;
    }


    //left a//
    if (
        keys.has("arrowleft") ||
        keys.has("a")
    ) {
        dx -= 1;
    }


    //right d//
    if (
        keys.has("arrowright") ||
        keys.has("d")
    ) {
        dx += 1;
    }


    //normalising movement//
    if (dx !== 0 || dy !== 0) {

        const length = Math.hypot(dx, dy);

        dx /= length;
        dy /= length;

    }


    const movementX =
        dx * player.speed * deltaTime;

    const movementY =
        dy * player.speed * deltaTime;



    //movement for the player inside the building//
    if (playerInside) {

        player.x += movementX;
        player.y += movementY;


        // Check if player is trying to leave
        if (
            isColliding(player, interiorExit) &&
            keyPressed("e", previousE)
        ) {

            exitBuilding();

            return;

        }


        // Keep player inside except for exit
        keepPlayerInsideInterior();

    }


    //outside//
    else {

        moveOutside(
            movementX,
            movementY
        );


        //function to enter building through door//
        if (
            isColliding(player, door) &&
            keyPressed("e", previousE)
        ) {

            enterBuilding();

            return;

        }

    }

}


//movement outside
function moveOutside(dx, dy) {

    // Horizontal movement
    player.x += dx;

    if (
        isColliding(player, building) &&
        !isColliding(player, door)
    ) {

        player.x -= dx;

    }


    // Vertical movement
    player.y += dy;

    if (
        isColliding(player, building) &&
        !isColliding(player, door)
    ) {

        player.y -= dy;

    }


    keepPlayerInsideCanvas();

}

//keep player from walking off screen//
function keepPlayerInsideCanvas() {

    if (player.x < 0) {
        player.x = 0;
    }

    if (player.y < 0) {
        player.y = 0;
    }

    if (
        player.x + player.width >
        canvas.width
    ) {

        player.x =
            canvas.width -
            player.width;

    }

    if (
        player.y + player.height >
        canvas.height
    ) {

        player.y =
            canvas.height -
            player.height;

    }

}


//keeps player inside building frame//
function keepPlayerInsideInterior() {

    const padding = 20;


    // Left wall
    if (player.x < padding) {

        player.x = padding;

    }


    // Top wall
    if (player.y < padding) {

        player.y = padding;

    }


    // Right wall
    if (
        player.x + player.width >
        canvas.width - padding
    ) {

        player.x =
            canvas.width -
            padding -
            player.width;

    }


    //bottom wall with exit//
    if (
        player.y + player.height >
        canvas.height - padding
    ) {

        const atExit =
            player.x + player.width >
            interiorExit.x &&

            player.x <
            interiorExit.x +
            interiorExit.width;


        // If not at exit, stop at wall
        if (!atExit) {

            player.y =
                canvas.height -
                padding -
                player.height;

        }

    }

}


//enter the building//
function enterBuilding() {

    playerInside = true;


    // Place player just inside entrance
    player.x =
        canvas.width / 2 -
        player.width / 2;

    player.y = 350;

    gameAudio.playMusic("hub");

    console.log("Player entered the building.");

}


///exit building//
function exitBuilding() {

    playerInside = false;


    // Place player just outside entrance
    player.x =
        door.x +
        door.width / 2 -
        player.width / 2;

    player.y =
        door.y +
        door.height +
        10;

    gameAudio.stopMusic();

    console.log("Player left the building.");

}

//npc talk//
function checkNPCInteraction() {

    if (!playerInside) {
        return;
    }

    if (dialogueOpen) {
        return;
    }


    // Interaction area around NPC
    const interactionRange = {

        x: npc.x - 25,
        y: npc.y - 25,

        width: npc.width + 50,
        height: npc.height + 50

    };


    // Check whether player is close enough
    if (
        isColliding(
            player,
            interactionRange
        )
    ) {

        // Open dialogue when E is newly pressed
        if (
            keyPressed(
                "e",
                previousE
            )
        ) {

            openDialogue();

        }

    }

}


//opens dialogue//
function openDialogue() {

    dialogueOpen = true;

    //start at intro//
    dialogueStep = 0;

    //so no choice appears yet//
    dialogueChoice = false;

    console.log("Dialogue opened.");

}


//close dialogue//
function closeDialogue() {

    dialogueOpen = false;

    dialogueChoice = false;

    dialogueStep = 0;

    levelSelectionOpen = false;

}




//handles dialogue between steps and advancements//
function handleDialogue() {

    if (!dialogueOpen) {
        return;
    }


    //continues dialogue per step//
    if (keyPressed("enter", previousEnter)) {

        if (dialogueStep < 4) {

            dialogueStep++;

            // Step 4 opens the level-selection menu
            if (dialogueStep === 4) {
                dialogueChoice = true;
                levelSelectionOpen = true;
            }

            return;
        }
    }


    //selecting level through dialogue
    if (
        dialogueChoice &&
        keyPressed("1", previous1)
    ) {

        selectedLevel = 1;

        startTownDelivery();

        return;
    }


    //level two//
    if (
        dialogueChoice &&
        keyPressed("2", previous2)
    ) {

        if (townLevel >= 2) {

            selectedLevel = 2;

            startTownDelivery();

        } else {

            console.log(
                "Level 2 is still locked."
            );
        }

        return;
    }


    //level 3//
    if (
        dialogueChoice &&
        keyPressed("3", previous3)
    ) {

        if (townLevel >= 3) {

            selectedLevel = 3;

            startTownDelivery();

        } else {

            console.log(
                "Level 3 is still locked."
            );
        }

        return;
    }


    //to escape the dialogue//
    if (
        dialogueChoice &&
        keyPressed("escape", previousEscape)
    ) {

        closeDialogue();

        console.log(
            "Player exited level selection."
        );

        return;
    }
}


//stores minigame results//
function recordMiniGameResults() {

    if (!activeMiniGame) {
        return;
    }


    const results =
        activeMiniGame.getResults();


    lastDeliveries =
        results.deliveries;


    lastScore =
        results.score;


    // Update high score

    if (
        lastScore > highScore
    ) {

        highScore =
            lastScore;
    }


    // Determine highest unlocked level

    for (
        let level = 1;
        level <=
        Object.keys(
            TOWN_LEVEL_REQUIREMENTS
        ).length;
        level++
    ) {

        if (
            highScore >=
            TOWN_LEVEL_REQUIREMENTS[level]
        ) {

            townLevel =
                level;
        }
    }


    console.log(
        "Last score:",
        lastScore
    );

    console.log(
        "High score:",
        highScore
    );

    console.log(
        "Highest unlocked level:",
        townLevel
    );
}

//starts townDelivery//
function startTownDelivery() {

    closeDialogue();

    //level 1 townDelivery//
    if (selectedLevel === 1) {

        if (!window.townGame) {
            console.log("townGame not loaded.");
            gameMode = "hub";
            return;
        }

        gameMode = "town";
        activeMiniGame = window.townGame;

        // DO NOT START THE GAME YET
        openIntro("town");

        console.log("Level 1 intro opened.");

        return;
    }


    //flood game//
    if (selectedLevel === 2) {

        if (!window.floodTownGame) {
            console.log("floodTownGame not loaded.");
            gameMode = "hub";
            return;
        }

        gameMode = "town";
        activeMiniGame = window.floodTownGame;

        // DO NOT START THE GAME YET
        openIntro("flood");

        console.log("Level 2 intro opened.");

        return;
    }


    //snow game//
    if (selectedLevel === 3) {

        if (townLevel < 3) {

            console.log(
                "Level 3 is locked. Reach 1000 points to unlock it."
            );

            gameMode = "hub";
            return;
        }

        if (!window.snowTownGame) {
            console.log("snowTownGame not loaded.");
            gameMode = "hub";
            return;
        }

        gameMode = "town";
        activeMiniGame = window.snowTownGame;

        // DO NOT START THE GAME YET
        openIntro("snow");

        console.log("Level 3 intro opened.");

        return;
    }
}
//once game is over//
function completeTownGame() {

    // Return to hub
    gameMode = "hub";

    //music to stop and weather for hub music.//

    gameAudio.stopAll();
    gameAudio.playMusic("hub");


    // Return player inside Hospital
    playerInside = true;


    // Place player near Maya
    player.x =
        npc.x -
        player.width -
        20;

    player.y =
        npc.y +
        npc.height +
        25;


    // Close dialogue
    dialogueOpen = false;
    dialogueChoice = false;


    console.log(
        "Town Delivery completed!"
    );

    console.log(
        "Returning to the Hospital."
    );

}


//update//
function update(deltaTime) {

    //intro screen input//
    if (introScreenOpen) {

        if (keys.has("enter") || keys.has(" ")) {

            closeIntro();

            //hub intro//
            if (introType === "hub") {

                return;
            }

            //to start minigame//
            if (introType === "town" ||
                introType === "flood" ||
                introType === "snow") {

                if (activeMiniGame) {
                    activeMiniGame.start();

                }

                return;
            }
        }

        return;
    }

    //hub game mode//
    if (gameMode === "hub") {

        // Handle dialogue first
        handleDialogue();

        // Player movement
        updatePlayer(deltaTime);

        // NPC interaction
        checkNPCInteraction();
    }

    //town delivery game mode//
    else if (gameMode === "town") {
        const game = activeMiniGame;
        game.update(deltaTime);

        const state = game.getState();

        // TIME'S UP -> RESULTS
        if (state === "timesUp" && keyPressed("enter", previousEnter)) {
            game.showResults();
        }

        // RESULTS -> RETRY or RETURN TO HUB
        if (state === "results") {
            if (keyPressed("r", previousR)) {
                recordMiniGameResults();
                game.start();
                console.log("Restarting...");
            }
            if (keyPressed("h", previousH)) {
                recordMiniGameResults();
                completeTownGame();
                console.log("Returning to hub");
            }
        }
    }
}


//drawing the game hub
function drawHub() {

    // GRASS
    context.fillStyle = "#7fb069";
    context.fillRect(0, 0, canvas.width, canvas.height);


    // PATH (restored)
    context.fillStyle = "#777";
    context.fillRect(0, 380, canvas.width, 80);


    // BUILDING
    if (
        buildingSprite.complete &&
        buildingSprite.naturalWidth > 0
    ) {

        context.imageSmoothingEnabled = false;

        context.drawImage(
            buildingSprite,
            building.x,
            building.y,
            building.width,
            building.height
        );

    } else {

        // Fallback building and roof (no text here anymore)
        context.fillStyle = "#777";
        context.fillRect(building.x, building.y, building.width, building.height);

        context.fillStyle = "#444";
        context.fillRect(building.x, building.y, building.width, 40);
    }


    // BUILDING NAME (now drawn in both cases)
    context.fillStyle = "white";
    context.font = "bold 20px Arial";
    context.textAlign = "center";
    context.fillText("HOSPITAL", building.x + building.width / 2, building.y + 28);


    // DOOR
    if (
        doorSprite.complete &&
        doorSprite.naturalWidth > 0
    ) {

        context.drawImage(
            doorSprite,
            door.x,
            door.y,
            door.width,
            door.height
        );

    } else {

        context.fillStyle = "#222";
        context.fillRect(door.x, door.y, door.width, door.height);
    }


    // ENTER label
    context.fillStyle = "white";
    context.font = "12px Arial";
    context.fillText("ENTER", door.x + door.width / 2, door.y + 14);

    context.textAlign = "left";


    // PLAYER (restored, drawn after the building so it appears on top)
    drawPlayer();


    // INSTRUCTIONS
    context.fillStyle = "white";
    context.font = "16px Arial";
    context.fillText("WASD / Arrow Keys - Move", 20, 30);
    context.fillText("E - Enter / Interact", 20, 55);
}

//drawing interior of building//
function drawInterior() {

    //floor//
    context.fillStyle = "#c9b79c";

    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    //walls//
    context.fillStyle = "#654321";


    // Top
    context.fillRect(
        0,
        0,
        canvas.width,
        20
    );


    // Left
    context.fillRect(
        0,
        0,
        20,
        canvas.height
    );


    // Right
    context.fillRect(
        canvas.width - 20,
        0,
        20,
        canvas.height
    );


    // Bottom
    context.fillRect(
        0,
        canvas.height - 20,
        canvas.width,
        20
    );



    //title//
    context.fillStyle = "#222";

    context.font = "bold 24px Arial";

    context.textAlign = "center";

    context.fillText(
        "HOSPITAL",
        canvas.width / 2,
        60
    );


    //drawing npc//
    drawNPC();


    //drawing npc//
    drawPlayer();



    //running dialogue//
    if (!dialogueOpen) {

        const interactionRange = {

            x: npc.x - 25,
            y: npc.y - 25,

            width: npc.width + 50,
            height: npc.height + 50

        };


        if (
            isColliding(
                player,
                interactionRange
            )
        ) {

            context.fillStyle = "white";

            context.font =
                "bold 16px Arial";

            context.textAlign = "center";

            context.fillText(
                "Press E to talk",
                npc.x +
                npc.width / 2,
                npc.y - 25
            );

        }

    }


    context.textAlign = "left";


    //exit message//
    context.fillStyle = "#222";

    context.font = "16px Arial";

    context.fillText(
        "Move to the entrance and press E to leave",
        30,
        30
    );


    //door to exit//
    context.fillStyle = "#222";

    context.fillRect(
        interiorExit.x,
        interiorExit.y,
        interiorExit.width,
        interiorExit.height
    );


    context.fillStyle = "white";

    context.font = "12px Arial";

    context.textAlign = "center";

    context.fillText(
        "EXIT",
        interiorExit.x +
        interiorExit.width / 2,
        interiorExit.y + 25
    );


    context.textAlign = "left";

}

//drawing player//
function drawPlayer() {

    if (
        playerSprite.complete &&
        playerSprite.naturalWidth > 0
    ) {

        context.imageSmoothingEnabled = false;

        context.drawImage(
            playerSprite,
            player.x,
            player.y,
            player.width,
            player.height
        );

    } else {

        // Fallback: your original blue square with eyes
        context.fillStyle = "#2196f3";
        context.fillRect(player.x, player.y, player.width, player.height);

        context.fillStyle = "white";
        context.fillRect(player.x + 6, player.y + 6, 5, 5);
        context.fillRect(player.x + 17, player.y + 6, 5, 5);
    }
}

//drawing npc//
function drawNPC() {

    if (
        overWorldSprite.complete &&
        overWorldSprite.naturalWidth > 0
    ) {

        context.imageSmoothingEnabled = false;

        context.drawImage(
            overWorldSprite,
            npc.x,
            npc.y,
            npc.width,
            npc.height
        );

    } else {

        // Temporary fallback if sprite has not loaded yet
        context.fillStyle = "#ff69b4";

        context.fillRect(
            npc.x,
            npc.y,
            npc.width,
            npc.height
        );

        context.fillStyle = "#ffd6b3";

        context.fillRect(
            npc.x + 5,
            npc.y - 8,
            18,
            18
        );
    }

    // NPC interaction indicator
    context.fillStyle = "#ffd700";
    context.font = "bold 16px Arial";
    context.textAlign = "center";

    context.fillText(
        "!",
        npc.x + npc.width / 2,
        npc.y - 12
    );

    context.textAlign = "left";
}

//drawing dialogue//
function drawDialogue() {

    if (!dialogueOpen) {
        return;
    }

    //overlay//
    context.fillStyle =
        "rgba(0, 0, 0, 0.25)";

    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    //drawing dialogue box//
    const boxX = 60;
    const boxY = 330;
    const boxWidth = 780;
    const boxHeight = 130;

    context.fillStyle =
        "rgba(20, 20, 20, 0.97)";

    context.fillRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight
    );

    //border for dialouge//
    context.strokeStyle = "white";
    context.lineWidth = 3;

    context.strokeRect(
        boxX,
        boxY,
        boxWidth,
        boxHeight
    );

    //name for npc//
    context.fillStyle = "#ffd700";
    context.font = "bold 20px Arial";
    context.textAlign = "left";

    context.fillText(
        npc.name,
        boxX + 25,
        boxY + 30
    );

    //area for sprite in dialogue box//
    const spriteX = boxX + 25;
    const spriteY = boxY + 45;
    const spriteWidth = 90;
    const spriteHeight = 70;

    context.strokeStyle = "#888";
    context.lineWidth = 2;

    context.strokeRect(
        spriteX,
        spriteY,
        spriteWidth,
        spriteHeight
    );

    //npc sprite//
    if (
        npcSprite.complete &&
        npcSprite.naturalWidth > 0
    ) {

        context.drawImage(
            npcSprite,
            spriteX,
            spriteY,
            spriteWidth,
            spriteHeight
        );
    }

    //dialogue text//
    context.textAlign = "left";
    context.fillStyle = "white";
    context.font = "18px Arial";

    const textX = boxX + 140;

    //step 0//
    //goes by steps that are incremented to go through dialogue//

    if (dialogueStep === 0) {

        context.fillText(
            "Hello, welcome to the hospital.",
            textX,
            boxY + 65
        );

        context.fillText(
            "I am the doctor here and you'll be delivering needed medicine across town.",
            textX,
            boxY + 90
        );
    }

    //step 1//
    else if (dialogueStep === 1) {

        context.fillText(
            "In town, collect a package of medicine as it appears",
            textX,
            boxY + 65
        );

        context.fillText(
            "and deliver it to the glowing target.",
            textX,
            boxY + 90
        );
    }

    //step2//
    else if (dialogueStep === 2) {

        context.fillText(
            "Each successful delivery earns points and you'll receive harder tasks as you progress..",
            textX,
            boxY + 65
        );

        context.fillText(
            "You need 500 points for the flooded area and 1000 for the snow area.",
            textX,
            boxY + 90
        );
    }

    //step 3//
    else if (dialogueStep === 3) {

        context.fillText(
            "Your latest run: " +
            lastDeliveries +
            " package" +
            (lastDeliveries === 1 ? "" : "s") +
            " delivered.",
            textX,
            boxY + 65
        );

        context.fillText(
            "Current high score: " +
            highScore +
            " points.",
            textX,
            boxY + 90
        );

        context.fillText(
            "Highest achieved level: " +
            townLevel,
            textX,
            boxX + 110
        );
    }

    //step 4//
    if (dialogueStep === 4) {

        context.fillStyle = "#ffffff";
        context.font = "bold 18px Arial";

        context.fillText(
            "Choose a level:",
            boxX + 120,
            boxY + 35
        );


        //level 1//
        context.fillStyle = "#ffffff";
        context.font = "bold 15px Arial";

        context.fillText(
            "[1] Level 1 - UNLOCKED",
            boxX + 120,
            boxY + 65
        );


        //level 2//
        if (townLevel >= 2) {

            context.fillStyle = "#ffffff";

            context.fillText(
                "[2] Level 2 - UNLOCKED",
                boxX + 120,
                boxY + 90
            );

        } else {

            context.fillStyle = "#777777";

            context.fillText(
                "[2] Level 2 - LOCKED (500 points)",
                boxX + 120,
                boxY + 90
            );
        }


        //level3//
        if (townLevel >= 3) {

            context.fillStyle = "#ffffff";

            context.fillText(
                "[3] Level 3 - UNLOCKED",
                boxX + 400,
                boxY + 65
            );

        } else {

            context.fillStyle = "#777777";

            context.fillText(
                "[3] Level 3 - LOCKED (1000 points)",
                boxX + 400,
                boxY + 65
            );
        }


        //esc//
        context.fillStyle = "#aaaaaa";
        context.font = "bold 14px Arial";
        context.textAlign = "right";

        context.fillText(
            "[ESC] Exit",
            boxX + boxWidth - 20,
            boxY + boxHeight - 16
        );

        context.textAlign = "left";
    }

    //continue message in the bottom//
    if (dialogueStep < 4) {

        context.fillStyle = "#aaaaaa";
        context.font = "bold 14px Arial";
        context.textAlign = "right";

        context.fillText(
            "[ENTER] Continue",
            boxX + boxWidth - 20,
            boxY + boxHeight - 16
        );

        context.textAlign = "left";
    }

    //choices for mini games//
    if (dialogueStep === 5) {

        context.font = "bold 16px Arial";

        context.fillStyle = "#66ff99";

        context.fillText(
            "[Y] Start Game",
            boxX + 500,
            boxY + 65
        );

        context.fillStyle = "#ff8888";

        context.fillText(
            "[N] Not Yet",
            boxX + 500,
            boxY + 95
        );
    }

    context.textAlign = "left";
}

//drawing intro screen//
function drawIntroScreen() {

    const intro = introScreens[introType];

    if (!intro) return;

    // Dark overlay
    context.save();

    context.fillStyle = "rgba(0, 0, 0, 0.82)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Main panel
    const panelWidth = 680;
    const panelHeight = 350;

    const panelX = (canvas.width - panelWidth) / 2;
    const panelY = (canvas.height - panelHeight) / 2;

    context.fillStyle = "#ffffff";
    context.fillRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight
    );

    // Border
    context.strokeStyle = "#222222";
    context.lineWidth = 4;

    context.strokeRect(
        panelX,
        panelY,
        panelWidth,
        panelHeight
    );

    // Title
    context.textAlign = "center";

    context.fillStyle = "#222222";
    context.font = "bold 32px Arial";

    context.fillText(
        intro.title,
        canvas.width / 2,
        panelY + 55
    );

    // Subtitle
    context.font = "bold 20px Arial";
    context.fillStyle = "#4caf50";

    context.fillText(
        intro.subtitle,
        canvas.width / 2,
        panelY + 90
    );

    // Description
    context.textAlign = "left";

    context.font = "17px Arial";
    context.fillStyle = "#333333";

    let textY = panelY + 135;

    intro.description.forEach(line => {

        context.fillText(
            line,
            panelX + 45,
            textY
        );

        textY += 28;
    });

    // Controls
    context.textAlign = "center";

    context.font = "bold 15px Arial";
    context.fillStyle = "#666666";

    context.fillText(
        intro.controls,
        canvas.width / 2,
        panelY + panelHeight - 55
    );

    // Continue prompt
    context.font = "bold 18px Arial";
    context.fillStyle = "#222222";

    context.fillText(
        "PRESS ENTER OR SPACE TO CONTINUE",
        canvas.width / 2,
        panelY + panelHeight - 20
    );

    context.restore();
}

//drawing//
function draw() {

    //hub//

    if (gameMode === "hub") {

        if (playerInside) {
            drawInterior();
        } else {
            drawHub();
        }

        drawDialogue();

        //hub intro

        if (introScreenOpen && introType === "hub") {
            drawIntroScreen();
        }

        return;
    }

    //the minigames//

    if (gameMode === "town" && activeMiniGame) {

        activeMiniGame.draw(context);

        if (introScreenOpen) {
            drawIntroScreen();
        }

        return;
    }

    context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    //hub//
    if (gameMode === "hub") {

        if (playerInside) {
            drawInterior();
        }
        else {
            drawHub();
        }

        drawDialogue();

        if (introScreens && introType === "hub") {
            drawIntroScreen();
        }

        return;
    }

    //mini games//


    if (gameMode === "town" && activeMiniGame) {
        activeMiniGame.draw(context);

        //minigame intros

        if (introScreenOpen) {
            drawIntroScreen();
        }
    }

    //town delivery//
    else if (gameMode === "town") {
        if (activeMiniGame) {
            activeMiniGame.draw(context);
        }
    }



}


//update keystates//
function updatePreviousKeys() {

    previousE = keys.has("e");
    previousY = keys.has("y");
    previousN = keys.has("n");

    previousEnter = keys.has("enter");

    previousR = keys.has("r");
    previousH = keys.has("h");

    previous1 = keys.has("1");
    previous2 = keys.has("2");
    previous3 = keys.has("3");

    previousEscape = keys.has("escape");
}


//gameloop//
function gameLoop(timestamp) {

    if (lastTime === 0) {

        lastTime = timestamp;

    }


    const deltaTime =
        Math.min(
            (timestamp - lastTime) / 1000,
            0.05
        );


    lastTime = timestamp;


    update(deltaTime);

    draw();


    // Update key states AFTER input
    // has been processed
    updatePreviousKeys();


    requestAnimationFrame(gameLoop);

}


//starting game//
requestAnimationFrame(gameLoop);
