"use strict";
console.log('Halo 2!');
var ClickActionType;
(function (ClickActionType) {
    ClickActionType["OPEN_LINK"] = "OPEN_LINK";
    ClickActionType["OPEN_MODAL"] = "OPEN_MODAL";
})(ClickActionType || (ClickActionType = {}));
var onDataLoaded = function (error, graph) {
    if (error) {
        throw error;
    }
    var dataNodes = prepareDataNodes(graph);
    console.log("input data: ", dataNodes);
    var dataLinks = dataNodes.map(function (e) {
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
            .call(d3
            .zoom()
            .scaleExtent([0.2, 40])
            .on("zoom", function () {
            svg.attr("transform", d3.event.transform);
            zoom_value_k = d3.event.transform.k;
            ticked(link, node);
            var labelZoom = document.querySelector(".label-zoom");
            if (labelZoom !== null) {
                labelZoom.innerHTML = "zoom: " + zoom_value_k.toFixed(2);
            }
            svg
                .selectAll(".node-item")
                .transition()
                .duration(50)
                .style("opacity", function (d) {
                if (d.id === "0") {
                    return 0;
                }
                // return 1;
                if (d.level === 1 && zoom_value_k <= 1.4 && zoom_value_k > 0) {
                    return 1;
                }
                if (zoom_value_k <= d.visibleZoomMax) {
                    var op = interpolate(zoom_value_k, d.visibleZoomMin, d.visibleZoomMax, 0.01, 0.99, 0.5);
                    return op;
                }
                else {
                    var op = interpolate(zoom_value_k, d.visibleZoomMax, d.visibleZoomMax + d.visibleZoomMax * 1.1, 0.99, 0.01, 0.5);
                    return op;
                }
            });
        }))
            .append("g")
            .attr("class", "canvas");
        var simulation_strength = -500;
        var simulation_theta = 1.0;
        var simulation_distanceMax = 100;
        var simulation = d3
            .forceSimulation(dataNodes)
            .force("link", d3.forceLink().id(function (d) {
            return d.id;
        }))
            .force("charge", d3.forceManyBody().strength(simulation_strength))
            .force("charge", d3
            .forceManyBody()
            .strength(simulation_strength)
            .theta(simulation_theta)
            .distanceMax(simulation_distanceMax))
            .force("collide", d3
            .forceCollide()
            .radius(function (d) { return 37; })
            .iterations(1.5))
            .force("center", d3.forceCenter(width / 2, height / 2));
        var canvas = document.querySelector("#canvas");
        if (canvas !== null) {
            var labels = document.createElement("div");
            labels.setAttribute("class", "labels");
            var labelZoom = document.createElement("div");
            labelZoom.setAttribute("class", "label-zoom");
            labelZoom.innerHTML = "zoom: 1";
            labels.appendChild(labelZoom);
            labels.setAttribute("style", " \n        position: absolute;\n        top: 0;\n        left: 0;\n        background: rgba(0,0,0,0.2);\n        padding: 20px;\n      ");
            canvas.appendChild(labels);
        }
        var link = svg
            .append("g")
            .attr("class", "links")
            .style("stroke", "#aaa")
            .style("opacity", 0.9)
            .selectAll("line")
            .data(dataLinks.filter(function (e) {
            return !(e.excluded !== undefined && e.excluded === true);
        }))
            .enter()
            .append("line")
            .attr("class", function (d) {
            return "node-link node-link-level-" + d.level + " node-link-zoom-min-" + d.visibleZoomMin + " node-link-zoom-max-" + d.visibleZoomMax + " ";
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
            return "node-item node-item-level-" + d.level + " node-item-zoom-min-" + d.visibleZoomMin + " node-item-zoom-max-" + d.visibleZoomMax + " ";
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
            return "url(#image-pattern-" + d.id + ")";
        });
        /* .call(
           d3
             .drag()
             .on("start", dragstarted)
             .on("drag", dragged)
             .on("end", dragended) as any
         ); */
        node
            .append("defs")
            .append("pattern")
            .attr("id", function (d) {
            return "image-pattern-" + d.id;
        })
            .attr("x", "0%")
            .attr("y", "0%")
            .attr("height", "100%")
            .attr("width", "100%")
            .attr("viewBox", function (d) {
            return "0 0 " + d.radius + " " + d.radius;
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
        var fontSize = [30, 20, 9, 5, 2];
        node
            .append("text")
            .attr("class", function (d) {
            return "node-label node-level-" + d.level + " node-zoom-min-" + d.visibleZoomMin + " node-zoom-max-" + d.visibleZoomMax + " ";
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
            return "translate(0, " + (d.radius + 5) + ")";
        })
            .attr("alignment-baseline", "central");
        if (simulation) {
            simulation.nodes(dataNodes).on("tick", function () { return ticked(link, node); });
            simulation.force("link").links(dataLinks);
        }
        function dragstarted(d) {
            if (!d3.event.active)
                simulation.alphaTarget(0.1).restart();
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
            if (!d3.event.active)
                simulation.alphaTarget(0);
        }
    }
    startGraph();
};
var ticked = function (link, node) {
    // refresh links
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
        return "#ffffff";
    });
    // refresh nodes position
    node.attr("transform", function (d) {
        return "translate(" + d.x + " " + d.y + ")";
    });
};
var prepareDataNodes = function (input) {
    var results = [];
    var lvlSize = [50, 40, 20, 10, 5];
    var getRadius = function (lvl) { return lvlSize[lvl]; };
    var zoomMap = {
        0: {
            visibleZoomMin: 0,
            visibleZoomMax: 1,
        },
        1: {
            visibleZoomMin: 0,
            visibleZoomMax: 0.8,
        },
        2: {
            visibleZoomMin: 1.1,
            visibleZoomMax: 2.1,
        },
        3: {
            visibleZoomMin: 2.3,
            visibleZoomMax: 5,
        },
        4: {
            visibleZoomMin: 5.0,
            visibleZoomMax: 6,
        },
    };
    input.forEach(function (e) {
        var level = 0;
        if (e.level === "1 - Pierwszy") {
            level = 1;
        }
        else if (e.level === "2 - Drugi") {
            level = 2;
        }
        else if (e.level === "3 - trzeci") {
            level = 3;
        }
        var radius = getRadius(level);
        var visibleZoomMin = zoomMap[level].visibleZoomMin;
        var visibleZoomMax = zoomMap[level].visibleZoomMax;
        var icon = "";
        var iconRadius = getRadius(level);
        if (e.icon !== undefined && e.icon.length > 0) {
            icon = "./" + e.icon;
        }
        var action = "";
        if (e.action !== undefined && e.action.length > 0) {
            action = e.action;
        }
        var name = "";
        if (e.category_name !== undefined && e.category_name.length > 0) {
            name = e.category_name;
        }
        var parentId = "0";
        if (e.parent !== undefined && e.parent.length > 0) {
            parentId = e.parent;
        }
        var newRow = {
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
        if (e.id === "1") {
            newRow.clickActionType = ClickActionType.OPEN_MODAL;
            newRow.modalTitle = "FILOZOFIA";
            newRow.modalBody = "<p>Na dnie każdej dyscypliny, jeżeli pogmerać odpowiednio głęboko, w pewnym momencie zaczyna się filozofia. W praktyce wygląda to tak, że ludzie faktycznie pracujący w jakiejś dziedzinie – fizycy, muzycy, meblarze, lekkoatleci;  ludzie faktycznie wykonujący jakąś konkretną pracę, czy to umysłową czy fizyczną – oczywiście drążą w jej podstawach, ale tylko tak długo, aż przynosi to jakąś korzyść. Od pewnego momentu zadawanie dalszych pytań przestaje jednak mieć sens praktyczny: są zbyt ogólne, zbyt abstrakcyjne, zbyt trudno jest wyciągnąć z odpowiedzi coś pożytecznego. To właśnie tutaj zaczyna się filozofia.</p><p>Nie zrozumcie mnie źle – nie mam na myśli niczego zdrożnego. Ale tak to po prostu wygląda w praktyce. Muzycy lubią gmerać w podstawach muzyki, dekonstruować ją, testować jej granice; ale trudno będzie znaleźć takiego, któremu zaświecą się oczy z ciekawością, kiedy zagaicie: „No dobra, ale <i>czym</i> właściwie jest muzyka?” Fizycy też lubią – przynajmniej niektórzy – dłubać w podstawach swojej dyscypliny, ale gwarantuję wam, że pytanie „Ale czy czas istnieje tak naprawdę, czy to jest tylko kategoria pojęciowa?” zadane na konferencji fizyków wywoła tylko pełną zażenowania ciszę.</p><p>Stąd odwieczne marzenie filozofów: żeby zejść w te głębie, w które ”praktycy” nie schodzą (dumnie określając gadanie o <i>tych sprawach</i> jako „pitolenie”), żeby zanurzyć się w odmętach abstrakcji i wrócić z perłą, dumnie potrząsając nią przed oczami „praktyków”, którzy następnie chciwie się na nią rzucą. Do dzisiaj trwają dyskusje, czy kiedykolwiek to naprawdę nastąpiło: czy istniał jakiś filozof, który odkrył w odmętach abstrakcji nowy gatunek muzyczny – ale taki, który naprawdę dobrze brzmiał – albo taki, który zaproponował fizykom nie „ciekawą myśl”, tylko użyteczne narzędzie, rozwiązujące konkretny problem.</p><p>W najgorszym razie filozofia to po prostu sztuka dla sztuki. Parafrazując Feynmana: filozofia jest jak seks. Jasne, płyną z niej czasem praktyczne korzyści, ale nie dlatego ją uprawiamy. Mnie osobiście przynosi sporą radość myśl, że tak naprawdę każda szanowana dyscyplina ludzkiej aktywności to tylko maleńka pływająca wyspa, oświetlona kilkoma latarenkami, unosząca się na gigantycznym smolistym oceanie niewiedzy. Tak, to zdecydowanie miła myśl...</p>";
        }
        ;
        if (e.id === "8") {
            newRow.clickActionType = ClickActionType.OPEN_MODAL;
            newRow.modalTitle = "MATEMATYKA";
            newRow.modalBody = "<p>Matematyka to dziwna bestia, a ludzie, którzy ją kochają i rozumieją, to jeszcze dziwniejsze bestie. Matematyka to to, co pozostaje ze świata, jeżeli się z niego wyciśnie całą treść. Kiedy wziąć na warsztat dowolne pojęcie matematyczne: zbiór, przestrzeń, prawdopodobieństwo – na początku wszystko jest OK. Wyobrażamy sobie, kolejno, worek z kulkami, świat wokół siebie albo odległości między miastami, rzuty kostką... proste. Potem jednak pytamy matematyka, czym jest <i>tak naprawdę</i> przestrzeń. Albo zbiór. I już po kilku chwilach między palcami nie pozostaje nam nic, co potrafilibyśmy nazwać, zrozumieć albo określić.<\p><p>Matematyka to potężna, bujna, piękna struktura zbudowana na kompletnie niczym. Jej podstawowe pojęcia są całkowicie pozbawione treści, a zadaniem matematyka jest żonglować nimi w pewien szczególny, uporządkowany sposób. Matematyka to dziedzina czystych *relacji*, czystych *struktur*. Kompletne wariactwo. Kolejne piętra definicji, twierdzeń, lematów, teorii, które w pewnym momencie rozumiemy tak naprawdę tylko za pośrednictwem znaczków na papierze – które mogłyby być zupełnie inne.</p><p>I teraz puenta: z tego gąszczu czystej formy czasem wyłania się... coś. Jakaś zupełnie namacalna, konkretna rzecz, o własnym charakterze. Jak pi. Albo, lepiej, zbiór Mandelbrota. I w tym momencie mózg wywija mi się na drugą stronę – bo jakim właściwie sposobem gdzieś w tym świecie widm wyrodziła się taka samodzielna, tętniąca od życia osobowość, równie doprecyzowana, konkretna i swoista, co ja sam albo planeta Wenus. I to jest prawdziwa zagadka matematyki.</p>";
        }
        ;
        if (e.id === "40") {
            newRow.clickActionType = ClickActionType.OPEN_MODAL;
            newRow.modalTitle = "CHEMIA";
            newRow.modalBody = "<p>Chemia ma fatalną reklamę. Nie ma chyba przedmiotu szkolnego, który byłby tak bezosobowy, smętny i najzwyczajniej w świecie nudny, co chemia. Kiedy jednak poczyta się trochę na temat świata – na temat tego, jak działają planety, i życie, i ciało ludzkie, i ropa naftowa, i lekarstwa, i komputery: nagle się okazuje, że chemia i jej okolice to jedyne nauki, od których można oczekiwać jakichkolwiek realnych odpowiedzi.</p><p>Wystarczy pomyśleć o LEGO. Albo o literach. Cząstki elementarne to klocki lego. Albo litery. I fizycy z dumą będą godzinami opowiadać o tym, że klocki dzielą się na jedno- i dwu-wypustkowe, i że litery dzielą się na takie z brzuszkiem i takie z kropką, i że jedne są symetryczne, a drugie nie. Tylko potem pojawia się pytanie, jak zbudować w pełni funkcjonalną replikę Millenium Falcona z wysuwającym się działkiem laserowym, albo jak skomponować naprawdę wzruszający sonet. I od tego właśnie są chemicy.</p><p>Jeśli wiesz, o czym ja mówię.</p>";
        }
        ;
        results.push(newRow);
    });
    var youtube1nextRow = {
        id: "36_1",
        name: "Bardzo kulturalne szympansy",
        color: "red",
        level: 4,
        visibleZoomMin: zoomMap[4].visibleZoomMin,
        visibleZoomMax: zoomMap[4].visibleZoomMax,
        icon: "./img/youtube_thumb_parent_id_36.resized.jpg",
        iconRadius: getRadius(4),
        action: "",
        parentId: "36",
        radius: getRadius(4),
        clickActionType: ClickActionType.OPEN_LINK,
        windowUrl: "https://youtu.be/3Cec-5MOTlw?t=901",
        parentIds: [],
    };
    var youtube2nextRow = {
        id: "67_1",
        name: "Bardzo kulturalne szympansy",
        color: "red",
        level: 4,
        visibleZoomMin: zoomMap[4].visibleZoomMin,
        visibleZoomMax: zoomMap[4].visibleZoomMax,
        icon: "./img/youtube_thumb_parent_id_67.resized.jpg",
        iconRadius: getRadius(4),
        action: "",
        parentId: "67",
        radius: getRadius(4),
        clickActionType: ClickActionType.OPEN_LINK,
        windowUrl: "https://youtu.be/d36GBndnL38?t=66",
        parentIds: [],
    };
    var youtube3nextRow = {
        id: "74_1",
        name: "Narodziny dysków galaktycznych",
        color: "red",
        level: 4,
        visibleZoomMin: zoomMap[4].visibleZoomMin,
        visibleZoomMax: zoomMap[4].visibleZoomMax,
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
    var ROOT_ID = "0";
    var levelsMap = {
        "1": "#A4CDDF",
        "8": "#F7C6DE",
        "18": "#D67A74",
        "40": "#F6D355",
        "49": "#6AB575",
        "57": "#BB937F",
        "66": "#ECF0BB",
        "73": "#A88EBB",
    };
    results.forEach(function (node) {
        if (node.id !== ROOT_ID) {
            node.parentIds = [ROOT_ID, node.id];
            if (node.parentId !== ROOT_ID) {
                node.parentIds.push(node.parentId);
                results.forEach(function (n1) {
                    if (n1.id === node.parentId) {
                        if (n1.parentId !== ROOT_ID) {
                            if (node.parentIds.indexOf(n1.parentId) !== -1) {
                                node.parentIds.push(n1.parentId);
                            }
                        }
                        if (n1.parentId !== ROOT_ID) {
                            results.forEach(function (n2) {
                                if (n2.id === n1.parentId) {
                                    node.parentIds.push(n2.id);
                                    if (n2.parentId !== ROOT_ID) {
                                        results.forEach(function (n3) {
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
        Object.keys(levelsMap).forEach(function (nodeId) {
            if (node.parentIds.indexOf(nodeId) !== -1) {
                node.color = levelsMap[nodeId];
            }
        });
    });
    return results;
};
var showStandardModal = function (title, body) {
    var modalHTML = document.createElement("div");
    modalHTML.setAttribute("class", "modal-with-text");
    modalHTML.setAttribute("style", " \n      position: fixed; \n      z-index: 1; \n      left: 0;\n      top: 0;\n      width: 100%; \n      height: 100%; \n      overflow: auto; \n      background-color: rgb(0,0,0);\n      background-color: rgba(0,0,0,0.4);\n      ");
    var modalContent = document.createElement("div");
    modalContent.setAttribute("class", "modal-content");
    modalContent.setAttribute("style", " \n    background-color: #fefefe;\n    margin: 15% auto; \n    padding: 20px;\n    border: 1px solid #888;\n    width: 80%;\n    max-width: 650px;\n    text-align: center;\n    position: relative;\n    ");
    var modalBtnClose = document.createElement("div");
    modalBtnClose.setAttribute("class", "btn-close");
    modalBtnClose.innerHTML = "&#10006;";
    modalBtnClose.setAttribute("style", "\n  color: #000;\n  position: absolute;\n  top: 20px; \n  right: 20px;\n  font-size: 22px;\n  font-weight: normal;\n  cursor: pointer;\n  ");
    var modalTitle = document.createElement("h2");
    modalTitle.setAttribute("class", "title");
    modalTitle.innerHTML = title;
    var modalBody = document.createElement("div");
    modalBody.setAttribute("class", "body");
    modalBody.innerHTML = body;
    modalContent.appendChild(modalBtnClose);
    modalContent.appendChild(modalTitle);
    modalContent.appendChild(modalBody);
    modalHTML.appendChild(modalContent);
    modalBtnClose.onclick = function () {
        modalHTML.remove();
    };
    window.onclick = function (event) {
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
var interpolate = function (value, s1, s2, t1, t2, slope) {
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
    function b1(t) {
        return t * t;
    }
    function b2(t) {
        return 2 * t * (1 - t);
    }
    function b3(t) {
        return (1 - t) * (1 - t);
    }
};
function checkImage(imageSrc, good, bad) {
    var img = new Image();
    img.onload = good;
    img.onerror = bad;
    img.src = imageSrc;
}
var json_data_file_name = "./data/output.json";
d3.json(json_data_file_name, onDataLoaded);
