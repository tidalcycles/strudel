export function saw(t: f64, f: f64): f64 {
  return (((f * t * 1.0) % 1.0) - 0.5) * 2.0;
}
