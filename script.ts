const onDataLoaded = function (error: any, graph: any[]) {
  if (error) {
    throw error;
  }

  interface InputData {
    level: string | undefined;
    icon: string | undefined;
    id: string;
    action: string | undefined;
    category_name: string | undefined;
    parent: string | undefined;
  }
  interface DataNode {
    id: string;
    name: string;
    color: string;
    level: number;
    visibleZoomMin: number;
    visibleZoomMax: number;
    icon: string;
    action: string;
    parentId: string;
    radius: number;
  }
  interface DataLink {
    id: string;
    excluded: boolean;
    source: string;
    target: string;
    value: number;
    level: number;
    visibleZoomMin: number;
    visibleZoomMax: number;
  }

  const dataNodes: DataNode[] = graph.map((e: InputData) => {
    let level = 0;
    let radius = 10;
    let visibleZoomMin = 0;
    let visibleZoomMax = 2;
    if (e.level === "1 - Pierwszy") {
      level = 1;
      visibleZoomMin = 0;
      visibleZoomMax = 2;
    } else if (e.level === "2 - Drugi") {
      level = 2;
      visibleZoomMin = 2;
      visibleZoomMax = 3;
    } else if (e.level === "3 - trzeci") {
      level = 3;
      visibleZoomMin = 4;
      visibleZoomMax = 10;
    }
    radius = (5 - level) * 10;

    let icon = "";
    if (e.icon !== undefined && e.icon.length > 0) {
      icon = "./" + e.icon;
    }

    let action = "";
    if (e.action !== undefined && e.action.length > 0) {
      action = e.action;
    }

    let name = "";
    if (e.category_name !== undefined && e.category_name.length > 0) {
      name = e.category_name;
    }

    let parentId = "0";
    if (e.parent !== undefined && e.parent.length > 0) {
      parentId = e.parent;
    }

    return {
      id: e.id,
      name: name,
      color: "#a4cddf",
      level: level,
      visibleZoomMin: visibleZoomMin,
      visibleZoomMax: visibleZoomMax,
      icon: icon,
      action: action,
      parentId: parentId,
      radius: radius,
    };
  });

  console.log("input data: ", dataNodes);

  const dataLinks: DataLink[] = dataNodes
    // .filter((e) => e.level === 1)
    .map((e) => {
      return {
        id: e.id,
        source: e.id,
        target: e.parentId,
        level: e.level,
        visibleZoomMin: e.visibleZoomMin,
        visibleZoomMax: e.visibleZoomMax,
        value: 1,
        excluded: false,
      };
    });

  function startGraph() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    var zoom_value_k = 0;
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
            ticked(link, node);
            console.log("zoom level: ", zoom_value_k);

            svg
              .selectAll(".node-item")
              .transition()
              .duration(350)
              .style("opacity", function (d: any) {
                if (zoom_value_k === 1) {
                  return 1;
                }
                if (
                  zoom_value_k >= d.visibleZoomMin &&
                  zoom_value_k <= d.visibleZoomMax
                ) {
                  return 1;
                }
                return 0;
              } as any);

            // if (d3.event.transform.k > 2) {
            //   svg
            //     .selectAll(".label-zoom2")
            //     .transition()
            //     .delay(function (d, i) {
            //       return i * 10;
            //     })
            //     .duration(350)
            //     .style("opacity", 1);
            // } else {
            //   svg
            //     .selectAll(".label-zoom2")
            //     .transition()
            //     .delay(function (d, i) {
            //       return i * 10;
            //     })
            //     .duration(350)
            //     .style("opacity", 0);
            // }

            svg
              .selectAll(".node-link")
              .transition()
              .duration(350)
              .style("opacity", function (d: any) {
                if (zoom_value_k === 1) {
                  return 1;
                }
                if (!d || !d.visibleZoomMin) {
                  return 0;
                }
                if (
                  zoom_value_k >= d.visibleZoomMin &&
                  zoom_value_k <= d.visibleZoomMax
                ) {
                  return 1;
                }
                return 0;
              } as any);
            // .style("opacity", interpolate(zoom_value_k, 0.9, 3, 0, 1, 0.5));
          }) as any
      )
      .append("g")
      .attr("class", "canvas");

    var simulation = d3
      .forceSimulation(dataNodes.filter((e) => e.level === 1) as any)
      .force(
        "link",
        d3.forceLink().id(function (d: any) {
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
      .style("opacity", 1)
      .selectAll("line")
      .data(
        dataLinks.filter(function (e) {
          return !(e.excluded !== undefined && e.excluded === true);
        })
      )
      .enter()
      .append("line")
      .attr("class", function (d) {
        return `node-link node-link-level-${d.level} node-link-zoom-min-${d.visibleZoomMin} node-link-zoom-max-${d.visibleZoomMax} `;
      });

    var node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(dataNodes)
      .enter()
      .append("g")
      .attr("class", function (d) {
        return `node-item node-item-level-${d.level} node-item-zoom-min-${d.visibleZoomMin} node-item-zoom-max-${d.visibleZoomMax} `;
      });

    node
      .append("circle")
      .attr("class", "node-circle")
      .attr("r", function (d) {
        return d.radius;
      })
      .style("fill", function (d) {
        return d.color;
      })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any
      );
    node
      .append("svg:image")
      .attr("href", function (d) {
        return d.icon !== undefined ? d.icon : "";
      })
      .attr("class", function (d) {
        return `node-image`;
      })
      .attr("transform", function (d) {
        return `translate(${-1 * d.radius},${-1 * d.radius})`;
      })
      .attr("width", function (d) {
        return d.radius * 2;
      })
      .on("error", function (d) {
        (this as any).setAttribute("style", "display:none;");
      })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any
      );

    node
      .append("text")
      .attr("class", function (d) {
        return `node-label node-level-${d.level} node-zoom-min-${d.visibleZoomMin} node-zoom-max-${d.visibleZoomMax} `;
      })
      .text(function (d) {
        return d.name;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
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

    if (simulation) {
      simulation.nodes(dataNodes as any).on("tick", () => ticked(link, node));

      (simulation.force("link") as any).links(dataLinks as any);
    }

    function dragstarted(d: any) {
      if (!d3.event.active) simulation.alphaTarget(0.1).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d: any) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d: any) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
      if (!d3.event.active) simulation.alphaTarget(0);
    }
  }

  startGraph();
};

var ticked = function (link: any, node: any) {
  link
    .attr("x1", function (d: any) {
      return d.source.x;
    })
    .attr("y1", function (d: any) {
      return d.source.y;
    })
    .attr("x2", function (d: any) {
      return d.target.x;
    })
    .attr("y2", function (d: any) {
      return d.target.y;
    })
    .style("stroke", function (d: any) {
      return "#a4a4a4";
    });

  node.attr("transform", function (d: any) {
    return "translate(" + d.x + " " + d.y + ")";
  });
  // .style("fill", function (d: any) {
  //   return d.color;
  // });

  // node
  // .select("text")
  // .attr("opacity", function (d: any) {
  //   if (d.zoom === 1) {
  //     return 1;
  //   }
  //   if (d.zoom === 2) {
  //     return 0;
  //   }
  //   return 0;
  // })
  // .attr("font-size", function (d: any) {
  //   if (d.zoom === 1) {
  //     return "9px";
  //   }
  //   if (d.zoom === 2) {
  //     return "7px";
  //   }
  //   return "7px";
  // })
  // .style("fill", function (d: any) {
  //   if (d.zoom === 1) {
  //     return "#333";
  //   }
  //   if (d.zoom === 2) {
  //     return "#aaa";
  //   }
  //   return "#aaa";
  // });
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
};

/**
 * Returns a bezier interpolated value, using the given ranges
 * @param {number} value  Value to be interpolated
 * @param {number} s1 Source range start
 * @param {number} s2  Source range end
 * @param {number} t1  Target range start
 * @param {number} t2  Target range end
 * @param {number} [slope]  Weight of the curve (0.5 = linear, 0.1 = weighted near target start, 0.9 = weighted near target end)
 * @returns {number} Interpolated value
 */
var interpolate = function (
  value: number,
  s1: number,
  s2: number,
  t1: number,
  t2: number,
  slope: number
) {
  //Default to linear interpolation
  slope = slope || 0.5;

  //If the value is out of the source range, floor to min/max target values
  if (value < Math.min(s1, s2)) {
    return Math.min(s1, s2) === s1 ? t1 : t2;
  }

  if (value > Math.max(s1, s2)) {
    return Math.max(s1, s2) === s1 ? t1 : t2;
  }

  //Reverse the value, to make it correspond to the target range (this is a side-effect of the bezier calculation)
  value = s2 - value;

  var C1 = { x: s1, y: t1 }; //Start of bezier curve
  var C3 = { x: s2, y: t2 }; //End of bezier curve
  var C2 = {
    //Control point
    x: C3.x,
    y: C1.y + Math.abs(slope) * (C3.y - C1.y),
  };

  //Find out how far the value is on the curve
  var percent = value / (C3.x - C1.x);

  return C1.y * b1(percent) + C2.y * b2(percent) + C3.y * b3(percent);

  function b1(t: number) {
    return t * t;
  }
  function b2(t: number) {
    return 2 * t * (1 - t);
  }
  function b3(t: number) {
    return (1 - t) * (1 - t);
  }
};

function checkImage(imageSrc: string, good: any, bad: any) {
  var img = new Image();
  img.onload = good;
  img.onerror = bad;
  img.src = imageSrc;
}

var json_data_file_name = "./data/output.json";

d3.json(json_data_file_name, onDataLoaded as any);
