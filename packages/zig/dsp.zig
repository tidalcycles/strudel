const std = @import("std");

export fn saw(t: f64) f64 {
    return ((@mod(110.0 * t, 1.0)) - 0.5) * 2.0;
}
