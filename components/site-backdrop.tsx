// Ambient, site-wide backdrop: two slow-drifting brand-color glows plus a few faint diagonal
// light streaks sweeping across — an abstract "always moving" motif fitting a premium ride
// service, without drawing a literal car. Purely decorative: fixed behind all page content,
// very low opacity so it never competes with text, and inert to input/AT.
export function SiteBackdrop() {
  return (
    <div className="site-backdrop" aria-hidden="true">
      <span className="backdrop-streak" />
      <span className="backdrop-streak" />
      <span className="backdrop-streak" />
    </div>
  )
}
