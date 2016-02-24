function renderGlobe(meteoriteStrikeDataPath) {
  var width = 900;
  var height = 900;

  var WORLD_GEOJSON_PATH = 'https://raw.githubusercontent.com/mbostock/topojson/master/examples/world-110m.json';

  var svg = d3.select("#globe").append("svg")
    .attr("width", width)
    .attr("height", height);

  function renderGlobe(topoWorldData, strikeData) {
    //var colorScale = d3.scale.category10();
    var colorScale = d3.scale.ordinal().range(colorbrewer.Greens[7]);
    var rotateScale = d3.scale.linear()
      .domain([0, width])
      .range([-180, 180]);
    var strikeScale = d3.scale.sqrt()
      .domain(d3.extent(strikeData.features, function(d) { return d.properties.mass; }))
      .range([0, 20]);

    // cap the color at 500000 for mass (ignore outliers)
    var strikeColor = d3.scale.quantile()
      .domain([0, 500000])
      .range(colorbrewer.YlOrRd[9]);

    var projection = d3.geo.orthographic()
      .scale(400)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .center([0,0]);
    var path = d3.geo.path().projection(projection);
    var strikeCircle = d3.geo.circle()
      .origin(function(d) { return d.geometry.coordinates; })
      .precision(30);
    var graticule = d3.geo.graticule();
    var mapZoom = d3.behavior.zoom()
      .translate(projection.translate())
      .scale(projection.scale())
      .on("zoom", globeZoom);

    var countries = topojson.feature(topoWorldData, topoWorldData.objects.countries).features;
    var neighbors = topojson.neighbors(topoWorldData.objects.countries.geometries);

    svg.call(mapZoom);

    svg.on("mousedown", globeRotateBegin)
      .on("mouseup", globeRotateEnd);

    svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

    svg.append("path")
      .datum(graticule.outline)
      .attr("class", "graticule outline")
      .attr("d", path);

    svg.selectAll("country").data(countries)
      .enter()
      .insert("path", ".graticule")
      .attr("class", "country")
      .attr("d", path)
      .style("fill", function(d, i) { return colorScale(d.color = d3.max(neighbors[i], function(n) { return countries[n].color; }) + 1 | 0); });

    svg.selectAll("strike").data(strikeData.features).enter()
      .append("path")
      .attr("class", "strike")
      .attr("d", strikePath)
      .style("fill", function(d) { return strikeColor(d.properties.mass); })
      .style("opacity", 0.5)
      .on("mouseover", strikeMouseOver)
      .on("mouseout", strikeMouseOut);

    function globeZoom() {
      projection.scale(mapZoom.scale());

      svg.selectAll("path.country").attr("d", path);
      svg.selectAll("path.graticule").attr("d", path);
      svg.selectAll("path.strike").attr("d", strikePath);
    }

    function strikePath(feature) {
      return path(strikeCircle.angle(strikeScale(feature.properties.mass))(feature));
    }

    function globeRotateBegin() {
      svg.on("mousemove", function() {
        var mouse = d3.mouse(this);
        projection.rotate([rotateScale(mouse[0]), 0]);
        globeZoom();
      });
    }

    function globeRotateEnd() {
      svg.on("mousemove", null);
    }
  }

  function strikeMouseOver(strike) {
    var toolTip = d3.select("#tooltip");
    var html = "";
    html += "<p>Name: " + strike.properties.name + "</p>";
    html += "<p>Mass: " + strike.properties.mass + "</p>";
    html += "<p>Strike Date: " + dateFormat(new Date(strike.properties.year)) + "</p>";
    html += "<p>Class: " + strike.properties.recclass + "</p>";

    toolTip.html(html)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) + "px")
      .style("opacity", 0.9);
  }

  function dateFormat(date) {
    return date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear();
  }

  function strikeMouseOut() {
    d3.select("#tooltip").style("opacity", 0);
  }

  function getMonthName(monthNum) {
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[monthNum - 1];
  }

  function parseStrikeData(strikeData) {
    strikeData.features = strikeData.features.filter(function(feature) { return feature.geometry !== null; });
    strikeData.features.forEach(function(feature) {
      feature.properties.mass = +feature.properties.mass;
    });
  }

  d3_queue.queue()
    .defer(d3.json, WORLD_GEOJSON_PATH)
    .defer(d3.json, meteoriteStrikeDataPath)
    .await(function(error, topoWorldData, strikeData) {
      parseStrikeData(strikeData);
      renderGlobe(topoWorldData, strikeData);
    });
}

// colorbrew include
var colorbrewer = {
  Greens: {
  3: ["#e5f5e0","#a1d99b","#31a354"],
  4: ["#edf8e9","#bae4b3","#74c476","#238b45"],
  5: ["#edf8e9","#bae4b3","#74c476","#31a354","#006d2c"],
  6: ["#edf8e9","#c7e9c0","#a1d99b","#74c476","#31a354","#006d2c"],
  7: ["#edf8e9","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#005a32"],
  8: ["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#005a32"],
  9: ["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b"]
  },
  Reds: {
  3: ["#fee0d2","#fc9272","#de2d26"],
  4: ["#fee5d9","#fcae91","#fb6a4a","#cb181d"],
  5: ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"],
  6: ["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#de2d26","#a50f15"],
  7: ["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#99000d"],
  8: ["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#99000d"],
  9: ["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#a50f15","#67000d"]
  },
  YlOrRd: {
  3: ["#ffeda0","#feb24c","#f03b20"],
  4: ["#ffffb2","#fecc5c","#fd8d3c","#e31a1c"],
  5: ["#ffffb2","#fecc5c","#fd8d3c","#f03b20","#bd0026"],
  6: ["#ffffb2","#fed976","#feb24c","#fd8d3c","#f03b20","#bd0026"],
  7: ["#ffffb2","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#b10026"],
  8: ["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#b10026"],
  9: ["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a","#e31a1c","#bd0026","#800026"]
}
};

$(document).ready(function() {
  var dataPath = "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/meteorite-strike-data.json";
  renderGlobe(dataPath);
});
