function createBarGraph(dataPath) {
  var outerWidth = 960;
  var outerHeight = 500;
  var margin = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 75
  };

  var innerWidth = outerWidth - margin.left - margin.right;
  var innerHeight = outerHeight - margin.top - margin.bottom;

  var xColumn = "date";
  var yColumn = "gdp";

  var svg = d3.select("#graphBox").append("svg")
    .attr("width", outerWidth)
    .attr("height", outerHeight);
  var g = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  var xAxisG = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + innerHeight + ")");
  var yAxisG = g.append("g")
    .attr("class", "y axis");
  var yAxisLabel = yAxisG.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Gross Domestic Product (Billion $)");

  var xScale = d3.time.scale().range([0, innerWidth]);
  var yScale = d3.scale.linear().range([innerHeight, 0]);

  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .tickFormat(d3.time.format("%Y"))
    .ticks(d3.time.years, 10);

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(10);

  function render(data, mouseOver, mouseOut) {
    xScale.domain(d3.extent(data, function(d) {
      return d[xColumn];
    }));
    yScale.domain([0, d3.max(data, function(d) {
      return d[yColumn];
    })]);

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    var bars = g.selectAll("rect").data(data);
    bars.enter().append("rect")
      .attr("class", "bar");
    bars
      .attr("x", function(d) {
        return xScale(d[xColumn]);
      })
      .attr("width", innerWidth / data.length)
      .attr("y", function(d) {
        return yScale(d[yColumn]);
      })
      .attr("height", function(d) {
        return innerHeight - yScale(d[yColumn]);
      })
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut);
    bars.exit().remove();
  }

  function gdpMouseOver(data) {
    var toolTip = d3.select("#tooltip");
    var currencyFormat = d3.format("$,.2f");

    var ttHTML = "<h4>GDP: " + currencyFormat(data.gdp) + " billion</h4><p>" + data.quarter + "</p>";

    toolTip
      .html(ttHTML)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) + "px")
      .style("opacity", 0.9);
  }

  function gdpMouseOut() {
    d3.select("#tooltip").style("opacity", 0);
  }

  d3.json(dataPath, function(error, json) {
    if (error) return console.warn(error);

    var parseDate = d3.time.format("%Y-%m-%d").parse;

    var gdpArray = json.data;
    var gdp = gdpArray.map(function(i) {
      var date = parseDate(i[0]);
      var month = date.getMonth();
      var quarter = "QX";
      if (month == 0) quarter = "Q1";
      else if (month == 3) quarter = "Q2";
      else if (month == 6) quarter = "Q3";
      else if (month == 9) quarter = "Q4";

      quarter += " " + date.getFullYear();
      return {
        date: date,
        gdp: i[1],
        quarter: quarter
      }
    });

    render(gdp, gdpMouseOver, gdpMouseOut);
  });
}

$(document).ready(function() {
  var dataPath = 'https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/GDP-data.json';
  createBarGraph(dataPath);
});
