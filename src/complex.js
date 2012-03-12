// The extended complex plane: complex numbers + the point at infinity.
var Inf = new Object;
Inf.toString = function() { return "Inf"; };

// Some well-known values
var Zero = complex(0, 0);
var One = complex(1, 0);
var MinusOne = complex(-1, 0);

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

// complex :: C -> C
// Return the negation of a complex number:
// z = a + ib => -z = -a - ib
function cneg(z) {
  return cmult(MinusOne, z);
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