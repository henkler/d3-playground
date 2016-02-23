function renderHeatMap(dataPath) {
  var baseTemperature = 0;

  var outerWidth = 1200;
  var outerHeight = 700;
  var margin = {
    top: 80,
    right: 50,
    bottom: 50,
    left: 90
  };

  var innerWidth = outerWidth - margin.left - margin.right;
  var innerHeight = outerHeight - margin.top - margin.bottom;

  var xColumn = "dateYear";
  var columnNest = "year";
  var yColumn = "monthName";
  var colorColumn = "variance";

  var xAxisLabelText = "Year";
  var xAxisLabelOffset = 40;
  var yAxisLabelText = "Month";
  var yAxisLabelOffset = 50;

  var svg = d3.select("#heatmap").append("svg")
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

  var xScale = d3.time.scale().range([0, innerWidth], 0);
  var yScale = d3.scale.ordinal().rangeRoundBands([innerHeight, 0], 0);
  var colorScale = d3.scale.linear().range(['blue', 'white', 'red']);

  var xAxis = d3.svg.axis().scale(xScale).orient("bottom")
    .ticks(d3.time.years, 10);
  var yAxis = d3.svg.axis().scale(yScale).orient("left")
    .ticks(5);

  function render(data, transform, mouseOver, mouseOut) {
    var nested = d3.nest()
      .key(function(d) { return d[columnNest]; })
      .sortKeys(d3.ascending)
      .entries(data);

    xScale.domain(d3.extent(data, function(d) { return d[xColumn]}));
    yScale.domain(data.map(function(d) { return d[yColumn]; }));

    var barWidth = innerWidth / nested.length;

    // 3 colors in the color range. [min, 0 max] in the domain
    colorScale.domain([
      d3.min(data, function(d) {return d[colorColumn]; }),
      0,
      d3.max(data, function(d) {return d[colorColumn]; })
    ]);

    nested = transform(nested);

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(200,20)");

    var colorLegend = d3.legend.color()
      .cells([
        d3.min(data, function(d) {return d[colorColumn]; }),
        0,
        d3.max(data, function(d) {return d[colorColumn]; })
      ])
      .shapeWidth(30)
      .orient('horizontal')
      .scale(colorScale);

    svg.select(".legend").call(colorLegend);

    var nestedGroups = g.selectAll(".data-bar").data(nested);

    nestedGroups.enter().append("g")
        .attr("class", "data-bar");
    nestedGroups.exit().remove();

    var bars = nestedGroups.selectAll("rect").data(function(d) { return d.values; });
    bars.enter().append("rect")
      .on("mouseover", mouseOver)
      .on("mouseout", mouseOut);
    bars
      .attr("x", function(d) { return xScale(d[xColumn]); })
      .attr("y", function(d) { return yScale(d[yColumn]); })
      .attr("width", barWidth)
      .attr("height", function(d) { return yScale.rangeBand(); })
      .attr("fill", function(d) { return colorScale(d[colorColumn]); });
    bars.exit().remove();
  }

  // cleans up the data.  Makes sure each year has all 12 months filled in, and sorted ascending
  function dataTransform(nestedData) {
    function fillMonths(values, key) {
      var result = [];
      for (var i = 1; i <= 12; i++) {
        var month = values.find(function(d) { return d.month === i; });
        if (!month) {
          month = {
            "year": parseInt(key),
            "month": i,
            "variance": 0,
            "dateYear": new Date(key, 0),
            "monthName": getMonthName(i)
          };
        }
        month.temperature = baseTemperature + month.variance;
        result.push(month);
      }
      return result.sort(function(a, b) { return a.month - b.month });
    }

    return nestedData.map(function(data) {
      return {
        "key": data.key,
        "values": fillMonths(data.values, data.key)
      };
    });
  }


  function monthMouseOver(month) {
    var toolTip = d3.select("#tooltip");
    var html = "<h4>" + month.year + " - " + month.monthName + "</h4>";
    html += "<h5>Temperature: " + month.temperature.toFixed(2) + "&deg C<br>";
    html += "(" + month.variance.toFixed(2) + "&deg C)</h5>";

    toolTip.html(html)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) + "px")
      .style("opacity", 0.9);
  }

  function monthMouseOut() {
    d3.select("#tooltip").style("opacity", 0);
  }

  function getMonthName(monthNum) {
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[monthNum - 1];
  }

  d3.json(dataPath, function(error, data) {
    if (error) throw error;

    baseTemperature = +data.baseTemperature;
    var varianceData = data.monthlyVariance;

    varianceData.forEach(function(d) {
      d.dateYear = new Date(d.year, 0);
      d.monthName = getMonthName(d.month);
    });

    render(varianceData, dataTransform, monthMouseOver, monthMouseOut);
  });
}

$(document).ready(function() {
  var dataPath = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json";
  renderHeatMap(dataPath);
});
