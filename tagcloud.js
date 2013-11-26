function tagCloud() {

    /* parameters */

    var tagLabels,
        tagSize;

    // optional (with defaults)
    var fontScale = d3.scale.linear().domain([0,1]).range([10,20]),
        padding = 15,
        maxCollisionSearchRadius = 100,
        groupID,
        tagClickCallback;

    /* internal data */

    var force = d3.layout.force().gravity(0);

    /* tag cloud construction function */

    function my(svg) {
        if (tagLabels === undefined) {
            throw new ReferenceError("Must define a tagLabels function");
        }
        if (tagSize === undefined) {
            throw new ReferenceError("Must define a tagSize function");
        }

        var width  = svg.attr("width"),
            height = svg.attr("height"),
            data = svg.datum(),
            numGroups = groupID ? numUnique(data.map(groupID)) : 1;

        /* text labels */

        var tags = d3.select(tagcloud).selectAll(".tagtext").data(data, tagLabels);

        tags.enter()
            .append("div")
            .attr("class","tagtext")
            .text(tagLabels)
            .style("font-size", function(d) { return fontScale(tagSize(d)) + "px"; })
            .each(function(d) {
                var rect = this.getBoundingClientRect();
                d.dx = rect.width;
                d.dy = rect.height;
            })
            .on("click",tagClickCallback)
            .call(force.drag);

        tags.transition()
            .duration(200)
            .style("font-size", function(d) { return fontScale(tagSize(d)) + "px"; })
            .tween("tag_dxdy", function (d) {
                return function (t) {
                    var rect = this.getBoundingClientRect();
                    d.dx = rect.width;
                    d.dy = rect.height;
                };
            })
            .style("opacity",1);

        tags.exit().transition()
            .duration(250)
            .style("opacity",0)
            .remove();

        /* nodes (circles) */

        var nodes = svg.selectAll(".g-node").data(data, tagLabels);

        nodes.enter()
            .append("circle")
            .attr("class", function(d) {
                return groupID ? ("group" + groupID(d)) : "";
            })
            .classed("g-node",true)
            .attr("r", function(d) { return Math.max(d.dx,d.dy)/2 + padding/2 + "px"; })
            .on("click",tagClickCallback)
            .call(force.drag);

        nodes.transition()
            .duration(200)
            .tween("node_dxdy", function (d) {
                return function (t) {
                    d3.select(this).attr("r", function(d) {
                        return Math.max(d.dx,d.dy)/2 + padding/2 + "px";
                    });
                };
            })
            .style("opacity",1);

        nodes.exit().transition()
            .duration(250)
            .style("opacity",0)
            .remove();

        /* force and collisions */

        // The next function based on Dr. Mike Bostock's collision function,
        // only slightly modified. I think it's a pretty standard thing to do.
        function collide(alpha) {
            var q = d3.geom.quadtree(data);
            return function(d) {
                var r = Math.max(d.dx,d.dy)/2 + maxCollisionSearchRadius + padding,
                    nx1 = d.x - r,
                    nx2 = d.x + r,
                    ny1 = d.y - r,
                    ny2 = d.y + r;
                q.visit(function(quad, x1, y1, x2, y2) {
                    if (quad.point && quad.point !== d && d.other !== quad.point && d !== quad.point.other) {
                        var x = d.x - quad.point.x,
                            y = d.y - quad.point.y,
                            l = Math.sqrt(x * x + y * y),
                            r = Math.max(d.dx,d.dy)/2 + Math.max(quad.point.dx,quad.point.dy)/2 + padding;
                        if (l < r) {
                            l = (l - r) / l * alpha;
                            d.x -= x *= l;
                            d.y -= y *= l;
                            quad.point.x += x;
                            quad.point.y += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }

        function gravity(alpha) {
            return function(d) {
                var idx = groupID ? groupID(d) : 1;
                d.x += (width/(numGroups+1)*(idx+1) - d.x)*alpha;
                d.y += (height/2 - d.y)*alpha*1.618;
            };
        }

        force.nodes(data)
            .on("tick", function(e) {
                nodes
                    .each(gravity(e.alpha*0.1))
                    .each(collide(0.5))
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });

                tags
                    .style("left", function (d) { return (d.x - d.dx/2) + "px"; })
                    .style("top" , function (d) { return (d.y - d.dy/2) + "px"; });
            })
            .start();

    }

    /* getters and setters */

    my.fontScale = function(_) {
        if (!arguments.length) return fontScale;
        fontScale = _;
        return my;
    };

    my.padding = function(_) {
        if (!arguments.length) return padding;
        padding = _;
        return my;
    };

    my.maxCollisionSearchRadius = function(_) {
        if (!arguments.length) return maxCollisionSearchRadius;
        maxCollisionSearchRadius = _;
        return my;
    };

    my.tagClickCallback = function(_) {
        if (!arguments.length) return callClickCallback;
        callClickCallback = _;
        return my;
    };

    my.tagLabels = function(_) {
        if (!arguments.length) return tagLabels;
        tagLabels = _;
        return my;
    };

    my.groupID = function(_) {
        if (!arguments.length) return groupID;
        groupID = _;
        return my;
    };

    my.tagSize = function(_) {
        if (!arguments.length) return tagSize;
        tagSize = _;
        return my;
    };

    /* utils */

    function numUnique(arr) {
        var hash = d3.map();
        arr.map(function (v) { hash.set(v,true); });
        return hash.keys().length;
    }

    return my;
}
