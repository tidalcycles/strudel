#include <math.h>
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
double saw(double t, double f) {
    return fmod((f * t * 1.0), 1.0) - 0.5 * 2.0;
}
