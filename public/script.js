d3.json("nodes-and-links.json", function (error, graph) {
  if (error) throw error;
  function checkImage(imageSrc, good, bad) {
    var img = new Image();
    img.onload = good;
    img.onerror = bad;
    img.src = imageSrc;
  }
  function run() {
    var width = window.innerWidth,
      height = window.innerHeight;

    var zoom_value_k = 0;
    // var zoom = d3
    //   .zoom()
    //   .scaleExtent([1, 40])
    //   .translateExtent([
    //     [-100, -100],
    //     [width + 90, height + 100]
    //   ])
    //   .on("zoom", zoomed);

    var svg = d3
      .select("#canvas")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(
        d3
          .zoom()
          .scaleExtent([0.2, 40])
          .on("zoom", function () {
            svg.attr("transform", d3.event.transform);
            zoom_value_k = d3.event.transform.k;
            ticked();
            if (d3.event.transform.k > 2) {
              svg
                .selectAll(".label-zoom2")
                .transition()
                .delay(function (d, i) {
                  return i * 10;
                })
                .duration(350)
                .style("opacity", 1);
            } else {
              svg
                .selectAll(".label-zoom2")
                .transition()
                .delay(function (d, i) {
                  return i * 10;
                })
                .duration(350)
                .style("opacity", 0);
            }
          })
      )
      .append("g")
      .attr("class", "canvas");

    var simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3.forceLink().id(function (d) {
          return d.id;
        })
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force(
        "charge",
        d3.forceManyBody().strength(-200).theta(0.8).distanceMax(150)
      )
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d) => 40)
          .iterations(2)
      )
      .force("center", d3.forceCenter(width / 2, height / 2));

    var link = svg
      .append("g")
      .attr("class", "links")
      .style("stroke", "#aaa")
      .selectAll("line")
      .data(
        graph.links.filter(function (e) {
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
      .append("g")
      .attr("class", "node-item");

    node
      .append("circle")
      .attr("class", "node-circle")
      .attr("r", function (d) {
        if (d.zoom === 1) {
          return 16;
        }
        if (d.zoom === 2) {
          return 0;
        }
      })
      .style("fill", function (d) {
        return d.color ? d.color : "#efefef";
      })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );
    node
      .append("svg:image")
      .attr("href", function (d) {
        return "./img/icon-" + d.id + ".png";
      })
      .attr("transform", "translate(-16,-16)")
      .attr("width", 32)
      .on("error", function (d) {
        this.setAttribute("style", "display:none;");
      })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    node
      .append("text")
      .attr("class", function (d) {
        if (d.zoom === 1) {
          return "node-label label";
        }
        if (d.zoom === 2) {
          return "node-label label-zoom2";
        }
      })
      .text(function (d) {
        return d.name;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("transform", "translate(0,25)")
      .attr("alignment-baseline", "central");

    // var label = svg
    //   .append("g")
    //   .attr("class", "labels")

    //   .selectAll("text")
    //   .data(graph.nodes)
    //   .enter()
    //   .append("text")
    //   .attr("class", function(d) {
    //     if (d.zoom === 1) {
    //       return "label";
    //     }
    //     if (d.zoom === 2) {
    //       return "label-zoom2";
    //     }
    //   })
    //   .text(function(d) {
    //     return d.name;
    //   })
    //   .attr("text-anchor", "middle")
    //   .attr("fill", "#fff")
    //   .attr("alignment-baseline", "central");

    simulation.nodes(graph.nodes).on("tick", ticked);

    simulation.force("link").links(graph.links);

    function ticked() {
      link
        .attr("x1", function (d) {
          return d.source.x;
        })
        .attr("y1", function (d) {
          return d.source.y;
        })
        .attr("x2", function (d) {
          return d.target.x;
        })
        .attr("y2", function (d) {
          return d.target.y;
        })
        .style("stroke", function (d) {
          if (d.zoom === undefined) {
            return "#a4a4a4";
          } else {
            return "transparent";
          }
        });

      node
        .attr("transform", function (d) {
          return "translate(" + d.x + " " + d.y + ")";
        })
        .style("fill", function (d) {
          return d.color ? d.color : "#efefef";
        });

      node
        .select("text")
        .attr("opacity", function (d) {
          if (d.zoom === 1) {
            return 1;
          }
          if (d.zoom === 2) {
            return 0;
          }
        })
        .attr("font-size", function (d) {
          if (d.zoom === 1) {
            return "9px";
          }
          if (d.zoom === 2) {
            return "7px";
          }
        })
        .style("fill", function (d) {
          if (d.zoom === 1) {
            return "#333";
          }
          if (d.zoom === 2) {
            return "#aaa";
          }
        });
      // .attr("cx", function(d) {
      //   return d.x + 5;
      // })
      // .attr("cy", function(d) {
      //   return d.y - 3;
      // });
      // node
      //   .attr("r", function(d) {
      //     if (d.zoom === 1) {
      //       return 16;
      //     }
      //     if (d.zoom === 2) {
      //       return 0;
      //     }
      //   })
      //   .style("fill", function(d) {
      //     return d.color ? d.color : "#efefef";
      //   })
      //   .attr("cx", function(d) {
      //     return d.x + 5;
      //   })
      //   .attr("cy", function(d) {
      //     return d.y - 3;
      //   });

      // label
      //   .attr("dx", 0)
      //   .attr("dy", 19)
      //   .attr("x", function(d) {
      //     return d.x;
      //   })
      //   .attr("y", function(d) {
      //     return d.y;
      //   })
      //   .attr("opacity", function(d) {
      //     if (d.zoom === 1) {
      //       return 1;
      //     }
      //     if (d.zoom === 2) {
      //       return 0;
      //     }
      //   })
      //   .attr("font-size", function(d) {
      //     if (d.zoom === 1) {
      //       return "10px";
      //     }
      //     if (d.zoom === 2) {
      //       return "8px";
      //     }
      //   })
      //   .style("fill", function(d) {
      //     if (d.zoom === 1) {
      //       return "#333";
      //     }
      //     if (d.zoom === 2) {
      //       return "#aaa";
      //     }
      //   });
    }

    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.1).restart();
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

  run();
});
// add for later
// ------
// Grouping nodes in a Force-Directed Graph
// - https://bl.ocks.org/bumbeishvili/f027f1b6664d048e894d19e54feeed42

// Collapsible Force Layout
// - https://bl.ocks.org/mbostock/1093130

//d3js forced network group hull collapse and expand
// https://codepen.io/hadis-kia/pen/RwNWXje

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
