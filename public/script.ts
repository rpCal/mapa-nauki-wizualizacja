interface InputData {
  level: string | undefined;
  icon: string | undefined;
  id: string;
  action: string | undefined;
  category_name: string | undefined;
  parent: string | undefined;
  title: string | undefined;
  innerhtml: string | undefined;
  timestamp_miniaturki: string | undefined;
  link_do_filmu: string | undefined;
  opis_filmu: string | undefined;
}

console.log("Halo!" + new Date());

enum ClickActionType {
  OPEN_LINK = "OPEN_LINK",
  OPEN_MODAL = "OPEN_MODAL",
}
interface DataNode {
  id: string;
  name: string;
  color: string;
  level: number;
  visibleZoomMin: number;
  visibleZoomMax: number;
  icon: string;
  iconRadius: number;
  windowUrl?: string;
  modalTitle?: string;
  modalBody?: string;
  clickActionType?: ClickActionType;
  action: string;
  parentId: string;
  radius: number;
  parentIds: string[];
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

const onDataLoaded = function (error: any, graph: any[]) {
  if (error) {
    throw error;
  }

  const dataNodes: DataNode[] = prepareDataNodes(graph);

  console.log("input data: ", dataNodes);

  const dataLinks: DataLink[] = dataNodes.map((e) => {
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
    var width = window.innerWidth - 50;
    var height = window.innerHeight - 50;
    var zoom_value_k = 0;

    var svg = d3
      .select("#canvas")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(
        d3
          .zoom()
          .scaleExtent([0.8, 9])
          .on("zoom", function () {
            svg.attr("transform", d3.event.transform);
            zoom_value_k = d3.event.transform.k;
            ticked(link, node);

            const labelZoom = document.querySelector(".label-zoom");

            if (labelZoom !== null) {
              labelZoom.innerHTML = `zoom: ${zoom_value_k.toFixed(2)}`;
            }

            svg
              .selectAll(".node-item")
              .transition()
              .duration(50)
              .style("opacity", function (d: any) {
                if (d.id === "0") {
                  return 0;
                }
                if (d.level === 1 && zoom_value_k <= 1.4 && zoom_value_k > 0) {
                  return 1;
                }
                if (zoom_value_k <= d.visibleZoomMax) {
                  const op = interpolate(
                    zoom_value_k,
                    d.visibleZoomMin,
                    d.visibleZoomMax,
                    0.01,
                    0.99,
                    0.7
                  );

                  return op;
                } else {
                  const op = interpolate(
                    zoom_value_k,
                    d.visibleZoomMax,
                    d.visibleZoomMax + d.visibleZoomMax * 1.1,
                    0.99,
                    0.01,
                    0.7
                  );
                  return op;
                }
              } as any);
          }) as any
      )
      .append("g")
      .attr("class", "canvas");

    var simulation = d3
      .forceSimulation(dataNodes as any)
      .force(
        "link",
        d3.forceLink().id(function (d: any) {
          return d.id;
        })
      )
      // .force("charge", function (d) {
      //   console.log("??", (d as any).level);
      //   return d3.forceManyBody().strength(function (d1) {
      //     console.log("??", (d1 as any).level);
      //     return 100;
      //   });
      // })
      // .force(
      //   "charge",
      //   d3.forceManyBody().strength(-500).theta(1.0).distanceMax(100)
      // )
      .force(
        "collide",
        d3
          .forceCollide()
          .radius(function (d) {
            if (d && (d as any).level !== undefined) {
              if ((d as any).level === 1) {
                return 30;
              }
              if ((d as any).level === 2) {
                return 30;
              }
              if ((d as any).level === 3) {
                return 5;
              }
              if ((d as any).level === 4) {
                return 1;
              }
            }
            return 30;
          })
          .iterations(3)
      )
      .force("center", d3.forceCenter(width / 2, height / 2));

    const canvas = document.querySelector("#canvas");
    if (canvas !== null) {
      const labels = document.createElement("div");
      labels.setAttribute("class", "labels");
      const labelZoom = document.createElement("div");
      labelZoom.setAttribute("class", "label-zoom");
      labelZoom.innerHTML = "zoom: 1";
      labels.appendChild(labelZoom);
      labels.setAttribute(
        "style",
        ` 
        position: absolute;
        top: 0;
        left: 0;
        background: rgba(0,0,0,0.2);
        padding: 20px;
      `
      );
      canvas.appendChild(labels);
    }

    var link = svg
      .append("g")
      .attr("class", "links")
      .style("stroke", "#aaa")
      .style("opacity", 0.9)
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
      .selectAll("rect")
      .data(dataNodes)
      .enter()
      .append("g")
      .attr("opacity", function (d) {
        return d.level === 1 ? 1 : 0;
      })
      .attr("class", function (d) {
        return `node-item node-item-level-${d.level} node-item-zoom-min-${d.visibleZoomMin} node-item-zoom-max-${d.visibleZoomMax} `;
      })
      .on("click", function (d) {
        //console.log("jak jest?", d, d.clickActionType);
        if (d.clickActionType !== undefined) {
          if (d.clickActionType === ClickActionType.OPEN_LINK) {
            if (d.windowUrl !== undefined) {
              window.open(d.windowUrl, "_blank");
            }
          }
          if (d.clickActionType === ClickActionType.OPEN_MODAL) {
            if (d.modalBody !== undefined && d.modalTitle !== undefined) {
              showStandardModal(d.modalTitle, d.modalBody);
            }
          }
        }
      })
	  .on("mouseover", function(d) {
        d3.select(this).style("cursor", "pointer"); 
      })
	  .on("mouseout", function(d) {
        d3.select(this).style("cursor", "default"); 
      });

    node
      .append("rect")
      .attr("class", "node-circle")
      .attr("width", function (d) {
        return d.radius;
      })
      .attr("height", function (d) {
        return d.radius;
      })
      .attr("fill", function (d) {
        if (d.icon === undefined) {
          return d.color;
        }
        if (d.icon.length === 0) {
          return d.color;
        }
        return `url(#image-pattern-${d.id})`;
      });

    node
      .append("rect")
      .attr("class", "node-circle")
      .attr("width", function (d) {
        return d.radius;
      })
      .attr("height", function (d) {
        return d.radius;
      })
      .attr("fill", function (d) {
        if (d.icon === undefined) {
          return d.color;
        }
        if (d.icon.length === 0) {
          return d.color;
        }
        return `url(#image-pattern-${d.id})`;
      });

    node
      .append("defs")
      .append("pattern")
      .attr("id", function (d) {
        return `image-pattern-${d.id}`;
      })
      .attr("x", "0%")
      .attr("y", "0%")
      .attr("height", "100%")
      .attr("width", "100%")
      .attr("viewBox", function (d) {
        return `0 0 ${d.radius} ${d.radius}`;
      })
      .append("image")
      .attr("x", "0%")
      .attr("y", "0%")
      .attr("width", function (d) {
        return d.radius;
      })
      .attr("height", function (d) {
        return d.radius;
      })
      .attr("xlink:href", function (d) {
        return d.icon !== undefined ? d.icon : "";
      });

    const fontSize = [20, 15, 6, 3, 2];
    const transformText = [0, 45, 23, 6, 2];
	
    node
      .append("text")
      .attr("class", function (d) {
        return `node-label node-level-${d.level} node-zoom-min-${d.visibleZoomMin} node-zoom-max-${d.visibleZoomMax} `;
      })
      .text(function (d) {
        return d.name;
      })
      .attr("font-size", function (d) {
        return fontSize[d.level];
      })
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(0,0,0,0.7)")
      .attr("transform", function (d) {
		return `translate(${d.radius/2}, ${transformText[d.level]})`;
      })
      .attr("alignment-baseline", "central");

    if (simulation) {
      simulation.nodes(dataNodes as any).on("tick", () => ticked(link, node));
      (simulation.force("link") as any).links(dataLinks);
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
  // refresh links
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
      return "#ffffff";
    });

  // refresh nodes position
  node.attr("transform", function (d: any) {
    return "translate(" + d.x + " " + d.y + ")";
  });
};

const prepareDataNodes = (input: any) => {
  const results: DataNode[] = [];

  const lvlSize = [50, 50, 20, 5, 1];
  const getRadius = (lvl: number) => lvlSize[lvl];
  const zoomMap = {
    0: {
      visibleZoomMin: 0,
      visibleZoomMax: 1,
    },
    1: {
      visibleZoomMin: 0,
      visibleZoomMax: 1.3,
    },
    2: {
      visibleZoomMin: 1.1,
      visibleZoomMax: 5.1,
    },
    3: {
      visibleZoomMin: 2.7,
      visibleZoomMax: 9,
    },
    4: {
      visibleZoomMin: 1.5,
      visibleZoomMax: 7,
    },
  };

  input.forEach((e: InputData) => {
    let level = 0;
    
    if (e.level === "1 - Pierwszy") {
      level = 1;
    } else if (e.level === "2 - Drugi") {
      level = 2;
    } else if (e.level === "3 - trzeci") {
      level = 3;
    } else {
      level = Number(e.level);
    }

    let radius = getRadius(level);
    let visibleZoomMin = (zoomMap as any)[level].visibleZoomMin;
    let visibleZoomMax = (zoomMap as any)[level].visibleZoomMax;

    let icon = "";
    let iconRadius = getRadius(level);
    if (e.icon !== undefined && e.icon.length > 0) {
      icon = "./" + e.icon;
    }

    let action = "";
    let clickActionType = undefined;
    if (e.action !== undefined && e.action.length > 0) {
      action = e.action;
      if (e.action === "OPEN_LINK") {
        clickActionType = ClickActionType.OPEN_LINK;
      } else if (e.action === "OPEN_MODAL") {
        clickActionType = ClickActionType.OPEN_MODAL;
      }
    }

    let name = "";
    if (e.category_name !== undefined && e.category_name.length > 0) {
      name = e.category_name;
    }

    let parentId = "0";
    if (e.parent !== undefined && e.parent.length > 0) {
      parentId = e.parent;
    }

    let newRow: DataNode = {
      id: e.id,
      name: name,
      color: "red",
      level: level,
      visibleZoomMin: visibleZoomMin,
      visibleZoomMax: visibleZoomMax,
      icon: icon,
      iconRadius: iconRadius,
      action: action,
      parentId: parentId,
      radius: radius,
      parentIds: [],
      clickActionType: clickActionType,
      modalTitle: e.title,
      modalBody: e.innerhtml,
      windowUrl: e.link_do_filmu,
      // opis_filmu
    };

    results.push(newRow);
  });

  const ROOT_ID = "0";
  const levelsMap = {
    "1": "#A4CDDF",
    "8": "#F7C6DE",
    "18": "#D67A74",
    "40": "#F6D355",
    "49": "#6AB575",
    "57": "#BB937F",
    "66": "#ECF0BB",
    "73": "#A88EBB",
  };

  results.forEach((node) => {
    if (node.id !== ROOT_ID) {
      node.parentIds = [ROOT_ID, node.id];

      if (node.parentId !== ROOT_ID) {
        node.parentIds.push(node.parentId);

        results.forEach((n1) => {
          if (n1.id === node.parentId) {
            if (n1.parentId !== ROOT_ID) {
              if (node.parentIds.indexOf(n1.parentId) !== -1) {
                node.parentIds.push(n1.parentId);
              }
            }

            if (n1.parentId !== ROOT_ID) {
              results.forEach((n2) => {
                if (n2.id === n1.parentId) {
                  node.parentIds.push(n2.id);

                  if (n2.parentId !== ROOT_ID) {
                    results.forEach((n3) => {
                      if (n3.id === n2.parentId) {
                        if (n3.parentId !== ROOT_ID) {
                          if (node.parentIds.indexOf(n3.parentId) !== -1) {
                            node.parentIds.push(n3.parentId);
                          }
                        }
                      }
                    });
                  }
                }
              });
            }
          }
        });
      }
    }

    Object.keys(levelsMap).forEach((nodeId) => {
      if (node.parentIds.indexOf(nodeId) !== -1) {
        node.color = (levelsMap as any)[nodeId as any];
      }
    });
  });

  return results;
};

const showStandardModal = (title: string, body: string) => {
  const modalHTML = document.createElement("div");
  modalHTML.setAttribute("class", "modal-with-text");
  modalHTML.setAttribute(
    "style",
    ` 
      position: fixed; 
      z-index: 1; 
      left: 0;
      top: 0;
      width: 100%; 
      height: 100%; 
      overflow: auto; 
      background-color: rgb(0,0,0);
      background-color: rgba(0,0,0,0.4);
      `
  );

  const modalContent = document.createElement("div");
  modalContent.setAttribute("class", "modal-content");
  modalContent.setAttribute(
    "style",
    ` 
    background-color: #fefefe;
    margin: 15% auto; 
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 650px;
    text-align: center;
    position: relative;
    `
  );

  const modalBtnClose = document.createElement("div");
  modalBtnClose.setAttribute("class", "btn-close");
  modalBtnClose.innerHTML = "&#10006;";
  modalBtnClose.setAttribute(
    "style",
    `
  color: #000;
  position: absolute;
  top: 20px; 
  right: 20px;
  font-size: 22px;
  font-weight: normal;
  cursor: pointer;
  `
  );

  const modalTitle = document.createElement("h2");
  modalTitle.setAttribute("class", "title");
  modalTitle.innerHTML = title;

  const modalBody = document.createElement("div");
  modalBody.setAttribute("class", "body");
  modalBody.innerHTML = body;

  modalContent.appendChild(modalBtnClose);
  modalContent.appendChild(modalTitle);
  modalContent.appendChild(modalBody);

  modalHTML.appendChild(modalContent);

  modalBtnClose.onclick = function () {
    modalHTML.remove();
  };

  window.onclick = (event: any) => {
    if (event.target == modalHTML) {
      modalHTML.remove();
    }
  };

  document.body.appendChild(modalHTML);
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
// var json_data_file_name = "./data/2020_06_01_start.json";
var json_data_file_name = "./data/2020_10_18_v3.json";

d3.json(json_data_file_name, onDataLoaded as any);
