function renderScatterPlot(dataPath) {
  var outerWidth = 960;
  var outerHeight = 500;
  var margin = {
    top: 20,
    right: 50,
    bottom: 50,
    left: 50
  };

  var innerWidth = outerWidth - margin.left - margin.right;
  var innerHeight = outerHeight - margin.top - margin.bottom;

  var xColumn = "Minutes";
  var yColumn = "Place";
  var colorColumn = "dopingStatus";
  var labelColumn = "Name";

  var xAxisLabelText = "Time (min) - Lower is Better";
  var xAxisLabelOffset = 40;
  var yAxisLabelText = "Biker Ranking";
  var yAxisLabelOffset = 30;

  var svg = d3.select("#scatterplot").append("svg")
    .attr("width", outerWidth)
    .attr("height", outerHeight);
  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xAxisG = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + innerHeight + ")");
  var xAxisLabel = xAxisG.append("text")
    .attr("class", "label")
    .attr("x", innerWidth / 2)
    .attr("y", xAxisLabelOffset)
    .style("text-anchor", "middle")
    .text(xAxisLabelText);

  var yAxisG = g.append("g")
    .attr("class", "y axis");
  var yAxisLabel = yAxisG.append("text")
    .attr("class", "label")
    .attr("transform", "translate(-" + yAxisLabelOffset + "," + (innerHeight / 2) + ") rotate(-90)")
    .style("text-anchor", "middle")
    .text(yAxisLabelText);

  var xScale = d3.scale.linear().range([0, innerWidth]);
  var yScale = d3.scale.linear().range([0, innerHeight]);
  var colorScale = d3.scale.category10();

  var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
  var yAxis = d3.svg.axis().scale(yScale).orient("left");

  function render(data, mouseOver, mouseOut) {
    xScale.domain(d3.extent(data, function(d) {
      return d[xColumn];
    })).nice();
    yScale.domain([1, d3.max(data, function(d) {
      return d[yColumn];
    }) + 1]);

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    var points = g.selectAll(".data-point").data(data);

    points.enter().append("g")
      .attr("class", "data-point");

    points.attr("transform", function(d) {
        return "translate(" + xScale(d[xColumn]) + "," + yScale(d[yColumn]) + ")";
      })
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut);
    points.append("circle")
      .style("fill", function(d) {
        return colorScale(d[colorColumn]);
      });
    points.append("text")
      .style("text-anchor", "beginning")
      .attr("dy", 3)
      .attr("dx", 7)
      .text(function(d) {
        return d[labelColumn];
      });

    points.exit().remove();

    var legend = svg.selectAll(".legend").data(colorScale.domain());

    legend.enter().append("g")
      .attr("class", "legend");

    legend.attr("transform", function(d, i) {
      return "translate(0," + i * 20 + ")";
    });
    legend.append("rect")
      .attr("x", innerWidth - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", colorScale);
    legend.append("text")
      .attr("x", innerWidth - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) {
        return d;
      });

    legend.exit().remove();
  }

  function cyclistMouseOver(cyclist) {
    var toolTip = d3.select("#tooltip");
    var html = "<h4>" + cyclist.Name + " (" + cyclist.Nationality + ")</h4>";
    html += "<h5>Time: " + cyclist.Time + ", Year: " + cyclist.Year + "</h5>";
    html += "<p>" + cyclist.Doping + "</p>";

    toolTip.html(html)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) + "px")
      .style("opacity", 0.9);
  }

  function cyclistMouseOut() {
    d3.select("#tooltip").style("opacity", 0);
  }

  d3.json(dataPath, function(error, data) {
    if (error) throw error;

    data.forEach(function(d) {
      d.dopingStatus = (d.Doping !== "" ? "Cyclist Caught Doping" : "Cyclist Clean");
      d.Minutes = d.Seconds / 60;
    });

    render(data, cyclistMouseOver, cyclistMouseOut);
  });
}

$(document).ready(function() {
  var dataPath = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/cyclist-data.json";
  renderScatterPlot(dataPath);
});
