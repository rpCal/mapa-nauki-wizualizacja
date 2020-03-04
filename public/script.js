function run() {
  var width = window.innerWidth,
    height = window.innerHeight;

  var svg = d3
    .select("#canvas")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(
      d3.zoom().on("zoom", function() {
        svg.attr("transform", d3.event.transform);
      })
    )
    .append("g");

  var simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3.forceLink().id(function(d) {
        return d.id;
      })
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force(
      "charge",
      d3
        .forceManyBody()
        .strength(-200)
        .theta(0.8)
        .distanceMax(150)
    )
    .force(
      "collide",
      d3
        .forceCollide()
        .radius(d => 40)
        .iterations(2)
    )
    .force("center", d3.forceCenter(width / 2, height / 2));

  d3.json("nodes-and-links.json", function(error, graph) {
    if (error) throw error;

    var link = svg
      .append("g")
      .style("stroke", "#aaa")
      .selectAll("line")
      .data(
        graph.links.filter(function(e) {
          return !(e.excluded !== undefined && e.excluded === true);
        })
      )
      .enter()
      .append("line");

    var node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter()
      .append("circle")
      .attr("r", 2)
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      // .append("svg:image")
      // .attr("xlink:href", function(d) {
      //   return ".img/icon_" + d.id + ".png";
      // });

    var label = svg
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(graph.nodes)
      .enter()
      .append("text")
      .attr("class", "label")
      .text(function(d) {
        return d.name;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("alignment-baseline", "central");

    simulation.nodes(graph.nodes).on("tick", ticked);

    simulation.force("link").links(graph.links);

    function ticked() {
      link
        .attr("x1", function(d) {
          return d.source.x;
        })
        .attr("y1", function(d) {
          return d.source.y;
        })
        .attr("x2", function(d) {
          return d.target.x;
        })
        .attr("y2", function(d) {
          return d.target.y;
        })
        .style("fill", "#a4a4a4");

      node
        .attr("r", 16)
        .style("fill", function(d) {
          return d.color ? d.color : "#efefef";
        })
        .attr("cx", function(d) {
          return d.x + 5;
        })
        .attr("cy", function(d) {
          return d.y - 3;
        });

      label
        .attr("dx", 0)
        .attr("dy", 19)
        .attr("x", function(d) {
          return d.x;
        })
        .attr("y", function(d) {
          return d.y;
        })
        .style("font-size", "10px")
        .style("fill", "#333");
    }
  });

  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    if (!d3.event.active) simulation.alphaTarget(0);
  }
}

(function() {
  run();
})();

// add for later
// ------ 
// Grouping nodes in a Force-Directed Graph
// - https://bl.ocks.org/bumbeishvili/f027f1b6664d048e894d19e54feeed42

// check if two-way connection exists, then remove it
// graph.links.forEach(function(link) {
//   if (link.excluded !== undefined && link.excluded === true) {
//     return;
//   }
//   graph.links.forEach(function(l, index) {
//     if (link.source === l.target && link.target === l.source) {
//       console.log("link excuded", graph.links[index]);
//       graph.links[index].excluded = true;
//     }
//   });
// });
