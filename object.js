class Object {
    //takes in an array of points (each point has x and y values)
    constructor(points,fill) {

        //every line formed by 2 consecutive points
        this.borders = [];
        for (let i=0; i<points.length-1; i++) {
            this.borders.push([points[i],points[i+1]]);
        }
        this.borders.push([points[points.length-1],points[0]])

        //location of corners
        this.corners = points;

        //filled/unfilled object
        this.fill = fill;
    }

    //draw filled/unfilled object
    draw(ctx,color) {

        if (this.fill == true) {
            ctx.beginPath();
            ctx.moveTo(this.corners[0].x,this.corners[0].y); //start top left corner
            for (let i=1; i<this.corners.length; i++) {
            ctx.lineTo(this.corners[i].x,this.corners[i].y); //move to remning corners
            }
            ctx.fillStyle = color;
            ctx.fill();
        }

        if (this.fill == false) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = color;
            this.borders.forEach(border => {
            ctx.beginPath();
            ctx.moveTo(border[0].x,border[0].y);
            ctx.lineTo(border[1].x,border[1].y);
            ctx.stroke();
            })
        }
        
    }

}