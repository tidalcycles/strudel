const std = @import("std");

export fn saw(t: f64, f: f64) f64 {
    return ((@mod(f * t, 1.0)) - 0.5) * 2.0;
}
