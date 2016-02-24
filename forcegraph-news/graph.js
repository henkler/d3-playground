var forcemap = function()  {
  var outerWidth;
  var outerHeight;
  var margin;
  var innerWidth;
  var innerHeight;
  var minNodeRadius = 16;
  var baseNodeRadius = 2;
  var force;
  var svg;
  var g;

  var dataPath;
  var data;

  var timer = null;

  var init = function(path, width, height) {
    dataPath = path;
    outerWidth = width;
    outerHeight = height;
    margin = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    innerWidth = outerWidth - margin.left - margin.right;
    innerHeight = outerHeight - margin.top - margin.bottom;

    force = d3.layout.force()
      .size([innerWidth, innerHeight])
      .gravity(0.15)
      .linkDistance(function(link) { return 20 + getNodeRadius(link.source) + getNodeRadius(link.target); })
      .charge(function(node) { return -100 * node.weight; })
      .on("tick", forceTick);

    svg = d3.select("#forcemap").append("svg")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    svg.append("clipPath")
      .attr("id", "circleClip")
      .append("circle");

    g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }

  var start = function() {
    if (force && !timer) {
      // reload the node list every minute
      timer = setInterval(function() { renderMapData(); }, 60 * 1000);
      renderMapData();
    }
  }

  var stop = function() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  var renderMapData = function() {
    d3.json(dataPath, function(error, rawdata) {
      if (error) throw error;

      data = transformToNodesAndLinks(rawdata);
      render();
    });
  }

  var transformToNodesAndLinks = function(rawdata) {
    var nodes = [];
    var nodeAuthorMap = {};
    var nodeStoryMap = {};
    var links = [];
    var linkMap = {};

    rawdata.forEach(function(story) {
      // create the author as a node
      var authorID = story.author.username;
      var authorNode = nodeAuthorMap[authorID];
      // push the node if we haven't seen it already
      if (!authorNode) {
        authorNode = {
          key: authorID,
          type: 'author',
          imageURL: story.author.picture
        }
        nodes.push(authorNode);
        nodeAuthorMap[authorNode.key] = authorNode;
      }

      // create the story as a node
      var storyID = getHostNameFromURL(story.link);
      var storyNode = nodeStoryMap[storyID];
      if (!storyNode) {
        storyNode = {
          key: storyID,
          type: 'story'
        }
        nodes.push(storyNode);
        nodeStoryMap[storyNode.key] = storyNode;
      }

      // create an edge between author and story.  If we already have an edge, increment the weight
      var linkID = authorNode.key + '-' + storyNode.key;
      var link = linkMap[linkID];
      if (!link) {
        link = {
          key: linkID,
          source: authorNode,
          target: storyNode,
          weight: 1
        }
      }
      else {
        link.weight++;
      }
      links.push(link);
      linkMap[link.key] = link;
    });

    return {
      nodes: nodes,
      links: links
    };
  }

  var getHostNameFromURL = function(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname.replace(/^www\./, '');
  }

  var render = function() {
    var nodes = data.nodes;
    var links = data.links;

    force.nodes(nodes)
      .links(links)
      .start();

    var linkLines = g.selectAll("line.link")
      .data(links, function(d) { return d.key; });
    linkLines.enter()
      .append("line")
      .attr("class", "link")
      .style("stroke", "black")
      .style("opacity", 0.5);
    linkLines
      .attr("stroke-width", function(d) { return 2 * d.weight; });
    linkLines.exit()
      .transition()
      .duration(3000)
      .style("opacity", 0)
      .remove();

    var nodeGroups = g.selectAll("g.node")
      .data(nodes, function(d) { return d.key; });
    nodeGroups.enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag())
      .on("mouseover", nodeMouseOver)
      .on("mouseout", nodeMouseOut);
    nodeGroups.exit()
      .transition()
      .duration(3000)
      .style("opacity", 0)
      .remove();

    var nodeCircles = nodeGroups.selectAll("circle").data(function(d) { return [d]; });
    nodeCircles.enter()
      .append("circle");
    nodeCircles
      .attr("r", function(d) { return getNodeRadius(d); })
      .attr("fill", function(d) { return d.type === 'author' ? 'green' : 'blue'; })
      .attr("stroke", "black")
      .attr("stroke-width", 2);
    nodeCircles.exit().remove();

    var authorNodeImages = nodeGroups.filter(function(d) { return d.type === 'author'; })
      .selectAll("image.node-image").data(function(d) { return [d]; });
    authorNodeImages.enter()
      .append("image")
      .attr("class", "node-image");
    authorNodeImages
      .attr("xlink:href", function(d) { return d.imageURL; })
      .attr("clip-path", "url(#circleClip)");
    authorNodeImages.exit().remove();
  }

  var getNodeRadius = function(node) {
    return minNodeRadius + baseNodeRadius * (node.weight - 1);
  }

  var forceTick = function() {
    d3.selectAll("line.link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
    d3.selectAll("g.node")
      .attr("transform", function(d) { return "translate("+ d.x +"," + d.y + ")"; });
  }

  var nodeMouseOver = function(node) {
    var toolTip = d3.select("#tooltip");
    var html = "<h4>" + node.key + " (" + node.weight + ")</h4>";

    toolTip.html(html)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) + "px")
      .style("opacity", 0.9);
  }

  var nodeMouseOut = function() {
    d3.select("#tooltip").style("opacity", 0);
  }

  return {
    init: init,
    start: start,
    stop: stop
  };
} ();

$(document).ready(function() {
  var dataPath = "http://www.freecodecamp.com/news/hot";
  forcemap.init(dataPath, 900, 900);
  forcemap.start();
});
