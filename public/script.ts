interface InputData {
  level: string | undefined;
  icon: string | undefined;
  id: string;
  action: string | undefined;
  category_name: string | undefined;
  parent: string | undefined;
}

console.log("Halo 3!");

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
                // return 1;
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
                    0.5
                  );
                  return op;
                } else {
                  const op = interpolate(
                    zoom_value_k,
                    d.visibleZoomMax,
                    d.visibleZoomMax + d.visibleZoomMax * 1.1,
                    0.99,
                    0.01,
                    0.5
                  );
                  return op;
                }
              } as any);
          }) as any
      )
      .append("g")
      .attr("class", "canvas");

    const simulation_strength = -200;
    const simulation_theta = 0.8;
    const simulation_distanceMax = 50;

    var simulation = d3
      .forceSimulation(dataNodes as any)
      .force(
        "link",
        d3.forceLink().id(function (d: any) {
          return d.id;
        })
      )
      .force("charge", d3.forceManyBody().strength(simulation_strength))
      .force(
        "charge",
        d3
          .forceManyBody()
          .strength(simulation_strength)
          .theta(simulation_theta)
          .distanceMax(simulation_distanceMax)
      )
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d) => 40)
          .iterations(1.5)
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
      .selectAll("circle")
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
      });

    node
      .append("circle")
      .attr("class", "node-circle")
      .attr("r", function (d) {
        return d.radius;
      })
      .attr("fill", function (d) {
        if (d.icon === undefined) {
          return d.color;
        }
        if (d.icon.length === 0) {
          return d.color;
        }
        // return `#${d.color}`
        return `url(#image-pattern-${d.id})`;
      });
    /* .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any
      ); */

    node
      .append("circle")
      .attr("class", "node-circle")
      .attr("r", function (d) {
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

    node
      .append("text")
      .attr("class", function (d) {
        return `node-label node-level-${d.level} node-zoom-min-${d.visibleZoomMin} node-zoom-max-${d.visibleZoomMax} `;
      })
      .text(function (d) {
        return d.name;
      })
      .attr("font-size", function (d) {
        return (5 - d.level) * 4;
      })
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(0,0,0,0.7)")
      .attr("transform", function (d) {
        return `translate(0, ${d.radius + 10})`;
      })
      .attr("alignment-baseline", "central");

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
      return "#a4a4a4";
    });

  // refresh nodes position
  node.attr("transform", function (d: any) {
    return "translate(" + d.x + " " + d.y + ")";
  });
};

const prepareDataNodes = (input: any) => {
  const results: DataNode[] = [];

  const getRadius = (lvl: number) => (5 - lvl) * 10;
  const zoomMap = {
    0: {
      visibleZoomMin: 0,
      visibleZoomMax: 1,
    },
    1: {
      visibleZoomMin: 0,
      visibleZoomMax: 1.8,
    },
    2: {
      visibleZoomMin: 1.3,
      visibleZoomMax: 3,
    },
    3: {
      visibleZoomMin: 1.9,
      visibleZoomMax: 5,
    },
    4: {
      visibleZoomMin: 2.0,
      visibleZoomMax: 6,
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
    };

    if (e.id === "37" || e.id === "1") {
      newRow.clickActionType = ClickActionType.OPEN_MODAL;
      newRow.modalTitle = "Piece w jądrach gwiazd";
      newRow.modalBody = `<p>W Słońcu jest <i>gorąco</i>.</p>`;
    }

    results.push(newRow);
  });

  let youtube1nextRow: DataNode = {
    id: "36_1",
    name: "Bardzo kulturalne szympansy",
    color: "red",
    level: 4,
    visibleZoomMin: (zoomMap as any)[4].visibleZoomMin,
    visibleZoomMax: (zoomMap as any)[4].visibleZoomMax,
    icon: "./img/youtube_thumb_parent_id_36.resized.jpg",
    iconRadius: getRadius(4),
    action: "",
    parentId: "36",
    radius: getRadius(4),
    clickActionType: ClickActionType.OPEN_LINK,
    windowUrl: "https://youtu.be/3Cec-5MOTlw?t=901",
    parentIds: [],
  };
  let youtube2nextRow: DataNode = {
    id: "67_1",
    name: "Bardzo kulturalne szympansy",
    color: "red",
    level: 4,
    visibleZoomMin: (zoomMap as any)[4].visibleZoomMin,
    visibleZoomMax: (zoomMap as any)[4].visibleZoomMax,
    icon: "./img/youtube_thumb_parent_id_67.resized.jpg",
    iconRadius: getRadius(4),
    action: "",
    parentId: "67",
    radius: getRadius(4),
    clickActionType: ClickActionType.OPEN_LINK,
    windowUrl: "https://youtu.be/d36GBndnL38?t=66",
    parentIds: [],
  };
  let youtube3nextRow: DataNode = {
    id: "74_1",
    name: "Narodziny dysków galaktycznych",
    color: "red",
    level: 4,
    visibleZoomMin: (zoomMap as any)[4].visibleZoomMin,
    visibleZoomMax: (zoomMap as any)[4].visibleZoomMax,
    icon: "./img/youtube_thumb_parent_id_74.resized.jpg",
    iconRadius: getRadius(4),
    action: "",
    parentId: "74",
    radius: getRadius(4),
    clickActionType: ClickActionType.OPEN_LINK,
    windowUrl: "https://youtu.be/riZfnPrk7OU?t=1013",
    parentIds: [],
  };
  results.push(youtube1nextRow);
  results.push(youtube2nextRow);
  results.push(youtube3nextRow);

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

var json_data_file_name = "./data/output.json";

d3.json(json_data_file_name, onDataLoaded as any);

(() => {
  const spreadsheetId = "1fBDVRtbeD96DwjWutWVtKwnPOeYnK4SwdIWnx1KRePs";
  const APIKey = "999158420743-0ku1i8qos66biv3jtdi30mgpacg2p2p1.apps.googleusercontent.com";
  console.log("request...");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/dane-v2!A1:K?key=${APIKey}`
  fetch(
    url,
    {}
  )
    .then((res) => {
      console.log("read with succes::", res);
    })
    .catch((err) => {
      console.error("err", err);
    });
})();
