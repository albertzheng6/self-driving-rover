//retrieves the node in the DOM representing the <canvas> element
const canvas = document.querySelector('canvas');

//fit canvas to window
canvas.width = window.innerWidth;

//allow accesss to methods to make 2d drawings
const ctx = canvas.getContext('2d');

//Global
const x_init = 50;
const y_init = 600;
const x_target = 1242;
const y_target = 27;

// Generate elements
const bound = new Bound();
const robots = generateRobots(100); // create N robots with RANDOMIZED brains
let bestRobot = robots[0]; //robot 0 always refers to best robot
const map = map1;
const objects = [];
for (let i=0; i<map.length; i++) {
    objects.push(new Object(map[i].points,map[i].fill))
}

// Generate N robot each with randomly initialized brains
function generateRobots(N) {
    let robots = [];
    for (let i=0; i<N; i++) {
        robots.push(new Robot(x_init,y_init,12,20,3,"AI"));
    }
    return robots;
}

function animate() {

    // the robot class handles all sensor related info by itself
    //update state of robots and sensor
    for (let i=0; i<robots.length; i++) {
        robots[i].update(bound.borders,objects);
    }

    /**
     * Find the best performing robots
     * We use multiple fitness functions to determine the best performing robot. Some 
     * are appropriate for certain situations and fitness functions may need to be 
     * changed in the middle of testing. All follow the same general process:
     * Step 1: Map array of fitness values of all the robots.
     * Step 2: Find the min/max fitness value of all the robots.
     * Step 3: Find the robot that contains the min/max fitness value.
     */

    //fitness function: min displacement from target
    let disps = [];
    for (let i=0; i<robots.length; i++) {
        disps.push(getDisplacement(robots[i].x,robots[i].y,x_target,y_target));
    }
    const minDisp = Math.min(...disps);
    for (let i=0; i<robots.length; i++) {
        if (getDisplacement(robots[i].x,robots[i].y,x_target,y_target) == minDisp) 
        {
            bestRobot = robots[i];
        }
    }

    //fitness function: max displacement from start
    // let disps = [];
    // for (let i=0; i<robots.length; i++) {
    //     disps.push(getDisplacement(x_init,y_init,robots[i].x,robots[i].y));
    // }
    // const maxDisp = Math.max(...disps);
    // for (let i=0; i<robots.length; i++) {
    //     if (getDisplacement(x_init,y_init,robots[i].x,robots[i].y) == minDisp) 
    //     {
    //         bestRobot = robots[i];
    //     }
    // }

    canvas.height = window.innerHeight;

    //draw bound
    bound.draw(ctx);

    //draw objects and target (target is ALWAYS the last object in the objects array)
    for (let i=0; i<objects.length; i++) {
        if (i != objects.length-1) {
            objects[i].draw(ctx,"black");
        }
        else {
            objects[i].draw(ctx,"green");
        }
    }
    
    /**
     * Draw updated state of AI robots with transparency. Some robots appear to be 
     * "solid" bc they are overlapping with several highly transparent robots.
     */
     ctx.globalAlpha = 0.2;
     for (let i=0; i<robots.length; i++) {
        robots[i].draw(ctx,false);
    }
    ctx.globalAlpha = 1;
    bestRobot.draw(ctx,true);


    requestAnimationFrame(animate); //call animate method again

}

/**
 * LOCAL STORAGE
 * The localStorage object to save, read, and remove data in the form of JSON strings 
 * from local storage, which exists in the local browser forever. 
 * (sessionStorage stores data for only one session)
 * https://www.w3schools.com/jsref/prop_win_sessionstorage.asp
 * window.localStorage == localStorage
 * TYPE "localStorage" IN CONSOLE TO ACCESS DATA
 */

//store brain of best robot in local storage
function saveBest() {
    window.localStorage.setItem("ai_rover_map1", JSON.stringify(bestRobot.brain));
    console.log("SAVED")
}

//discard brain of best robot in local storage
function discardBest() {
    window.localStorage.removeItem("ai_rover_map1");
    console.log("DISCARDED");
}

//get brain of best roobt in local storage
function getBest() {
    return JSON.parse(window.localStorage.getItem("ai_rover_map1"));
}

// Keep commented if not using
document.onkeydown = (event) => {
    switch(event.key) {
        case "s":
            //console.log(bestRobot.brain);
            saveBest();
            break;
        case "d":
            discardBest();
            break;
    }
}

/**
 * How to create maps: move mouse to corners of desired object, press z at each corner 
 * to save. Keep commented if not using
 */
let obj = {"points":[],"fill":true};
let mouse = {x:undefined,y:undefined};
window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
})
document.addEventListener('keydown', (event) => {
    if (event.key == "z") {
        obj.points.push({x:mouse.x,y:mouse.y});
        console.log(obj);
    }
})

if(localStorage.getItem("ai_rover_map1") != null) {
    // give best brain to robot 0 (parent robot)
    robots[0].brain = getBest();

    //give mutated versions of best brain to other robots (children robots)
    for (let i=1; i<robots.length; i++) {
        robots[i].brain = getBest();
        Network.mutate(robots[i].brain,0.1);
    }
}

animate();