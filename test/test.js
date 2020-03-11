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