function SVGDrawer(target, staggerValue) {
    this.pvalue = 0;
    this.totalLen = 0;
    this.staggerValue = staggerValue ? staggerValue : 0;

    //ALLOWED TAGS TO ANIMATE
    this.tags = ["path", "circle", "rect", "line", "shape", "ellipse", "polyline"];
    this.paths = [];


    //Recursive finding of all things we can animate
    //
    //helper to check id we can animate an element by thitelisted tags
    this.canWeAnimateThis = function(domelem) {
        for (var i = 0; i < this.tags.length; i++) {
            if (domelem.tagName == this.tags[i]) return true;
        }
        return false;
    }

    //recursive finding
    this.totalLen = 0;
    this.recursiveParse = function(parent) {
        var tmpElem = null;
        //loop on children...
        for (var k = 0; k < parent.childNodes.length; k++) {
            //can we animate this guy? if so lets instance it as a segment
            if (parent.childNodes[k] instanceof SVGPathElement || this.canWeAnimateThis(parent.childNodes[k])) {
                //create the segment
                var path = new SVGSegment(parent.childNodes[k]);
                //keep track of the total len
                this.totalLen += path.length;
                //store it for future use
                this.paths.push(path);
            } else {
                //otherwise lets find child nodes
                this.recursiveParse(parent.childNodes[k]);
            }
        }
    }
    //find them!
    this.recursiveParse(target);
    this.paths.reverse();
    console.log(this.paths)

    //its time to set the sequential progress
    var len = 0;
    var svgelem = null;
    for (var k = 0; k < this.paths.length; k++) {
        svgelem = this.paths[k];
        var lengthPercent = svgelem.length / this.totalLen;
        //calc linear solving for init
        svgelem.linearinit = this.solveLinear(0,len, 1, 0);
        //calc linear solving for end
        len += lengthPercent;
        svgelem.linearend = this.solveLinear(0,len, 1, 1);
        
    }
    this.calcStagger();
}

//getters and setters
SVGDrawer.prototype = {
    set progress(p) {
        this.pvalue = Math.max(0, Math.min(p, 1));;
        this.draw();
    },
    get progress() {
        return this.pvalue;
    },
    set stagger(s){
        this.staggerValue = s;
        this.calcStagger();
    },
    get stagger(){
        return this.staggerValue;
    }
};

/**
 * Calculate the stagger based on the original progress position.
 * @return {null}
 */
SVGDrawer.prototype.calcStagger = function() {
    var linearinit, linearend = null;
    for (var i = 0; i < this.paths.length; i++) {
        svgelem = this.paths[i];
        //set the boundaries
        svgelem.initProgress = svgelem.linearinit.m * this.staggerValue + svgelem.linearinit.b;
        svgelem.endProgress = svgelem.linearend.m * this.staggerValue + svgelem.linearend.b;
        //apply props staggers
        svgelem.parseOffsets();
        //create the linear solvers to map global progress to internal progress
        svgelem.linearProgress = this.solveLinear(svgelem.initProgress, 0, svgelem.endProgress, 1);
    }
};

SVGDrawer.prototype.solveLinear = function(x1, y1, x2, y2) {
    //lineal f(x)=mx+b
    var mpos = (y1 - y2) / (x1 - x2);
    var bpos = y1 - mpos * x1;
    //var res = mypos * valorActual + bypos;
    return { m: mpos, b: bpos };
};

SVGDrawer.prototype.draw = function() {
    var displayp = 1 - this.pvalue;
    var itemp;
    for (var i = 0; i < this.paths.length; i++) {
        itemp = this.paths[i].linearProgress.m * displayp + this.paths[i].linearProgress.b;
        this.paths[i].progress = itemp;
    }
};



/**
 * Holds data of each drawable path to be drawn
 * @param {SVGGeometryElement} elem The element to draw the line on
 */
function SVGSegment(elem){

    /**
     * A safe cap const to enlarge a bit the path. This should fix some ugly things in IE
     * @type {Number}
     */
    this.SAFE_CAP_IE = 1;
    /**
     * The element to draw the border on
     * @type {SVGGeometryElement}
     */
    this.elem = elem;
    /**
     * Total length of the path
     * @type {float}
     */
    this.length = elem.getTotalLength();
    /**
     * Flags the element to ver draw reversed
     * @type {bool}
     */
    this.reverse = this.elem.getAttribute("drawreverse") ? true : false;
    
    //internal

    /**
     * Internal progress
     * @type {Number}
     */
    this.p = 0;
    /**
     * Init of the internal progress, relative to global progress
     * @type {Number}
     */
    this.init = 0;
    /**
     * End of internal progress, relative to external progress
     * @type {Number}
     */
    this.end = 1;

    //init the elem dash array equal to the total length. The offset will create the appearence of movement.
    this.elem.style.strokeDasharray = this.length + " " + (this.length + this.SAFE_CAP_IE * 2);

    //linear solverrs. Stores m and b parts of equations to solve staggering
    this.linearInit = null;
    this.linearEnd = null;

    //linears solver for mapping progress
    this.linearProgress = null;

    //offsets for start and end based on its path len using percents (0-1 values)
    this.offsetInit = 0;
    this.offsetEnd = 0;
}

/**
 * Getterns and setters for internal values.
 * @type {Object}
 */
SVGSegment.prototype = {
    set progress(p){
        this.p = Math.max(0, Math.min(p, 1));
        this.draw();
    },
    get progress(){
        return p;
    },
    set initProgress(initp){
        this.init = initp;
    },
    get initProgress(){
        return this.init;
    },
    set endProgress(endp){
        this.end = endp;
    },
    get endProgress(){
        return this.end;
    }
}

SVGSegment.prototype.parseOffsets = function(){
    var offsetInit = this.elem.getAttribute("offset");
    //parse init
    if(offsetInit && parseFloat(offsetInit)){
        if(offsetInit.indexOf("px") != -1){
            //convert px values to percent values
            this.offsetInit = parseFloat(offsetInit) / this.length;
        }else{
            this.offsetInit = parseFloat(offsetInit) * -1;
        }
    }else{
        offsetInit = 0;
    }
    //apply
    var ww = this.end - this.init;
    this.init += ww*this.offsetInit;
    this.end = this.init + ww;
}


SVGSegment.prototype.draw = function(){
    if(this.reverse){
        this.elem.style.strokeDashoffset = -1 * (this.length * this.p);
    }else{
        this.elem.style.strokeDashoffset = (this.length * this.p);
    }
}



/**
 * Creates a debugger instance
 * @param {SVGDrawer} tarSvgDrawElem 
 */
var DebugSvgTimeline = function(tarSvgDrawElem){
    this.container = document.createElement("div");
    this.tar = document.createElement("div");
    //
    document.body.appendChild(this.container);
    this.container.appendChild(this.tar);
    //
    this.svg = tarSvgDrawElem;
    //
    this.ww = this.tar.offsetWidth;
    this.hh = this.tar.offsetHeight;
    //
    this.container.style.position = "fixed";
    this.container.style.width = "100%";
    this.container.style.top = "0px";
    this.container.style.left = "0px";
    //
    this.tar.style.position = "relative";
    this.tar.style.height = "30px";
    this.tar.style.backgroundColor = "#eeeeee";
    //
    this.update();

} 

DebugSvgTimeline.prototype.update = function(){
    var len = this.svg.paths.length;
    var hline = 3;
    var basehue = Math.random()*360;
    if(len<30){
        hline = Math.round(30/len);
    }else{
        this.tar.style.height = len+"px";
    }
    document.body.style.paddingTop = this.tar.style.height;
    this.tar.innerHTML = "";
    for (var i = 0; i < len; i++) {
        var div = document.createElement("div");
        var wwPercent = this.svg.paths[i].endProgress - this.svg.paths[i].initProgress;
        var tleft = 100 * (1 - (this.svg.paths[i].initProgress + wwPercent));
        var top = (len-i-1)*hline;
        div.style.backgroundColor = "hsl("+basehue+", 100%, "+i*60/len+"%)"
        div.style.height = (hline-1)+"px";
        div.style.border = "1px solid #fff";
        div.style.width = (100 * wwPercent)+"%";
        div.style.position = "absolute";
        div.style.top = top+"px";
        div.style.left = tleft+"%";
        this.tar.appendChild(div);
    }
    var div = document.createElement("p");
    div.style.position = "absolute";
    div.style.bottom = "1px";
    div.style.margin = "0px";
    div.style.left = "5px";
    div.style.padding = "2px";
    div.style.backgroundColor = "#ffffff";
    div.style.fontSize = "10px";
    div.style.fontFamily = "sans, Arial";
    div.innerHTML = (len+" elems. | stagger "+this.svg.stagger).toUpperCase();
    div.style.opacity = "0.85";
    this.tar.appendChild(div);
}








