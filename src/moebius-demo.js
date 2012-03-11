$.ready(function() {
  function memoiseF() {
    // Return the Moebius transformation corresponding to the input parameters.
    a = [parseFloat(document.getElementById("a-r").value), parseFloat(document.getElementById("a-i").value)];
    b = [parseFloat(document.getElementById("b-r").value), parseFloat(document.getElementById("b-i").value)];
    c = [parseFloat(document.getElementById("c-r").value), parseFloat(document.getElementById("c-i").value)];
    d = [parseFloat(document.getElementById("d-r").value), parseFloat(document.getElementById("d-i").value)];
    return function(z) {
      return moebius(z, a, b, c, d);
    }
  }
  
  function makePlane(planeName, h, w, lines) {
    var r = d3.select(planeName).append("svg")
      .attr("height", h)
      .attr("width", w)
      .append("g")
      .attr("fill", "none")
      .attr("stroke-width", 2)
      .attr("stroke", "black");
    makeLines(r, lines);
    return r;
  }
  
  // Initial conditions, data.
  var h = 300;
  var w = h;
  var f = memoiseF();
  
  var minX = -2, maxX = 2
  // Distance between lines
  var grid = d3.range(minX, maxX + 1, 0.2);
  // Distance between points on a line
  var pointsOnLine = d3.range(minX, maxX + 1, 0.05);
  var x = d3.scale.linear()
    .domain([minX, maxX])
    .range([0, h]);
  var y = d3.scale.linear()
    .domain([minX, maxX])
    .range([h, 0]); // Invert the scale so the origin is in the BOTTOM left corner
  var lineMaker = d3.svg.line()
      .x(function(d) { return x(d[0]); })
      .y(function(d) { return y(d[1]); });
  
  function hlines(gridResolution, pointResolution) {
    return gridResolution.map(function(i) {
      return pointResolution.map(function(j) {
        return complex(j, i);
      });
    });
  }
  
  function vlines(gridResolution, pointResolution) {
    return gridResolution.map(function(i) {
      return pointResolution.map(function(j) {
        return complex(i, j);
      });
    });
  }
  
  function makeGrid(gridResolution, pointResolution) {
    return hlines(gridResolution, pointResolution)
             .concat(vlines(gridResolution, pointResolution));
  }
  
  function updateWplane(zlines) {
    var lastw = [0,0];
    for (var lineI = 0; lineI < wlines.length; lineI++) {
      for (var pointI = 0; pointI < wlines[lineI].length; pointI++) {
        w = f(zlines[lineI][pointI]);
        if (w == Inf) {
          // If f(z) = Inf then we pretend that Inf is really a point
          // outside of visual range that's on the ray drawn from
          // the origin through lastw. Think of the resulting point
          // as being the closest point to lastw on a circle centred
          // on the origin and of infinite radius.
  
          // Multiplying by n + 0i (n a real) means scaling without
          // rotating.
          w = cmult(lastw, complex(100, 0));
        }
        wlines[lineI][pointI] = w;
        lastw = w;
      }
    }
  }
  
  var zlines = makeGrid(grid, pointsOnLine);
  var wlines = makeGrid(grid, pointsOnLine);
  var zplane = makePlane("#z-plane", h, w, zlines);
  var wplane = makePlane("#w-plane", h, w, wlines);
  
  updateWplane(zlines);
  drawLines(wplane, wlines);
  
  d3.select("#go-button").on("click", function() {
    f = memoiseF();
  
    if (czero(csub(cmult(a, d), cmult(b, c)))) {
      alert("Not a Moebius transform!\nMerely a constant function f(z) = " + JSON.stringify(f(complex(1, 0))));
    }
  
    // Mutate the w-plane data in place so d3 can automatically
    // pick up the changes.
    updateWplane(zlines);
    drawLines(wplane, wlines);
  });
  
  function drawLines(planeDiv, arr) {
    planeDiv.selectAll(".line")
      .transition()
      .ease("linear")
      .attr("d", lineMaker);
  }
  
  function makeLines(planeDiv, arr) {
    planeDiv.selectAll(".line")
      .data(arr)
      .enter().append("path")
        .attr("class", "line")
        .attr("d", lineMaker);
  }
  
  // The extended complex plane: complex numbers + the point at infinity.
  
  var Inf = new Object;
  Inf.toString = function() { return "Inf"; };
  
  var Zero = complex(0, 0);
  
  // complex :: R -> R -> C
  function complex(real, imaginary) {
    return [real, imaginary];
  }
  
  // cmult :: C -> C -> C
  function cmult(z, w) {
    if (z == Inf || w == Inf) { return Inf; }
  
    var a = z[0]; var b = z[1]; var c = w[0]; var d = w[1];
    return complex(a*c - b*d, a*d + b*c);
  }
  
  // cadd :: C -> C -> C
  function cadd(z, w) {
    if (z == Inf || w == Inf) { return Inf; }
  
    var a = z[0]; var b = z[1]; var c = w[0]; var d = w[1];
    return complex(a + c, b + d);
  }
  
  // csub :: C -> C -> C
  function csub(z, w) {
    if (z == Inf || w == Inf) { return Inf; }
  
    var a = z[0]; var b = z[1]; var c = w[0]; var d = w[1];
    return complex(a - c, b - d);
  }
  
  // cdiv :: C -> C -> C
  function cdiv(z, w) {
    if (z == Inf) { return Inf; }
    if (w == Inf) { return complex(0, 0); }
    if (czero(w)) { return Inf; }
  
    var a = z[0]; var b = z[1]; var c = w[0]; var d = w[1];
  
    var denominator = c*c + d*d;
    if (denominator < 1e-3) { return Inf; }
  
    return complex((a*c + b*d) / denominator , (b*c - a*d) / denominator);
  }
  
  // cnorm :: C -> R
  function cnorm(z) {
    return Math.sqrt(z[0]*z[0] + z[1]*z[1]);
  }
  
  // czero :: C -> Bool
  function czero(z) {
    return cnorm(z) < 1e-3;
  }
  
  // moebius :: C -> C -> C -> C -> C
  function moebius(z, a, b, c, d) {
    // f(z) = (az + b) / (cz + d)
    if (z == Inf) {
      return czero(c) ? Inf : cdiv(a, c);
    } else {
      return cdiv((cadd(cmult(a, z), b)), (cadd(cmult(c, z), d)));
    }
  }
  
  function log(s) {
    return d3.select("body").append("p").text(s);
  }
  
  function assert_equal(a, b) {
    // Using toString() is completely lame, but it means we can
    // compare lists and integers easily.
    if (a.toString() != b.toString()) {
      log("Not equal: " + JSON.stringify(a) + " and " + JSON.stringify(b));
    }
  }
  
  assert_equal(Inf, cdiv(complex(1,0), complex(0,0)));
  assert_equal(complex(3,7), cadd(complex(1,3), complex(2,4)));
  assert_equal(Inf, cadd(Inf, complex(0,0)));
  assert_equal(Inf, cadd(complex(0,0), Inf));
  assert_equal(complex(0, 0), csub(complex(1, 1), complex(1, 1)));
  assert_equal(Inf, moebius(complex(0,0), complex(1, 0), Zero, complex(1, 0), Zero));
  assert_equal(complex(1, 0), moebius(complex(-2,-2), complex(1, 0), Zero, complex(1, 0), Zero));
});