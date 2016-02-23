function renderForceMap(dataPath) {
  var outerWidth = 800;
  var outerHeight = 800;
  var margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  var innerWidth = outerWidth - margin.left - margin.right;
  var innerHeight = outerHeight - margin.top - margin.bottom;

  var svg = d3.select("#forcemap").append("svg")
    .attr("width", outerWidth)
    .attr("height", outerHeight);
  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  function render(data, transform, mouseOver, mouseOut) {
    var transformedData = transform(data);
    var nodes = transformedData.nodes;
    var links = transformedData.links;

    var force = d3.layout.force().charge(-1000)
      .size([innerWidth, innerHeight])
      .nodes(nodes)
      .links(links)
      .on("tick", forceTick);

    var linkLines = g.selectAll("line.link")
      .data(links, function(d) { return d.key; });
    linkLines.enter()
      .append("line")
      .attr("class", "link")
      .style("stoke", "black")
      .style("opacity", 0.5)
    linkLines
      .style("stroke-width", function(d) { return d.weight; });
    linkLines.exit().remove();

    var nodeGroups = g.selectAll("g.node")
      .data(nodes, function(d) { return d.key; });
    nodeGroups.enter()
      .append("g")
      .attr("class", "node");
    nodeGroups.exit().remove();

    var nodeCircles = nodeGroups.selectAll("circle").data(function(d) { return [d]; });
    nodeCircles.enter()
      .append("circle");
    nodeCircles
      .attr("r", 5)
      .attr("fill", "lightgray");
    nodeCircles.exit().remove();

    force.start();

    d3.select("body").append("pre")
  .text(JSON.stringify(nodes, null, 2));
  d3.select("body").append("pre")
.text(JSON.stringify(links, null, 2));
  }

  function forceTick() {
    d3.selectAll("line.link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
    d3.selectAll("g.node")
      .attr("transform", function(d) { return "translate("+ d.x +"," + d.y + ")"; });
  }

  function transformToNodesAndLinks(data) {
    var nodes = [];
    var nodeAuthorMap = {};
    var nodeStoryMap = {};
    var links = [];
    var linkMap = {};

    data.forEach(function(story) {
      // create the author as a node
      var authorID = story.author.username;
      var authorNode = nodeAuthorMap[authorID];
      // push the node if we haven't seen it already
      if (!authorNode) {
        authorNode = {
          key: authorID,
          type: 'author',
          picture: story.author.picture,
          storyCount: 1
        }
        nodes.push(authorNode);
        nodeAuthorMap[authorNode.key] = authorNode;
      }
      else {
        // increment the storycount if we've seen this author before
        authorNode.storyCount++;
      }

      // create the story as a node
      var storyID = getHostNameFromURL(story.link);
      var storyNode = nodeStoryMap[storyID];
      if (!storyNode) {
        storyNode = {
          key: storyID,
          type: 'story',
          storyCount: 1
        }
        nodes.push(storyNode);
        nodeStoryMap[storyNode.key] = storyNode;
      }
      else {
        storyNode.storyCount++;
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
        links.push(link);
        linkMap[link.key] = link;
      }
      else {
        link.weight++;
      }
    });

    return {
      nodes: nodes,
      links: links
    };
  }

  function getHostNameFromURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.hostname.replace(/^www\./, '');
  }

  function nodeMouseOver(node) {
    /*
    var toolTip = d3.select("#tooltip");
    var html = "<h4>" + month.year + " - " + month.monthName + "</h4>";
    html += "<h5>Temperature: " + month.temperature.toFixed(2) + "&deg C<br>";
    html += "(" + month.variance.toFixed(2) + "&deg C)</h5>";

    toolTip.html(html)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) + "px")
      .style("opacity", 0.9);*/
  }

  function nodeMouseOut() {
    d3.select("#tooltip").style("opacity", 0);
  }

  d3.json(dataPath, function(error, data) {
    if (error) throw error;

    render(data, transformToNodesAndLinks, nodeMouseOver, nodeMouseOut);
  });
}

$(document).ready(function() {
  var dataPath = "http://www.freecodecamp.com/news/hot";
  renderForceMap(dataPath);
});
