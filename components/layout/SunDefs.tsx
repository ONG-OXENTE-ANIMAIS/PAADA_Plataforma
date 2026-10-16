/** Símbolo #sol usado por todo o site via <use href="#sol" />. */
export default function SunDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="sol" viewBox="0 0 24 24">
          <g
            stroke="currentColor"
            strokeWidth="3.1"
            strokeLinecap="round"
            fill="none"
          >
            <line x1="12" y1="3" x2="12" y2="21" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
            <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
