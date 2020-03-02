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

    graph.links.forEach(function(link) {
      if (link.excluded !== undefined && link.excluded === true) {
        return;
      }
      graph.links.forEach(function(l, index) {
        if (link.source === l.target && link.target === l.source) {
          console.log("link excuded", graph.links[index]);
          graph.links[index].excluded = true;
        }
      });
    });

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
      );

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
      });

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
        .attr("dx", -30)
        .attr("dy", 22)
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
    //   simulation.fix(d);
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    //   simulation.fix(d, d3.event.x, d3.event.y);
  }

  function dragended(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
    if (!d3.event.active) simulation.alphaTarget(0);
    //   simulation.unfix(d);
  }
}

(function() {
  run();
})();

// var canvas = document.querySelector("#canvas"),
//   context = canvas.getContext("2d"),
//   width = canvas.width,
//   height = canvas.height;

// // set the dimensions and margins of the graph
// var margin = { top: 10, right: 30, bottom: 30, left: 40 },
//   width = 400 - margin.left - margin.right,
//   height = 400 - margin.top - margin.bottom;

//   var svg = d3.select("body").append("svg")
//     .attr("width", width)
//     .attr("height", height);

// // append the svg object to the body of the page
// var svg = d3
//   .select("#canvas")
//   .append("svg")
//   .attr("width", width + margin.left + margin.right)
//   .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// d3.json("nodes-and-links.json", function(error, graph) {
//   if (error) throw error;

//   // Initialize the links
//   var link = svg
//     .selectAll("line")
//     .data(graph.links)
//     .enter()
//     .append("line")
//     .style("stroke", "#aaa");

//   // Initialize the nodes
//   var node = svg
//     .selectAll("circle")
//     .data(graph.nodes)
//     .enter()
//     .append("circle")
//     .attr("r", 20)
//     .style("fill", "#69b3a2");

//   // Let's list the force we wanna apply on the network
//   var simulation = d3
//     .forceSimulation(graph.nodes) // Force algorithm is applied to data.nodes
//     .force(
//       "link",
//       d3
//         .forceLink() // This force provides links between nodes
//         .id(function(d) {
//           return d.id;
//         }) // This provide  the id of a node
//         .links(graph.links) // and this the list of links
//     )
//     .force("charge", d3.forceManyBody().strength(-400)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
//     .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
//     .on("end", ticked);

//   // This function is run at each iteration of the force algorithm, updating the nodes position.
//   function ticked() {
//     link
//       .attr("x1", function(d) {
//         return d.source.x;
//       })
//       .attr("y1", function(d) {
//         return d.source.y;
//       })
//       .attr("x2", function(d) {
//         return d.target.x;
//       })
//       .attr("y2", function(d) {
//         return d.target.y;
//       });

//     node
//       .attr("cx", function(d) {
//         return d.x + 6;
//       })
//       .attr("cy", function(d) {
//         return d.y - 6;
//       });
//   }
// });
