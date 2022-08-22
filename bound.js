class Bound {
    constructor() {
        //define bounds
        //array bc it allows for more complex shapes with multiple line segs

        let horiz = 0;
        let vert = 0;
        const topLeft = {x:window.innerWidth*horiz,y:window.innerHeight*vert};
        const topRight = {x:window.innerWidth*(1-horiz),y:window.innerHeight*vert};
        const botRight = {x:window.innerWidth*(1-horiz),y:window.innerHeight*(1-vert)};
        const botLeft = {x:window.innerWidth*horiz,y:window.innerHeight*(1-vert)};

        this.borders = [
            [topLeft,topRight],
            [topRight,botRight],
            [botRight,botLeft],
            [botLeft,topLeft]
        ];
    }

    //draw bounds
    draw(ctx) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = "white";
        this.borders.forEach(border => {
            ctx.beginPath();
            ctx.moveTo(border[0].x,border[0].y);
            ctx.lineTo(border[1].x,border[1].y);
            ctx.stroke();
        })
    }
}