class Robot {
    constructor(x,y,width,height,maxVel,controlType) {
        this.x = x; //x pos of top left corner of robot rel to top left corner of window
        this.y = y; //y pos of top left corner robot rel to top left corner of window
        this.width = width; //width of robot
        this.height = height; //height of robot

        this.vel = 0;
        this.accel = 0.2; //constant acceleration
        this.maxVel = maxVel;
        this.friction = 0.05; //coefficient of kinetic friction
        this.angle = 0; // define a unit circle st north is 0, ccw is pos
        this.damaged = false; //has robot touched borders/objects
        
        this.controls = new Controls(controlType);

        //Even in the constructor, controlType is still referring to the parameter,
        //NOT the instance variable.
        this.controlType = controlType

        //"this" refers to the entire object
        //"sensor" refers to the rays associated with this object
        this.sensor = new Sensor(this);

        if (controlType == "AI") {
            /**
             * When we save the brain of the best robot, we are essentially saving 
             * the prtclr weights/biases of that brain. Those unique weights/biases
             * were the optimal parameters out of the group of robots that were 
             * tested.
             * NOTE: when det how to save best brain, should i save this.brain or 
             * this.brain (the entire Network object) or this.brain.level1 and 2 
             * (the actual arrays that hold the precious parameter values)???
             */
             this.brain = new Network(this.sensor.numRays,9,4);
             //this.brain = BESTBRAIN;
        }
    }

    update(borders,objects) {

        //update state of robot (as long as it isnt dmged)
        if (!this.damaged) {

            this.#move(); //update numerical state of robot

            //using current posn of robot update numerical state of corners of robot
            this.polygon = this.#createPolygon();

            //check if there is collision with borders
            this.damaged = this.#assessDamage(borders,objects);

        }

        /**
         * Update state of sensor (even if car is dmged)
         * The brain completely relies on the sensor data. Thus, after the sensors are 
         * updated, we immediately send the information into the brain for it to produce 
         * an output. We then directly connect the output to the control values.
         */
        if (this.sensor) {

            //update state of sensor
            this.sensor.update(borders,objects);
            
            //use sensor data to determine controls
            if (this.controlType == "AI") {
                /**
                 * We define our sensor data for each ray to be 1 minus the min offset
                 * for that prtclr ray, to emphasize that higher values mean objects 
                 * are closer (unlike offset). 
                 * We obtain the min offset thru the readings array in the Sensor 
                 * class. If an element (is null), we set the sensor data equal 0 
                 * for that prtlcr ray. We create an array to store this sensor 
                 * data for each ray.
                 * 
                 * AKA
                 * const sensorData=this.sensor.readings.map(s=>s==null?0:1-s.offset);
                 */
                let sensorData = [];
                for (let i=0; i<this.sensor.readings.length; i++) {
                    if (this.sensor.readings[i] != null) {
                        sensorData.push(1-this.sensor.readings[i].offset);
                    }
                    else {
                        sensorData.push(0);
                    }
                }
                //console.log(sensorData); //debug
                
                //Calculate 4 discrete output values using forward prop by inputting 
                //sensor data into the "brain"
                const outputs = Network.forwardProp(this.brain, sensorData);
                //console.log(outputs); //debug

                //connect output to controls
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }

        }

    }

    //check if there is collision for each object border or bound
    #assessDamage(borders,objects) {

        //check each border
        for (let i=0; i<borders.length; i++) {
            if(polysIntersect(this.polygon, borders[i])) {
                return true;
            }
        }

        //check each object border
        for (let i=0; i<objects.length; i++) {
            for (let j=0; j<objects[i].borders.length; j++) {
                if(polysIntersect(this.polygon, objects[i].borders[j])) {
                    return true;
                }
            }
        }

        return false;
    }

    #move() {

        if (this.controls.forward) {
            this.vel += this.accel;
        }

        if (this.controls.reverse) {
            this.vel -= this.accel;
        }

        // prevents robot from going over max forward speed
        if (this.vel > this.maxVel) {
            this.vel = this.maxVel;
        }

        // prevents robot from going over max reverse speed
        if (this.vel < -this.maxVel) {
            this.vel = -this.maxVel;
        }

        //frictional force opposes forward motion
        if (this.vel > 0) {
            this.vel -= this.friction;
        }

        //frictional force opposes reverse motion
        if (this.vel < 0) {
            this.vel += this.friction;
        }

        //fixes bug where robot is moving due to velocity too small of a value
        //relative to friction
        if (Math.abs(this.vel) < this.friction) {
            this.vel = 0;
        }

        /**
         * Allows robot to rotate in place. If car is moving forward, right key turns 
         * robot right and left key turns robot left. If robot is moving reverse, right 
         * key turns robot right and left key turns robot left. This is defined as such 
         * bc it mimics the functionality of a steering wheel.
         */

        const sign = this.vel >= 0 ? 1 : -1;

        if (this.controls.right) {
            this.angle -= 0.05 * sign;
        }

        if (this.controls.left) {
            this.angle += 0.05 * sign;
        }

        /**
         * Note that x and y are coordinates in the DEFAULT reference frame. 
         * The negative sign is because in canvas, up and left is neg directions. 
         * For each delta t, x and y change depending on the mag and orient of 
         * the velocity vector, which is defined by how the arrow keys have been 
         * pressed.
         * 
         * The following 2 lines ONLY update the POSITION of the robot. The draw 
         * function will update the ORIENTATION of the robot.
         */
        this.x -= Math.sin(this.angle) * this.vel;
        this.y -= Math.cos(this.angle) * this.vel;

    }

    //allows us to easily manipulate shape of robot (add/move corners)
    #createPolygon() {

        const corners = []; //each ele gives location for a corner of the robot
        const rad = Math.hypot(this.width,this.height) / 2; //radius of robot

        //angle between a vert line and line connecting midpoint and a corner
        const alpha = Math.atan2(this.width,this.height);

        //to make rectangle
        //top right
        corners.push({
            x: this.x - rad * Math.sin(this.angle - alpha),
            y: this.y - rad * Math.cos(this.angle - alpha)
        });
        //top left
        corners.push({
            x: this.x - rad * Math.sin(this.angle + alpha),
            y: this.y - rad * Math.cos(this.angle + alpha)
        });
        //bot left
        corners.push({
            x: this.x - rad * Math.sin(Math.PI + this.angle - alpha),
            y: this.y - rad * Math.cos(Math.PI + this.angle - alpha)
        });
        //bot right
        corners.push({
            x: this.x - rad * Math.sin(Math.PI + this.angle + alpha),
            y: this.y - rad * Math.cos(Math.PI + this.angle + alpha)
        });

        // //to make triangle
        // //pointy
        // corners.push({
        //     x: this.x - rad * Math.sin(this.angle),
        //     y: this.y - rad * Math.cos(this.angle)
        // });
        // //bot left
        // corners.push({
        //     x: this.x - rad * Math.sin(Math.PI + this.angle - alpha),
        //     y: this.y - rad * Math.cos(Math.PI + this.angle - alpha)
        // });
        // //bot right
        // corners.push({
        //     x: this.x - rad * Math.sin(Math.PI + this.angle + alpha),
        //     y: this.y - rad * Math.cos(Math.PI + this.angle + alpha)
        // });

        return corners;
    }

    // Updates reference frame and draws updated position and orientation of 
    // robot AND sensors.
    // Initial ref frame is relative to top left corner, but changes continuously
    // to match robot's position and rotate to fit robot's orientation.
    drawOld(ctx) {

        ctx.save();

        /**
         * The purpose of the following two lines are to update the visual 
         * orientation of the robot. The translate and rotate functions change 
         * the ref frame, NOT the robot. We essentially have a moving ref frame 
         * where the origin is always at the center of the robot, and rotations 
         * are about the center of the robot.
         */

        ctx.translate(this.x,this.y); // create new ref frame st O is at robot posn
        ctx.rotate(-this.angle); //rotation angle is cw in radians

        //draw position of robot in the new, translated+rotated ref frame
        //Note that positions in rect() is not (0,0) because position is defined 
        //as the position of the top left corner of the element. The inputs for 
        //the position allow the center of the robot to be at the origin.
        ctx.beginPath();
        ctx.rect(
            -this.width/2,
            -this.height/2,
            this.width,
            this.height
        );
        ctx.fillStyle = 'blue';
        ctx.fill();

        ctx.restore();

        this.sensor.draw(ctx);

    }

    //replace old draw method
    draw(ctx,drawSensor) {

        //draw dmgd or not dmgd car
        if (this.damaged == true) {
            ctx.fillStyle = "silver";
        }
        else {
            ctx.fillStyle = "blue";
        }

        //draw current state of robot using its corners
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x,this.polygon[0].y); //move to 1st corner
        for (let i=1; i<this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x,this.polygon[i].y); //move to remning corners
        }
        ctx.fill();

        //draw current state of sensors
        if ((this.sensor != null) && (drawSensor == true)) {
            this.sensor.draw(ctx);
        }

    }

}